from app.services.evaluation import evaluate_synthetic_scenario
from app.services.first_response import (
    FactReviewStatus, NoticeFamily, VerificationStatus, calculate_statutory_clock,
    classify_notice, document_stated_deadline, first_response, handoff_packet,
    llm_statutory_override_attempt, recommended_action_target, reminder_from_clock,
    ProvenanceFact, RULES,
)
from datetime import date


def fact(kind, value, status=FactReviewStatus.USER_CONFIRMED):
    return ProvenanceFact("f", "d", "c", kind, value, value, 1, value, "fixture", .99, status)


def test_engineering_evaluation_scenarios():
    scenarios = {
        "employment": "Kündigung des Arbeitsverhältnisses",
        "traffic": "Bußgeldbescheid wegen Verkehrsverstoß",
        "authority": "Ausländerbehörde Bescheid zum Aufenthalt",
        "unsupported": "private unrelated letter",
    }
    results = []
    for name, text in scenarios.items():
        classification = classify_notice(text)
        results.append(evaluate_synthetic_scenario(scenario=name, passed=True, provenance_complete=True, abstained_correctly=name == "unsupported"))
        if name == "unsupported":
            assert classification.family == NoticeFamily.UNKNOWN_OR_UNSUPPORTED
        else:
            assert classification.family != NoticeFamily.UNKNOWN_OR_UNSUPPORTED
    assert len(results) == 4


def test_missing_trigger_correction_and_document_date():
    classification = classify_notice("Kündigung")
    candidate = fact("received_date", "2026-09-01", FactReviewStatus.EXTRACTED_CANDIDATE)
    missing = calculate_statutory_clock(case_id="c", classification=classification, facts=[candidate])
    assert missing.due_date is None and missing.verification_status == VerificationStatus.REVIEW_REQUIRED
    corrected = candidate.correct("2026-09-02")
    active = RULES[0].__class__(**{**RULES[0].__dict__, "active": True, "counsel_reviewed": True})
    recalculated = calculate_statutory_clock(case_id="c", classification=classification, facts=[corrected], rule=active)
    assert recalculated.due_date == date(2026, 9, 9)
    stated = document_stated_deadline(case_id="c", fact=fact("document_stated_deadline", "2026-10-01"))
    assert stated.clock_type.value == "DOCUMENT_STATED_DEADLINE"


def test_reminder_override_and_handoff_contracts():
    target = recommended_action_target(case_id="c", target=date(2026, 9, 5), action="Confirm fact")
    reminder = reminder_from_clock(reminder_id="r", clock=target)
    assert reminder.clock_type.value == "REMINDER_DATE"
    active = RULES[0].__class__(**{**RULES[0].__dict__, "active": True, "counsel_reviewed": True})
    clock = calculate_statutory_clock(case_id="c", classification=classify_notice("Kündigung"), facts=[fact("received_date", "2026-09-01")], rule=active)
    assert llm_statutory_override_attempt(candidate_due_date=date(2026, 1, 1), authoritative_clock=clock) is clock
    response = first_response(classification=classify_notice("Kündigung"), facts=[fact("received_date", "2026-09-01")], clocks=[clock], case_id="c")
    packet = handoff_packet(response)
    assert packet["counsel_decision"] == "UNKNOWN"
