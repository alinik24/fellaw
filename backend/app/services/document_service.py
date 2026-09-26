"""
Document processing service.

Handles text extraction from PDF/DOCX files and AI-powered document analysis.
"""
from __future__ import annotations

import json
import os
import re
import unicodedata
import uuid
from datetime import date
from pathlib import Path
from typing import Any

import aiofiles
import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evidence import Document
from app.services.ai_service import chat_completion

log = structlog.get_logger(__name__)

# Extractor identity the SERVER assigns to pipeline-created candidate facts.
# Clients never supply this; it proves a fact came from the deterministic
# document-extraction pipeline, not from a user/manufactured POST.
SERVER_EXTRACTOR_ID = "deterministic_extraction"
USER_PROVIDED_EXTRACTOR_ID = "user_provided"

# ---------------------------------------------------------------------------
# Deterministic candidate-fact extraction (blocker 6: provenance integrity)
# ---------------------------------------------------------------------------

_DATE_PATTERNS = {
    # ISO and common German/English forms. Captures (year, month, day, raw).
    r"(?P<y>\d{4})-(?P<m>\d{1,2})-(?P<d>\d{1,2})",
    r"(?P<d>\d{1,2})\.(?P<m>\d{1,2})\.(?P<y>\d{4})",
    r"(?P<d>\d{1,2})\.\s+(?P<m>[A-Za-zäöü]+)\.?\s+(?P<y>\d{4})",
}


def _parse_date(raw: str) -> date | None:
    raw = raw.strip()
    for pat in _DATE_PATTERNS:
        m = re.match(pat, raw)
        if not m:
            continue
        try:
            y, mo, d = m.group("y"), m.group("m"), m.group("d")
            if not y.isdigit() or not d.isdigit():
                continue
            if mo.isdigit():
                mo = int(mo)
            else:
                months = {
                    "januar": 1, "februar": 2, "märz": 3, "maerz": 3, "april": 4,
                    "mai": 5, "juni": 6, "juli": 7, "august": 8, "september": 9,
                    "oktober": 10, "november": 11, "dezember": 12,
                }
                mo = months.get(mo.lower().rstrip("."))
                if mo is None:
                    continue
            return date(int(y), int(mo), int(d))
        except ValueError:
            continue
    return None


def deterministic_extract_candidate_facts(
    text: str, *, document_id: str, case_id: str | None
) -> list[dict[str, Any]]:
    """Deterministically extract candidate facts from the document text.

    Creates EXTRACTED_CANDIDATE fact specs with provenance set SERVER-SIDE:
    extractor=SERVER_EXTRACTOR_ID, confidence, source_page/source_span. This
    is the canonical extraction pipeline the client reads/confirms; a client
    can never manufacture this provenance (blocker 6). No legal/professional
    truth claims are made — only visible dates and the named party/termination
    value are surfaced as candidates for user confirmation.
    """
    candidates: list[dict[str, Any]] = []
    if not text or not text.strip():
        return candidates

    # received_date: look for a date near "erhalten/erhalten am/zu" markers.
    low = text.lower()
    received_pos = min(
        (low.find(k) for k in ("erhalten am", "erhalten", "zugestellt", "received") if low.find(k) != -1),
        default=-1,
    )
    if received_pos != -1:
        window = text[received_pos: received_pos + 60]
        for raw in re.findall(r"[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}|[0-9]{1,2}\.\s+[A-Za-zäöü]+\.?\s+[0-9]{4}", window):
            d = _parse_date(raw)
            if d:
                candidates.append({
                    "fact_type": "received_date",
                    "value": d.isoformat(),
                    "normalized_value": d.isoformat(),
                    "source_page": 1,
                    "source_span": raw.strip(),
                    "extractor": SERVER_EXTRACTOR_ID,
                    "confidence": 0.9,
                })
                break

    # document_stated_deadline: look for a date near "bis/spätestens/frist/termin".
    deadline_pos = min(
        (low.rfind(k) for k in ("spätestens", "spaetestens", "bis zum", "termin", "frist", "erfüllt bis", "bis") if low.rfind(k) != -1),
        default=-1,
    )
    if deadline_pos != -1:
        window = text[max(0, deadline_pos - 10): deadline_pos + 70]
        for raw in re.findall(r"[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}|[0-9]{1,2}\.\s+[A-Za-zäöü]+\.?\s+[0-9]{4}", window):
            d = _parse_date(raw)
            if d:
                candidates.append({
                    "fact_type": "document_stated_deadline",
                    "value": d.isoformat(),
                    "normalized_value": d.isoformat(),
                    "source_page": 1,
                    "source_span": raw.strip(),
                    "extractor": SERVER_EXTRACTOR_ID,
                    "confidence": 0.8,
                })
                break

    return candidates


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------


async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract plain text from a PDF file using pypdf.

    Iterates over all pages and concatenates extracted text.
    Returns an empty string if extraction fails.
    """
    try:
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        parts: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
        full_text = "\n\n".join(parts)
        log.info(
            "extract_text_from_pdf.done",
            file=file_path,
            pages=len(reader.pages),
            chars=len(full_text),
        )
        return full_text
    except Exception as exc:
        log.error("extract_text_from_pdf.failed", file=file_path, error=str(exc))
        return ""


async def extract_text_from_docx(file_path: str) -> str:
    """
    Extract plain text from a DOCX file using python-docx.

    Extracts paragraph text and table cell text, preserving paragraph breaks.
    """
    try:
        import docx  # python-docx

        doc = docx.Document(file_path)
        parts: list[str] = []

        for para in doc.paragraphs:
            if para.text.strip():
                parts.append(para.text)

        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        parts.append(cell.text.strip())

        full_text = "\n\n".join(parts)
        log.info(
            "extract_text_from_docx.done",
            file=file_path,
            paragraphs=len(doc.paragraphs),
            chars=len(full_text),
        )
        return full_text
    except Exception as exc:
        log.error("extract_text_from_docx.failed", file=file_path, error=str(exc))
        return ""


async def extract_text_from_image(file_path: str) -> str:
    """
    Extract text from an image file using Azure Document Intelligence.

    Falls back to empty string if the service is unavailable.
    """
    try:
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.core.credentials import AzureKeyCredential

        from app.config import settings

        client = DocumentIntelligenceClient(
            endpoint=settings.DOCINTEL_ENDPOINT,
            credential=AzureKeyCredential(settings.DOCINTEL_KEY),
        )

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        poller = client.begin_analyze_document(
            "prebuilt-read",
            analyze_request=file_bytes,
            content_type="application/octet-stream",
        )
        result = poller.result()
        text = result.content or ""
        log.info("extract_text_from_image.done", file=file_path, chars=len(text))
        return text
    except ImportError:
        log.warning("extract_text_from_image.no_sdk")
        return ""
    except Exception as exc:
        log.error("extract_text_from_image.failed", file=file_path, error=str(exc))
        return ""


# ---------------------------------------------------------------------------
# AI document analysis
# ---------------------------------------------------------------------------


# L1 extraction-only schema. PR-02C Finding 4: the ordinary upload pipeline
# must NOT request legal_implications / action_required / urgency from the
# model. Only visible extraction data is asked for.
EXTRACTION_ALLOWED_FIELDS: tuple[str, ...] = (
    "summary",
    "key_dates",
    "key_persons",
    "document_category",
    "reference_numbers",
)

EXTRACTION_PROMPT_SCHEMA: str = """Gib ein JSON-Objekt mit GENAU diesen Feldern zurück:
{
  "summary": "Kurze Zusammenfassung des Dokuments (2-4 Sätze, rein beschreibend)",
  "key_dates": [
    {"date": "TT.MM.JJJJ oder Beschreibung", "significance": "Was an diesem Datum im Dokument steht"}
  ],
  "key_persons": [
    {"name": "Name/Institution", "role": "Rolle im Dokument"}
  ],
  "document_category": "police_report|court_letter|contract|id_document|medical|financial|correspondence|other",
  "reference_numbers": ["Aktenzeichen, Vertragsnummern oder Referenznummern aus dem Dokument"]
}

Verboten: KEINE rechtliche Bewertung, KEINE Rechtsfolgen, KEINE Handlungsanweisungen,
KEINE Dringlichkeitseinschätzung, KEINE Strategieempfehlung. Extrahiere nur, was im
Dokument sichtbar steht."""


async def analyze_document_extraction(
    text: str,
    doc_type: str,
) -> dict[str, Any]:
    """
    L1 extraction-only document analysis (PR-02C Finding 4).

    Requests ONLY the allowed extraction surface: plain summary, visible
    dates, persons/organizations, document category/type, reference numbers.
    The prompt/schema explicitly forbids legal_implications, individualized
    action_required, legal urgency, strategy, and merits. Used by the ordinary
    upload pipeline. This is the ROOT contract fix: the model is never asked
    to produce L3 fields, so there is nothing to pop() afterward.
    """
    log.info(
        "analyze_document_extraction.start",
        doc_type=doc_type,
        text_len=len(text),
    )

    system = (
        "Du bist ein Dokument-Extraktionsassistent. Du extrahierst nur sichtbare "
        "Informationen (Zusammenfassung, Daten, Personen, Kategorie, Referenzen). "
        "Du gibst KEINE rechtliche Bewertung oder Handlungsanweisungen ab. "
        "Antworte ausschließlich als valides JSON-Objekt ohne Markdown-Codeblöcke."
    )

    user_prompt = f"""Analysiere das folgende {doc_type}-Dokument.

{EXTRACTION_PROMPT_SCHEMA}

**Dokumenttext:**
\"\"\"{text[:6000]}\"\"\"
"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.1, max_tokens=1200)
    assert isinstance(raw, str)

    try:
        cleaned = _strip_fences(raw)
        result = json.loads(cleaned)
        # Fail closed: only allowed fields are kept; anything else is dropped.
        result = {k: v for k, v in result.items() if k in EXTRACTION_ALLOWED_FIELDS}
        log.info("analyze_document_extraction.done", keys=sorted(result.keys()))
        return result
    except (json.JSONDecodeError, Exception) as exc:
        log.warning(
            "analyze_document_extraction.json_failed",
            error=str(exc),
            raw=raw[:300],
        )
        return {
            "summary": raw[:500],
            "key_dates": [],
            "key_persons": [],
            "document_category": "other",
            "reference_numbers": [],
        }


async def analyze_document_with_ai(
    text: str,
    doc_type: str,
    case_context: str | None = None,
) -> dict[str, Any]:
    """
    Rich document analysis — GATED REVIEW_REQUIRED (PR-02C Finding 4).

    This analyzer additionally emits legal_implications, action_required, and
    urgency for the user's concrete document (L3 leakage). It is NOT used by
    the ordinary upload pipeline; it is only reachable through the gated chat
    endpoint (POST /api/v1/chat/analyze-document -> require_executable
    "analyze_document" -> blocked) and is kept for future value behind review.

    Returns a structured dict:
        {summary, key_dates, key_persons, legal_implications,
         action_required, urgency}
    """
    log.info(
        "analyze_document_with_ai.start",
        doc_type=doc_type,
        text_len=len(text),
    )

    context_block = (
        f"\n**Fallkontext:**\n{case_context}\n" if case_context else ""
    )

    system = (
        "Du bist ein erfahrener Rechtsassistent in Deutschland. "
        "Analysiere Rechtsdokumente präzise und strukturiert. "
        "Antworte ausschließlich als valides JSON-Objekt ohne Markdown-Codeblöcke."
    )

    user_prompt = f"""Analysiere das folgende {doc_type}-Dokument.{context_block}

Gib ein JSON-Objekt mit diesen Feldern zurück:
{{
  "summary": "Kurze Zusammenfassung des Dokuments (2-4 Sätze)",
  "key_dates": [
    {{"date": "TT.MM.JJJJ oder Beschreibung", "significance": "Bedeutung dieses Datums"}}
  ],
  "key_persons": [
    {{"name": "Name/Institution", "role": "Rolle im Dokument"}}
  ],
  "legal_implications": "Rechtliche Bedeutung, Konsequenzen und relevante Paragraphen",
  "action_required": "Konkrete Maßnahmen die der Nutzer ergreifen sollte",
  "urgency": "low|medium|high|critical",
  "document_category": "police_report|court_letter|contract|id_document|medical|financial|correspondence|other"
}}

**Dokumenttext:**
\"\"\"{text[:6000]}\"\"\"
"""

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_prompt},
    ]

    raw = await chat_completion(messages, temperature=0.1, max_tokens=2000)
    assert isinstance(raw, str)

    try:
        cleaned = _strip_fences(raw)
        result = json.loads(cleaned)
        log.info("analyze_document_with_ai.done", urgency=result.get("urgency"))
        return result
    except (json.JSONDecodeError, Exception) as exc:
        log.warning(
            "analyze_document_with_ai.json_failed",
            error=str(exc),
            raw=raw[:300],
        )
        return {
            "summary": raw[:500],
            "key_dates": [],
            "key_persons": [],
            "legal_implications": "Analyse konnte nicht strukturiert werden.",
            "action_required": "Dokument manuell prüfen und Anwalt konsultieren.",
            "urgency": "medium",
            "document_category": "other",
        }


# ---------------------------------------------------------------------------
# Full document processing pipeline
# ---------------------------------------------------------------------------


async def process_uploaded_document(
    document: Document,
    db: AsyncSession,
) -> Document:
    """
    Full processing pipeline for an uploaded document:

    1. Detect file type from mime_type
    2. Extract text
    3. Run AI analysis
    4. Update the document record in the database

    Sets processing_status to "completed" on success, "failed" on error.
    """
    log.info(
        "process_uploaded_document.start",
        doc_id=str(document.id),
        mime=document.mime_type,
    )

    document.processing_status = "processing"
    await db.flush()

    try:
        # 1. Extract text
        extracted_text = ""
        mime = document.mime_type.lower()

        if "pdf" in mime:
            extracted_text = await extract_text_from_pdf(document.file_path)
        elif "docx" in mime or "openxmlformats" in mime or "word" in mime:
            extracted_text = await extract_text_from_docx(document.file_path)
        elif any(img in mime for img in ("jpeg", "jpg", "png", "tiff", "bmp", "gif")):
            extracted_text = await extract_text_from_image(document.file_path)
        elif "text" in mime or "plain" in mime:
            async with aiofiles.open(document.file_path, mode="r", encoding="utf-8", errors="replace") as f:
                extracted_text = await f.read()
        else:
            log.warning(
                "process_uploaded_document.unsupported_mime",
                mime=document.mime_type,
            )

        document.extracted_text = extracted_text

        # 2a. Deterministic candidate-fact extraction (blocker 6): the SERVER
        # creates EXTRACTED_CANDIDATE facts from the extracted text with real
        # server-side provenance. A client can read/confirm/correct these but
        # never manufactures the provenance (extractor/confidence/source).
        # Idempotent: only seed facts once per document.
        if extracted_text.strip() and document.case_id:
            from app.models.first_response_state import Fact
            existing_count = await db.scalar(
                select(func.count()).select_from(Fact).where(Fact.document_id == document.id)
            )
            if not existing_count:
                candidate_specs = deterministic_extract_candidate_facts(
                    extracted_text, document_id=str(document.id), case_id=str(document.case_id)
                )
                for spec in candidate_specs:
                    db.add(Fact(
                        document_id=document.id,
                        case_id=document.case_id,
                        fact_type=spec["fact_type"],
                        value=spec["value"],
                        normalized_value=spec["normalized_value"],
                        source_page=spec["source_page"],
                        source_span=spec["source_span"],
                        extractor=spec["extractor"],
                        confidence=spec["confidence"],
                    ))

        # 2. L1 extraction-only AI analysis (only if we have text)
        # PR-02C Finding 4: the ordinary upload pipeline uses the extraction-
        # only operation. The model is never asked for legal_implications /
        # action_required / urgency, so there is nothing to strip afterwards.
        if extracted_text.strip():
            analysis_result = await analyze_document_extraction(
                text=extracted_text,
                doc_type=document.document_category,
            )

            # Store as JSON string in the ai_analysis column (L1 surface only)
            document.ai_analysis = json.dumps(analysis_result, ensure_ascii=False)

            # Update category if extraction detected a better one
            detected_category = analysis_result.get("document_category")
            if detected_category and detected_category != "other":
                document.document_category = detected_category
        else:
            document.ai_analysis = json.dumps(
                # PR-02 quarantine: no-text fallback persists only the L1
                # summary — no urgency/legal-implications judgment.
                {"summary": "Kein Text extrahiert."},
                ensure_ascii=False,
            )

        document.processing_status = "completed"
        log.info("process_uploaded_document.done", doc_id=str(document.id))

    except Exception as exc:
        log.error(
            "process_uploaded_document.failed",
            doc_id=str(document.id),
            error=str(exc),
        )
        # Only an identified optional AI/model-provider failure may degrade to
        # a bounded non-generative state. Any other failure (text extraction,
        # DB, serialization, programming error) keeps real failure semantics.
        from app.services.ai_service import AIProviderUnavailable

        if isinstance(exc, AIProviderUnavailable) and document.extracted_text and document.extracted_text.strip():
            document.ai_analysis = json.dumps(
                {"summary": "Text extrahiert; optionale KI-Analyse nicht verfügbar.", "provider_status": "unavailable"},
                ensure_ascii=False,
            )
            document.processing_status = "completed"
        else:
            document.processing_status = "failed"

    await db.flush()
    await db.refresh(document)
    return document


# ---------------------------------------------------------------------------
# Filename utilities
# ---------------------------------------------------------------------------


def get_safe_filename(filename: str) -> str:
    """
    Sanitise a filename to be safe for storage on the filesystem.

    - Normalise unicode (NFKD → ASCII)
    - Replace spaces with underscores
    - Remove all characters that are not alphanumeric, dashes, dots, or underscores
    - Prepend a short UUID to guarantee uniqueness
    """
    # Normalise unicode
    normalised = unicodedata.normalize("NFKD", filename)
    ascii_name = normalised.encode("ascii", "ignore").decode("ascii")

    # Keep extension
    path = Path(ascii_name)
    stem = re.sub(r"[^\w\-.]", "_", path.stem).strip("._")
    suffix = path.suffix.lower()

    # Guard against empty stems
    if not stem:
        stem = "document"

    unique_prefix = str(uuid.uuid4())[:8]
    return f"{unique_prefix}_{stem}{suffix}"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _strip_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else cleaned
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    return cleaned
