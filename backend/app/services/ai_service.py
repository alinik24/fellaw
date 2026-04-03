"""
AI service – Model-agnostic wrapper for chat completions and embeddings.

Supports multiple AI providers:
  - OpenAI (standard API)
  - Azure OpenAI
  - Anthropic Claude
  - Google AI / Vertex AI
  - Cohere
  - Local models (Ollama, etc.)
"""
from __future__ import annotations

import json
from typing import Any, AsyncIterator

import structlog
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

log = structlog.get_logger(__name__)

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
# Client initialization
# ---------------------------------------------------------------------------

_chat_client = None
_embed_client = None


def _get_chat_client():
    """Lazy initialization of chat client based on configured provider."""
    global _chat_client
    if _chat_client is not None:
        return _chat_client

    config = settings.get_chat_client_config()
    provider = config["provider"]

    if provider == "openai":
        from openai import AsyncOpenAI
        _chat_client = AsyncOpenAI(
            api_key=config["api_key"],
            organization=config.get("org_id"),
            base_url=config.get("base_url"),
        )
    elif provider == "azure":
        from openai import AsyncAzureOpenAI
        _chat_client = AsyncAzureOpenAI(
            api_key=config["api_key"],
            azure_endpoint=config["endpoint"],
            api_version=config["api_version"],
        )
    elif provider == "anthropic":
        from anthropic import AsyncAnthropic
        _chat_client = AsyncAnthropic(api_key=config["api_key"])
    elif provider == "google":
        # Google AI SDK
        try:
            import google.generativeai as genai
            genai.configure(api_key=config["api_key"])
            _chat_client = genai
        except ImportError:
            log.error("google-generativeai not installed. Install with: pip install google-generativeai")
            raise
    elif provider == "cohere":
        try:
            import cohere
            _chat_client = cohere.AsyncClient(api_key=config["api_key"])
        except ImportError:
            log.error("cohere not installed. Install with: pip install cohere")
            raise
    elif provider == "local":
        from openai import AsyncOpenAI
        _chat_client = AsyncOpenAI(
            api_key="local",  # Ollama doesn't need auth
            base_url=config["base_url"],
        )
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")

    log.info("chat_client_initialized", provider=provider)
    return _chat_client


def _get_embedding_client():
    """Lazy initialization of embedding client based on configured provider."""
    global _embed_client
    if _embed_client is not None:
        return _embed_client

    config = settings.get_embedding_client_config()
    provider = config["provider"]

    if provider == "openai":
        from openai import AsyncOpenAI
        _embed_client = AsyncOpenAI(
            api_key=config["api_key"],
            base_url=config.get("base_url"),
        )
    elif provider == "azure":
        from openai import AsyncAzureOpenAI
        _embed_client = AsyncAzureOpenAI(
            api_key=config["api_key"],
            azure_endpoint=config["endpoint"],
            api_version=config["api_version"],
        )
    elif provider == "cohere":
        try:
            import cohere
            _embed_client = cohere.AsyncClient(api_key=config["api_key"])
        except ImportError:
            log.error("cohere not installed. Install with: pip install cohere")
            raise
    elif provider == "google":
        try:
            import google.generativeai as genai
            genai.configure(api_key=config["api_key"])
            _embed_client = genai
        except ImportError:
            log.error("google-generativeai not installed")
            raise
    elif provider == "local":
        from openai import AsyncOpenAI
        _embed_client = AsyncOpenAI(
            api_key="local",
            base_url=config["base_url"],
        )
    else:
        raise ValueError(f"Unsupported embedding provider: {provider}")

    log.info("embedding_client_initialized", provider=provider)
    return _embed_client


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
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str | AsyncIterator[str]:
    """
    Call the configured AI chat completion endpoint.

    Args:
        messages: List of message dicts with 'role' and 'content'.
        stream: If True, return an async iterator; else return the complete text.
        temperature: Override default temperature.
        max_tokens: Override default max_tokens.

    Returns:
        Complete response text or async iterator of text chunks.
    """
    client = _get_chat_client()
    config = settings.get_chat_client_config()
    provider = config["provider"]

    temp = temperature if temperature is not None else config["temperature"]
    tokens = max_tokens if max_tokens is not None else config["max_tokens"]

    log.info(
        "chat_completion.start",
        provider=provider,
        message_count=len(messages),
        stream=stream,
    )

    try:
        if provider in ("openai", "azure", "local"):
            # OpenAI-compatible API
            model = config.get("deployment") or config.get("model")

            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temp,
                max_tokens=tokens,
                stream=stream,
            )

            if stream:
                async def _stream():
                    async for chunk in response:
                        delta = chunk.choices[0].delta
                        if delta.content:
                            yield delta.content
                return _stream()
            else:
                return response.choices[0].message.content

        elif provider == "anthropic":
            # Anthropic Claude
            model = config["model"]

            # Convert OpenAI format to Anthropic format
            system_msg = next((m["content"] for m in messages if m["role"] == "system"), None)
            user_messages = [m for m in messages if m["role"] != "system"]

            response = await client.messages.create(
                model=model,
                system=system_msg,
                messages=user_messages,
                temperature=temp,
                max_tokens=tokens,
                stream=stream,
            )

            if stream:
                async def _stream():
                    async for chunk in response:
                        if chunk.type == "content_block_delta":
                            yield chunk.delta.text
                return _stream()
            else:
                return response.content[0].text

        elif provider == "google":
            # Google AI
            model = client.GenerativeModel(config["model"])
            prompt = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])

            if stream:
                response = await model.generate_content_async(prompt, stream=True)
                async def _stream():
                    async for chunk in response:
                        yield chunk.text
                return _stream()
            else:
                response = await model.generate_content_async(prompt)
                return response.text

        elif provider == "cohere":
            # Cohere
            prompt = "\n\n".join([f"{m['role']}: {m['content']}" for m in messages])
            response = await client.chat(
                message=prompt,
                model=config["model"],
                temperature=temp,
                max_tokens=tokens,
                stream=stream,
            )

            if stream:
                async def _stream():
                    async for chunk in response:
                        if hasattr(chunk, "text"):
                            yield chunk.text
                return _stream()
            else:
                return response.text

        else:
            raise ValueError(f"Unsupported provider: {provider}")

    except Exception as exc:
        log.error("chat_completion.error", provider=provider, error=str(exc))
        raise


@_RETRY
async def create_embedding(text: str) -> list[float]:
    """
    Generate embedding vector for the given text.

    Args:
        text: Input text to embed.

    Returns:
        Embedding vector (typically 1536 dimensions for OpenAI/Azure).
    """
    client = _get_embedding_client()
    config = settings.get_embedding_client_config()
    provider = config["provider"]

    log.info("create_embedding.start", provider=provider, text_len=len(text))

    try:
        if provider in ("openai", "azure", "local"):
            model = config.get("deployment") or config.get("model")
            response = await client.embeddings.create(
                model=model,
                input=text,
            )
            return response.data[0].embedding

        elif provider == "cohere":
            response = await client.embed(
                texts=[text],
                model=config["model"],
                input_type="search_document",
            )
            return response.embeddings[0]

        elif provider == "google":
            # Google Embeddings
            result = client.embed_content(
                model=f"models/{config['model']}",
                content=text,
            )
            return result["embedding"]

        else:
            raise ValueError(f"Embedding not supported for provider: {provider}")

    except Exception as exc:
        log.error("create_embedding.error", provider=provider, error=str(exc))
        raise


async def create_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embedding vectors for a batch of texts.

    Args:
        texts: List of input texts to embed.

    Returns:
        List of embedding vectors.
    """
    client = _get_embedding_client()
    config = settings.get_embedding_client_config()
    provider = config["provider"]

    log.info("create_embeddings_batch.start", provider=provider, count=len(texts))

    try:
        if provider in ("openai", "azure", "local"):
            model = config.get("deployment") or config.get("model")
            response = await client.embeddings.create(
                model=model,
                input=texts,
            )
            return [item.embedding for item in response.data]

        elif provider == "cohere":
            response = await client.embed(
                texts=texts,
                model=config["model"],
                input_type="search_document",
            )
            return response.embeddings

        elif provider == "google":
            # Google batch embeddings
            results = []
            for text in texts:
                result = client.embed_content(
                    model=f"models/{config['model']}",
                    content=text,
                )
                results.append(result["embedding"])
            return results

        else:
            raise ValueError(f"Batch embedding not supported for provider: {provider}")

    except Exception as exc:
        log.error("create_embeddings_batch.error", provider=provider, error=str(exc))
        raise
