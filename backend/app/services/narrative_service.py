"""
Narrative service – AI-powered legal document builder.

Generates legally structured narratives (Stellungnahmen, Schriftsätze, etc.)
in German, based on case facts, timeline events, and evidence.
"""
from __future__ import annotations

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case import Case
from app.services.ai_service import SYSTEM_PROMPT_DE, chat_completion
from app.services.rag_service import get_context_for_chat

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Narrative type → system-level instructions
# ---------------------------------------------------------------------------

NARRATIVE_PROMPTS: dict[str, str] = {
    "police_statement": """Du erstellst eine polizeiliche Beschuldigtenaussage (Einlassung) auf Deutsch.
Format:
- Kurze Einleitung mit Personalien
- Chronologische Schilderung des Sachverhalts aus Sicht des Mandanten
- Sachliche, neutrale Sprache (keine Schuldzuweisungen)
- Abschließende Bitte um Akteneinsicht gemäß § 147 StPO
- Vorbehalt, keine weiteren Angaben zur Sache zu machen
Wichtig: Weise darauf hin, dass der Mandant das Schweigerecht hat (§ 136 StPO).""",

    "court_brief": """Du erstellst einen rechtlichen Schriftsatz für das Gericht auf Deutsch.
Format:
- Rubrum (Parteien, Aktenzeichen)
- Anträge
- Sachverhalt in strukturierter Form
- Rechtliche Ausführungen mit Paragrafenverweisen
- Beweisangebote
- Formeller Schluss
Verwende juristische Fachsprache und präzise Formulierungen.""",

    "letter_to_opposing": """Du erstellst ein Anwaltsschreiben an die Gegenseite auf Deutsch.
Format:
- Formelle Anrede
- Bezugnahme auf den Sachverhalt
- Klare Darstellung des Rechtsstandpunkts
- Konkrete Forderungen mit Frist (Setze angemessene Frist, z.B. 14 Tage)
- Androhung weiterer rechtlicher Schritte
- Formelle Grußformel
Ton: Bestimmt aber professionell.""",

    "formal_complaint": """Du erstellst eine förmliche Beschwerde / einen Widerspruch auf Deutsch.
Format:
- An die zuständige Behörde / Institution
- Betreff: Widerspruch / Beschwerde gegen [Bescheid/Maßnahme] vom [Datum]
- Sachverhalt
- Begründung (rechtliche und tatsächliche)
- Antrag (Aufhebung des Bescheids / Abhilfe)
- Fristenhinweis (Widerspruchsfrist: 1 Monat gemäß § 70 VwGO)
Sprache: Formell und sachlich.""",

    "witness_statement": """Du erstellst eine schriftliche Zeugenaussage auf Deutsch.
Format:
- Personalien des Zeugen
- Wie und wann hat der Zeuge die Ereignisse wahrgenommen?
- Chronologische, detaillierte Schilderung
- Was wurde gesehen, gehört, wahrgenommen?
- Unterscheidung zwischen Wahrnehmung und Schlussfolgerung
- Versicherung der Wahrheit (§ 153 StGB Hinweis)
Sprache: Klar, einfach, konkret.""",
}

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def build_narrative(
    case: Case,
    narrative_type: str,
    language: str = "de",
    additional_context: str = "",
    db: AsyncSession = None,  # type: ignore[assignment]
) -> str:
    """
    Construct a legally-structured narrative for the given case and type.

    Uses timeline events, case facts, and RAG-retrieved law context.
    """
    log.info(
        "build_narrative.start",
        case_id=str(case.id),
        narrative_type=narrative_type,
        language=language,
    )

    # Build case summary for context
    case_summary = _build_case_summary(case)

    # Retrieve relevant law context
    law_context = ""
    if db is not None:
        try:
            law_context = await get_context_for_chat(
                query=f"{case.case_type} {narrative_type} {case.title}",
                case_context=case_summary,
                db=db,
            )
        except Exception as exc:
            log.warning("build_narrative.rag_failed", error=str(exc))

    # Select the right narrative instructions
    narrative_instructions = NARRATIVE_PROMPTS.get(
        narrative_type,
        "Erstelle ein rechtliches Dokument auf Deutsch basierend auf den Falldetails.",
    )

    system = f"""{SYSTEM_PROMPT_DE}

---
**Aufgabe: Narrativ erstellen**
{narrative_instructions}

**Relevante Rechtsquellen:**
{law_context or "Keine spezifischen Quellen verfügbar."}
"""

    user_content = f"""Erstelle ein {narrative_type.replace('_', ' ')}-Dokument basierend auf diesen Fallinformationen:

{case_summary}

{f"Zusätzliche Hinweise vom Nutzer: {additional_context}" if additional_context else ""}

Zielsprache: {"Deutsch" if language == "de" else "Englisch"}

Erstelle jetzt das vollständige Dokument:"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    result = await chat_completion(messages, temperature=0.4, max_tokens=4096)
    assert isinstance(result, str)

    log.info("build_narrative.done", chars=len(result))
    return result


async def improve_narrative(existing: str, instructions: str) -> str:
    """
    Improve or revise an existing narrative based on user instructions.
    """
    log.info("improve_narrative.start", existing_len=len(existing))

    system = f"""{SYSTEM_PROMPT_DE}

Du überarbeitest und verbesserst bestehende rechtliche Dokumente.
Befolge die Anweisungen des Nutzers genau und behalte den professionellen rechtlichen Stil bei."""

    user_content = f"""Überarbeite das folgende rechtliche Dokument gemäß diesen Anweisungen:

**Anweisungen:**
{instructions}

**Bestehendes Dokument:**
{existing}

Gib das vollständig überarbeitete Dokument aus:"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    result = await chat_completion(messages, temperature=0.3, max_tokens=4096)
    assert isinstance(result, str)
    return result


async def translate_narrative(text: str, target_lang: str) -> str:
    """
    Translate a narrative to the target language while preserving legal terminology.

    target_lang: "en" for English, "de" for German, "tr" for Turkish, etc.
    """
    lang_names = {
        "en": "Englisch",
        "de": "Deutsch",
        "tr": "Türkisch",
        "ar": "Arabisch",
        "fr": "Französisch",
        "ru": "Russisch",
    }
    lang_name = lang_names.get(target_lang, target_lang)

    log.info("translate_narrative.start", target_lang=target_lang)

    system = (
        "Du bist ein professioneller Übersetzer, spezialisiert auf Rechtstexte. "
        "Übersetze präzise und behalte die rechtliche Fachsprache und den formellen Stil bei. "
        "Rechtliche Paragrafenverweise (§ 123 BGB etc.) bleiben unverändert."
    )

    user_content = f"""Übersetze den folgenden deutschen Rechtstext ins {lang_name}.
Behalte alle Paragrafenverweise und rechtliche Fachbegriffe bei.

**Text:**
{text}

**Übersetzung ({lang_name}):**"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    result = await chat_completion(messages, temperature=0.2, max_tokens=4096)
    assert isinstance(result, str)
    return result


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _build_case_summary(case: Case) -> str:
    """Compile a human-readable case summary from the ORM object."""
    lines = [
        f"**Falltitel:** {case.title}",
        f"**Falltyp:** {case.case_type}",
        f"**Status:** {case.status}",
        f"**Dringlichkeit:** {case.urgency}",
    ]

    if case.description:
        lines.append(f"**Fallbeschreibung:**\n{case.description}")
    if case.incident_date:
        lines.append(f"**Vorfallsdatum:** {case.incident_date}")
    if case.location:
        lines.append(f"**Ort:** {case.location}")
    if case.opposing_party:
        lines.append(f"**Gegenpartei:** {case.opposing_party}")
    if case.opposing_party_lawyer:
        lines.append(f"**Anwalt der Gegenpartei:** {case.opposing_party_lawyer}")
    if case.court_name:
        lines.append(f"**Gericht:** {case.court_name}")
    if case.case_number:
        lines.append(f"**Aktenzeichen:** {case.case_number}")

    # Timeline events
    if hasattr(case, "timeline_events") and case.timeline_events:
        lines.append("\n**Chronologie der Ereignisse:**")
        for event in sorted(case.timeline_events, key=lambda e: e.event_date):
            key_marker = " [SCHLÜSSELEREIGNIS]" if event.is_key_event else ""
            lines.append(
                f"- {event.event_date.strftime('%d.%m.%Y')}: "
                f"{event.title}{key_marker}"
                + (f"\n  {event.description}" if event.description else "")
            )

    return "\n".join(lines)
