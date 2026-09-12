"""Pure PR-03/08 first-response contract tests."""
from datetime import date
from app.services.first_response import *  # noqa: F403,F401


def fact(kind, value, status=FactReviewStatus.USER_CONFIRMED):
    return ProvenanceFact("f1", "d1", "c1", kind, value, value, 1, value, "fixture", 0.99, status)


def test_all_semantic_clock_types_are_distinct():
    stated = document_stated_deadline(case_id="c1", fact=fact("document_stated_deadline", "2026-10-01"))
    target = recommended_action_target(case_id="c1", target=date(2026, 9, 20), action="Confirm receipt")
    statutory = calculate_statutory_clock(case_id="c1", classification=classify_notice("Kündigung"), facts=[fact("received_date", "2026-09-01")])
    reminder = reminder_from_clock(reminder_id="r1", clock=target)
    assert {stated.clock_type, target.clock_type, statutory.clock_type, reminder.clock_type} == set(ClockType)
    assert reminder.reminder_date == target.due_date


def test_missing_trigger_abstains_without_guessing_a_date():
    result = calculate_statutory_clock(case_id="c1", classification=classify_notice("Kündigung"), facts=[])
    assert result.due_date is None
    assert result.verification_status in {VerificationStatus.NEEDS_CONFIRMATION, VerificationStatus.REVIEW_REQUIRED}


def test_unreviewed_rule_is_not_authoritative():
    result = calculate_statutory_clock(case_id="c1", classification=classify_notice("Kündigung"), facts=[fact("received_date", "2026-09-01")])
    assert result.due_date is None and result.verification_status == VerificationStatus.REVIEW_REQUIRED


def test_urgency_is_never_an_input_to_statutory_calculation():
    active = RULES[0].__class__(**{**RULES[0].__dict__, "active": True, "counsel_reviewed": True})
    result = calculate_statutory_clock(case_id="c1", classification=classify_notice("Kündigung"), facts=[fact("received_date", "2026-09-01")], rule=active)
    assert result.due_date == date(2026, 9, 8)


def test_llm_statutory_override_is_ignored():
    active = RULES[0].__class__(**{**RULES[0].__dict__, "active": True, "counsel_reviewed": True})
    authoritative = calculate_statutory_clock(case_id="c1", classification=classify_notice("Kündigung"), facts=[fact("received_date", "2026-09-01")], rule=active)
    assert llm_statutory_override_attempt(candidate_due_date=date(2026, 1, 1), authoritative_clock=authoritative) is authoritative


def test_document_date_keeps_provenance_and_semantic_identity():
    result = document_stated_deadline(case_id="c1", fact=fact("document_stated_deadline", "2026-10-01"))
    assert result.clock_type == ClockType.DOCUMENT_STATED_DEADLINE and result.due_date == date(2026, 10, 1)
    assert result.source_page == 1 and result.source_span == "2026-10-01"


def test_unsupported_classification_is_a_safe_success_state():
    response = first_response(classification=classify_notice("unrelated correspondence"), facts=(), clocks=(), case_id="c1")
    assert response.classification.family == NoticeFamily.UNKNOWN_OR_UNSUPPORTED
    assert response.handoff_required is True
