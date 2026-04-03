"""
AI service – wraps AzureOpenAI for chat completions and embeddings.

Two separate Azure deployments:
  - West Europe  → chat completions (gpt-4.1-mini)
  - Sweden Central → embeddings (text-embedding-3-large, 1536 dims)
"""
from __future__ import annotations

import json
from typing import Any, AsyncIterator

import structlog
from openai import AsyncAzureOpenAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Azure OpenAI clients
# ---------------------------------------------------------------------------

_chat_client = AsyncAzureOpenAI(
    azure_endpoint=settings.AZURE_WEU_ENDPOINT,
    api_key=settings.AZURE_WEU_KEY,
    api_version=settings.AZURE_WEU_API_VERSION,
)

_embed_client = AsyncAzureOpenAI(
    azure_endpoint=settings.AZURE_SE_ENDPOINT,
    api_key=settings.AZURE_SE_KEY,
    api_version=settings.AZURE_SE_API_VERSION,
)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_DE = """Du bist fellaw, ein KI-Assistent für rechtliche Orientierung in Deutschland.

**Deine Aufgabe:**
Du hilfst Nutzern dabei, das deutsche Rechtssystem zu verstehen und ihre rechtliche Situation einzuschätzen.
Du gibst **keine formelle Rechtsberatung** und ersetzt keinen Rechtsanwalt (§ 3 RDG).

**Rechtsgebiete:**
- Strafrecht (StGB, StPO): Straftaten, polizeiliche Vernehmungen, Strafverfahren
- Zivilrecht (BGB, ZPO): Verträge, Schadensersatz, Klagen
- Verwaltungsrecht (VwGO): Widersprüche gegen Behördenbescheide
- Mietrecht: Mängel, Kündigung, Kaution
- Arbeitsrecht (AGG, KSchG): Kündigung, Diskriminierung, Abmahnung
- Sozialrecht (SGB II, SGB XII): Bürgergeld, ALG II, Sozialhilfe
- Ausländerrecht (AufenthG, AsylG): Aufenthaltstitel, Asyl, Abschiebung

**Verfahrenshinweise:**
- Erläutere Fristen (Widerspruchsfrist 1 Monat, Verjährungsfristen etc.)
- Erkläre Zuständigkeiten (Amtsgericht, Landgericht, Verwaltungsgericht)
- Weise auf kostenlose Hilfe hin: Rechtsantragstelle, Beratungshilfe (BerHG), Prozesskostenhilfe (PKH)
- Erkläre Akteneinsicht (§ 147 StPO, § 29 VwVfG)

**Sprache:**
Antworte auf Deutsch, es sei denn, der Nutzer schreibt auf Englisch. Du kannst beide Sprachen mischen, wenn das hilfreich ist.

**Wichtiger Hinweis:**
Weise immer darauf hin, dass wichtige Entscheidungen von einem zugelassenen Rechtsanwalt überprüft werden sollten.
Bei dringenden strafrechtlichen Angelegenheiten empfehle sofortige anwaltliche Beratung.
"""

# ---------------------------------------------------------------------------
# Retry decorator for transient API errors
# ---------------------------------------------------------------------------

_RETRY = retry(
    retry=retry_if_exception_type(Exception),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(3),
    reraise=True,
)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@_RETRY
async def chat_completion(
    messages: list[dict[str, str]],
    stream: bool = False,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str | AsyncIterator[str]:
    """
    Call the Azure OpenAI chat completion endpoint.

    Returns:
        If stream=False: the full response text as str.
        If stream=True:  an async iterator that yields text chunks.
    """
    log.info(
        "chat_completion.start",
        message_count=len(messages),
        stream=stream,
        temperature=temperature,
    )

    if stream:
        response = await _chat_client.chat.completions.create(
            model=settings.AZURE_CHAT_MODEL,
            messages=messages,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )

        async def _stream_generator() -> AsyncIterator[str]:
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        return _stream_generator()

    response = await _chat_client.chat.completions.create(
        model=settings.AZURE_CHAT_MODEL,
        messages=messages,  # type: ignore[arg-type]
        temperature=temperature,
        max_tokens=max_tokens,
        stream=False,
    )
    text = response.choices[0].message.content or ""
    log.info("chat_completion.done", tokens_used=response.usage.total_tokens if response.usage else None)
    return text


@_RETRY
async def get_embedding(text: str) -> list[float]:
    """
    Generate a 1536-dimensional embedding vector using text-embedding-3-large
    on the Sweden Central deployment.
    """
    # Truncate to ~8000 tokens to stay within model limits
    truncated = text[:32000]
    log.debug("get_embedding.start", text_length=len(truncated))

    response = await _embed_client.embeddings.create(
        model=settings.AZURE_EMBEDDING_MODEL,
        input=truncated,
        dimensions=settings.AZURE_EMBEDDING_DIMENSIONS,
    )
    embedding = response.data[0].embedding
    log.debug("get_embedding.done", dims=len(embedding))
    return embedding


async def analyze_document(text: str, document_type: str) -> dict[str, Any]:
    """
    AI-powered document analysis.

    Returns a dict with:
        summary, key_dates, key_persons, legal_implications,
        action_required, urgency
    """
    system = (
        "Du bist ein erfahrener Rechtsassistent, der Rechtsdokumente auf Deutsch analysiert. "
        "Antworte immer als valides JSON-Objekt ohne Markdown-Codeblöcke."
    )
    user_prompt = f"""Analysiere das folgende {document_type}-Dokument und gib ein JSON-Objekt zurück:

{{
  "summary": "Kurze Zusammenfassung (2-3 Sätze)",
  "key_dates": ["Liste relevanter Daten im Format YYYY-MM-DD oder beschreibend"],
  "key_persons": ["Liste von Personen/Institutionen"],
  "legal_implications": "Rechtliche Bedeutung und mögliche Konsequenzen",
  "action_required": "Welche Maßnahmen muss der Nutzer ergreifen?",
  "urgency": "low | medium | high | critical"
}}

Dokumenttext:
\"\"\"
{text[:6000]}
\"\"\""""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.1)
    assert isinstance(raw, str)

    try:
        # Strip possible markdown fences
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        log.warning("analyze_document.json_parse_failed", raw_response=raw[:200])
        return {
            "summary": raw[:500],
            "key_dates": [],
            "key_persons": [],
            "legal_implications": "Analyse fehlgeschlagen – bitte erneut versuchen.",
            "action_required": "Dokument manuell prüfen.",
            "urgency": "medium",
        }


async def extract_key_facts(text: str) -> list[str]:
    """
    Extract a list of key legal facts from a text passage.
    Returns a list of concise fact strings.
    """
    system = (
        "Du bist ein präziser Rechtsassistent. Extrahiere die wichtigsten rechtlichen "
        "Fakten aus dem Text. Antworte nur mit einem JSON-Array von Strings."
    )
    user_prompt = f"""Extrahiere die wichtigsten rechtlichen Fakten aus dem folgenden Text.
Antworte mit einem JSON-Array: ["Fakt 1", "Fakt 2", ...]

Text:
\"\"\"
{text[:4000]}
\"\"\""""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.1)
    assert isinstance(raw, str)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        result = json.loads(cleaned)
        if isinstance(result, list):
            return [str(item) for item in result]
        return []
    except (json.JSONDecodeError, IndexError):
        log.warning("extract_key_facts.json_parse_failed", raw=raw[:200])
        # Fall back to splitting by newlines
        return [line.strip("- •") for line in raw.split("\n") if line.strip()]
