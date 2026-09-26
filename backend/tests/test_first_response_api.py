from datetime import date

from app.services.first_response import (
    FactReviewStatus,
    ProvenanceFact,
    calculate_statutory_clock,
    classify_notice,
    document_stated_deadline,
    first_response,
    handoff_packet,
)


def test_first_response_domain_contract_keeps_clocks_separate():
    classification = classify_notice("Kündigung des Arbeitsverhältnisses")
    fact = ProvenanceFact(
        "fact-1", "doc-1", "case-1", "document_stated_deadline", "2026-10-01", "2026-10-01",
        2, "bis zum 01.10.2026", "fixture", .99, FactReviewStatus.USER_CONFIRMED,
    )
    statutory = calculate_statutory_clock(case_id="case-1", classification=classification, facts=[fact])
    stated = document_stated_deadline(case_id="case-1", fact=fact)
    response = first_response(classification=classification, facts=[fact], clocks=[statutory, stated], case_id="case-1")
    assert statutory.due_date is None
    assert stated.due_date == date(2026, 10, 1)
    assert stated.source_page == 2
    assert handoff_packet(response)["counsel_decision"] == "UNKNOWN"
