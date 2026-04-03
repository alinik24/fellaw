"""
Counterargument and contradiction analyzer.

Analyses opponent claims, checks statement consistency, and generates
cross-examination questions – all in a German legal context.
"""
from __future__ import annotations

import json
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai_service import chat_completion
from app.services.rag_service import get_context_for_chat

log = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def analyze_opponent_claims(
    claims: str,
    case_context: str,
    db: AsyncSession,
) -> dict[str, Any]:
    """
    Analyse the opposing party's claims and generate counter-strategies.

    Returns:
        {
            weaknesses: list[str],          # logical or legal weaknesses in claims
            contradictions: list[str],      # internal contradictions
            suggested_rebuttals: list[str], # concrete rebuttal arguments
            legal_defenses: list[str],      # applicable German legal defenses
            questions_for_witness: list[str] # cross-examination questions
        }
    """
    log.info("analyze_opponent_claims.start", claims_len=len(claims))

    # Retrieve relevant law context
    law_context = ""
    try:
        law_context = await get_context_for_chat(
            query=f"Gegenargumente Widerlegung: {claims[:300]}",
            case_context=case_context,
            db=db,
        )
    except Exception as exc:
        log.warning("analyze_opponent_claims.rag_failed", error=str(exc))

    system = """Du bist ein erfahrener Strafverteidiger und Zivilrechtler in Deutschland.
Analysiere Aussagen und Behauptungen der Gegenseite kritisch und identifiziere:
- Logische Schwächen und Widersprüche
- Mögliche Gegenargumente nach deutschem Recht
- Effektive Kreuzfragen für die Vernehmung
Antworte ausschließlich als valides JSON-Objekt."""

    user_prompt = f"""Analysiere die folgenden Behauptungen der Gegenseite und erstelle eine detaillierte Gegenargumentation.

**Fallkontext:**
{case_context}

**Behauptungen der Gegenseite:**
{claims}

**Relevante Rechtsquellen:**
{law_context or "Keine spezifischen Quellen verfügbar."}

Antworte mit diesem JSON-Format:
{{
  "weaknesses": [
    "Schwäche 1 in der Argumentation der Gegenseite",
    "Schwäche 2..."
  ],
  "contradictions": [
    "Widerspruch 1 in den Aussagen",
    "Widerspruch 2..."
  ],
  "suggested_rebuttals": [
    "Gegenargument 1 mit rechtlicher Grundlage",
    "Gegenargument 2..."
  ],
  "legal_defenses": [
    "Rechtliche Verteidigung 1 (z.B. § 32 StGB Notwehr)",
    "Verteidigung 2..."
  ],
  "questions_for_witness": [
    "Kreuzfrage 1 an den Zeugen/die Gegenseite",
    "Kreuzfrage 2..."
  ]
}}"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.3, max_tokens=3000)
    assert isinstance(raw, str)

    try:
        cleaned = _strip_fences(raw)
        result = json.loads(cleaned)
        log.info(
            "analyze_opponent_claims.done",
            weaknesses=len(result.get("weaknesses", [])),
        )
        return result
    except (json.JSONDecodeError, KeyError) as exc:
        log.warning("analyze_opponent_claims.json_failed", error=str(exc), raw=raw[:200])
        return {
            "weaknesses": [raw[:500]],
            "contradictions": [],
            "suggested_rebuttals": [],
            "legal_defenses": [],
            "questions_for_witness": [],
        }


async def check_statement_consistency(
    statement1: str,
    statement2: str,
) -> dict[str, Any]:
    """
    Compare two statements for internal consistency and factual discrepancies.

    Returns:
        {
            consistent: bool,
            discrepancies: list[str],  # specific discrepancies found
            analysis: str              # overall analysis text
        }
    """
    log.info("check_statement_consistency.start")

    system = """Du bist ein Rechtsexperte und analysierst Zeugenaussagen und Schriftsätze
auf Widersprüche und Inkonsistenzen. Antworte ausschließlich als valides JSON-Objekt."""

    user_prompt = f"""Vergleiche die folgenden zwei Aussagen auf Konsistenz und Widersprüche.

**Aussage 1:**
{statement1}

**Aussage 2:**
{statement2}

Antworte mit diesem JSON-Format:
{{
  "consistent": true,
  "discrepancies": [
    "Widerspruch 1: In Aussage 1 heißt es X, in Aussage 2 Y",
    "Widerspruch 2..."
  ],
  "analysis": "Gesamtanalyse der Konsistenz und rechtliche Einschätzung (2-3 Sätze)"
}}

Wenn keine Widersprüche gefunden werden, gib "consistent": true und eine leere Liste zurück."""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.2, max_tokens=2000)
    assert isinstance(raw, str)

    try:
        cleaned = _strip_fences(raw)
        result = json.loads(cleaned)
        log.info(
            "check_statement_consistency.done",
            consistent=result.get("consistent"),
            discrepancies=len(result.get("discrepancies", [])),
        )
        return result
    except (json.JSONDecodeError, KeyError) as exc:
        log.warning("check_statement_consistency.json_failed", error=str(exc))
        return {
            "consistent": True,
            "discrepancies": [],
            "analysis": raw[:500],
        }


async def generate_questions(
    opponent_statement: str,
    case_type: str,
) -> list[str]:
    """
    Generate cross-examination questions for the opposing witness/party.

    Returns a list of question strings, ordered from general to specific,
    appropriate for German court proceedings.
    """
    log.info("generate_questions.start", case_type=case_type)

    system = """Du bist ein erfahrener Strafverteidiger und Zivilrechtler in Deutschland.
Erstelle präzise Kreuzfragen für die Vernehmung der Gegenseite / des Zeugen.
Antworte ausschließlich mit einem JSON-Array von Frage-Strings."""

    user_prompt = f"""Erstelle effektive Kreuzfragen für eine {case_type}-Vernehmung basierend auf dieser Aussage.

**Aussage der Gegenseite / des Zeugen:**
{opponent_statement}

Erstelle 8-12 Fragen nach diesen Kriterien:
- Fragen, die interne Widersprüche aufdecken
- Fragen zu fehlenden Details oder unklaren Zeitangaben
- Fragen, die alternative Erklärungen aufzeigen
- Fragen zur Zuverlässigkeit der Wahrnehmung
- Bei Strafrecht: Fragen die auf Entlastung/Zweifel abzielen

Antworte mit: ["Frage 1?", "Frage 2?", ...]"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.4, max_tokens=2000)
    assert isinstance(raw, str)

    try:
        cleaned = _strip_fences(raw)
        result = json.loads(cleaned)
        if isinstance(result, list):
            questions = [str(q) for q in result]
            log.info("generate_questions.done", count=len(questions))
            return questions
        return []
    except (json.JSONDecodeError, ValueError) as exc:
        log.warning("generate_questions.json_failed", error=str(exc))
        # Fallback: split by newlines
        return [
            line.strip().lstrip("0123456789.-) ")
            for line in raw.split("\n")
            if line.strip() and "?" in line
        ]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _strip_fences(text: str) -> str:
    """Remove Markdown code fences from AI responses."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return cleaned
