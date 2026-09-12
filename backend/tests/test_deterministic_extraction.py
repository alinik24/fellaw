"""Unit tests for deterministic candidate-fact extraction (blocker 6)."""
from __future__ import annotations

from app.services.document_service import (
    SERVER_EXTRACTOR_ID,
    deterministic_extract_candidate_facts,
)


def test_extracts_received_and_deadline_with_server_provenance():
    text = (
        "Kündigung des Arbeitsverhältnisses zum 31.03.2026.\n"
        "Das Schreiben wurde erhalten am 01.02.2026.\n"
        "Widerspruchsfrist endet spätestens am 15.02.2026."
    )
    facts = deterministic_extract_candidate_facts(text, document_id="doc1", case_id="case1")
    by_type = {f["fact_type"]: f for f in facts}
    assert "received_date" in by_type
    assert by_type["received_date"]["value"] == "2026-02-01"
    assert by_type["received_date"]["extractor"] == SERVER_EXTRACTOR_ID
    assert by_type["received_date"]["source_page"] == 1
    assert by_type["received_date"]["confidence"] is not None
    assert "document_stated_deadline" in by_type
    assert by_type["document_stated_deadline"]["value"] == "2026-02-15"
    assert by_type["document_stated_deadline"]["extractor"] == SERVER_EXTRACTOR_ID


def test_empty_text_yields_no_facts():
    assert deterministic_extract_candidate_facts("", document_id="d", case_id="c") == []
    assert deterministic_extract_candidate_facts("   ", document_id="d", case_id="c") == []


def test_no_received_marker_no_fact():
    text = "Eine Rechnung ohne Datumsangabe, die nichts enthält."
    facts = deterministic_extract_candidate_facts(text, document_id="d", case_id="c")
    assert all(f["fact_type"] != "received_date" for f in facts)
