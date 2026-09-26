"""FelLaw first-response domain contracts.

This module is deliberately deterministic and side-effect free.  It is the
source of truth for notice classification, provenance-backed facts, semantic
clocks, safe abstention, reminders, handoff packets, and product events.
LLM/extractor output may provide candidates, but never authoritative
statutory dates.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import StrEnum
from typing import Any, Iterable
import re


class NoticeFamily(StrEnum):
    EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE = "EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE"
    TRAFFIC_OR_BUSSGELD_NOTICE = "TRAFFIC_OR_BUSSGELD_NOTICE"
    AUTHORITY_OR_RESIDENCE_DECISION_REQUEST = "AUTHORITY_OR_RESIDENCE_DECISION_REQUEST"
    TENANCY_NOTICE = "TENANCY_NOTICE"
    UNKNOWN_OR_UNSUPPORTED = "UNKNOWN_OR_UNSUPPORTED"


class FactReviewStatus(StrEnum):
    EXTRACTED_CANDIDATE = "EXTRACTED_CANDIDATE"
    USER_CONFIRMED = "USER_CONFIRMED"
    USER_CORRECTED = "USER_CORRECTED"
    UNRESOLVED = "UNRESOLVED"
    REJECTED = "REJECTED"


class ClockType(StrEnum):
    STATUTORY_DEADLINE = "STATUTORY_DEADLINE"
    DOCUMENT_STATED_DEADLINE = "DOCUMENT_STATED_DEADLINE"
    RECOMMENDED_ACTION_TARGET = "RECOMMENDED_ACTION_TARGET"
    REMINDER_DATE = "REMINDER_DATE"


class VerificationStatus(StrEnum):
    VERIFIED = "VERIFIED"
    NEEDS_CONFIRMATION = "NEEDS_CONFIRMATION"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass(frozen=True)
class ProvenanceFact:
    id: str
    document_id: str
    case_id: str | None
    fact_type: str
    value: str | None
    normalized_value: str | None
    source_page: int | None
    source_span: str | None
    extractor: str
    confidence: float | None
    review_status: FactReviewStatus = FactReviewStatus.EXTRACTED_CANDIDATE
    reviewed_value: str | None = None
    reviewed_at: str | None = None

    @property
    def effective_value(self) -> str | None:
        return self.reviewed_value if self.reviewed_value is not None else self.normalized_value or self.value

    def confirm(self, value: str | None = None, *, reviewed_at: str | None = None) -> "ProvenanceFact":
        return ProvenanceFact(**{**self.__dict__, "review_status": FactReviewStatus.USER_CONFIRMED, "reviewed_value": value or self.effective_value, "reviewed_at": reviewed_at})

    def correct(self, value: str, *, reviewed_at: str | None = None) -> "ProvenanceFact":
        return ProvenanceFact(**{**self.__dict__, "review_status": FactReviewStatus.USER_CORRECTED, "reviewed_value": value, "normalized_value": value, "reviewed_at": reviewed_at})


@dataclass(frozen=True)
class NoticeClassification:
    family: NoticeFamily
    confidence: float
    supporting_evidence: tuple[str, ...] = ()
    confirmation_status: FactReviewStatus = FactReviewStatus.EXTRACTED_CANDIDATE
    supported: bool = False
    required_missing_facts: tuple[str, ...] = ()


@dataclass(frozen=True)
class Clock:
    id: str
    case_id: str
    clock_type: ClockType
    trigger_fact_id: str | None
    due_date: date | None
    rule_id: str | None
    rule_version: str | None
    legal_basis: str | None
    verification_status: VerificationStatus
    confidence: float | None
    source_page: int | None = None
    source_span: str | None = None
    label: str = ""
    status: str = "open"


@dataclass(frozen=True)
class Rule:
    rule_id: str
    family: NoticeFamily
    version: str
    trigger_fact_types: tuple[str, ...]
    days_after_trigger: int
    legal_basis: str
    official_source: str
    active: bool = False
    counsel_reviewed: bool = False
    exceptions: tuple[str, ...] = ()


@dataclass(frozen=True)
class Reminder:
    id: str
    case_id: str
    source_clock_id: str
    reminder_date: date
    status: str = "scheduled"
    clock_type: ClockType = ClockType.REMINDER_DATE


@dataclass(frozen=True)
class FirstResponse:
    classification: NoticeClassification
    facts: tuple[ProvenanceFact, ...]
    clocks: tuple[Clock, ...]
    next_actions: tuple[str, ...]
    recommended_targets: tuple[Clock, ...]
    handoff_required: bool
    handoff_reason: str | None


@dataclass(frozen=True)
class ProductEvent:
    name: str
    case_id: str
    occurred_at: str
    metadata: dict[str, Any] = field(default_factory=dict)


SUPPORTED_FAMILIES = {
    NoticeFamily.EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE,
    NoticeFamily.TRAFFIC_OR_BUSSGELD_NOTICE,
    NoticeFamily.AUTHORITY_OR_RESIDENCE_DECISION_REQUEST,
}

# Engineering-safe fixture rules only.  No rule is presented as counsel-approved.
RULES: tuple[Rule, ...] = (
    Rule("engineering.employment.response.v1", NoticeFamily.EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE, "1", ("received_date",), 7, "ENGINEERING_SYNTHETIC_RULE", "fixture://fellaw/employment-response", False),
    Rule("engineering.traffic.response.v1", NoticeFamily.TRAFFIC_OR_BUSSGELD_NOTICE, "1", ("received_date",), 14, "ENGINEERING_SYNTHETIC_RULE", "fixture://fellaw/traffic-response", False),
)


def classify_notice(text: str, *, document_id: str = "document") -> NoticeClassification:
    """Bounded lexical classifier; ambiguity and unsupported text abstain."""
    value = text.lower()
    matches: list[tuple[NoticeFamily, tuple[str, ...]]] = [
        (NoticeFamily.EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE, ("kündigung", "termination", "arbeitsverhältnis", "arbeitsrecht")),
        (NoticeFamily.TRAFFIC_OR_BUSSGELD_NOTICE, ("bußgeld", "bussgeld", "verkehr", "ordnungswidrigkeit")),
        (NoticeFamily.AUTHORITY_OR_RESIDENCE_DECISION_REQUEST, ("ausländerbehörde", "aufenthalt", "behörde", "bescheid")),
        (NoticeFamily.TENANCY_NOTICE, ("mietkündigung", "mietvertrag", "vermieter")),
    ]
    found = [(family, tuple(k for k in keys if k in value)) for family, keys in matches if any(k in value for k in keys)]
    # High-signal families win over generic authority vocabulary such as
    # "Bescheid"; otherwise multiple matches remain safely ambiguous.
    if any(family == NoticeFamily.TRAFFIC_OR_BUSSGELD_NOTICE for family, _ in found) and any(k in value for k in ("bußgeld", "bussgeld", "verkehr")):
        found = [(family, keys) for family, keys in found if family == NoticeFamily.TRAFFIC_OR_BUSSGELD_NOTICE]
    elif any(family == NoticeFamily.EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE for family, _ in found) and "kündigung" in value:
        found = [(family, keys) for family, keys in found if family == NoticeFamily.EMPLOYMENT_TERMINATION_OR_ADVERSE_NOTICE]
    if len(found) != 1 or found[0][0] == NoticeFamily.TENANCY_NOTICE:
        return NoticeClassification(NoticeFamily.UNKNOWN_OR_UNSUPPORTED, 0.0 if not found else 0.45, tuple(k for _, keys in found for k in keys), supported=False, required_missing_facts=("document_type_confirmation",))
    family, evidence = found[0]
    return NoticeClassification(family, min(0.95, 0.65 + 0.1 * len(evidence)), evidence, supported=family in SUPPORTED_FAMILIES, required_missing_facts=("received_date",))


def document_stated_deadline(*, case_id: str, fact: ProvenanceFact, clock_id: str = "document-deadline") -> Clock:
    if fact.fact_type != "document_stated_deadline" or not fact.effective_value:
        raise ValueError("document-stated deadline requires an evidenced date fact")
    try:
        due = date.fromisoformat(fact.effective_value)
    except ValueError:
        return Clock(clock_id, case_id, ClockType.DOCUMENT_STATED_DEADLINE, fact.id, None, None, None, None, VerificationStatus.NEEDS_CONFIRMATION, fact.confidence, fact.source_page, fact.source_span, "Date stated in document")
    return Clock(clock_id, case_id, ClockType.DOCUMENT_STATED_DEADLINE, fact.id, due, None, None, "DOCUMENT_EVIDENCE", VerificationStatus.VERIFIED if fact.review_status in {FactReviewStatus.USER_CONFIRMED, FactReviewStatus.USER_CORRECTED} else VerificationStatus.NEEDS_CONFIRMATION, fact.confidence, fact.source_page, fact.source_span, "Date stated in document")


def calculate_statutory_clock(*, case_id: str, classification: NoticeClassification, facts: Iterable[ProvenanceFact], rule: Rule | None = None, clock_id: str = "statutory-clock") -> Clock:
    """Calculate only from a confirmed trigger and an active rule.

    Urgency is intentionally not an input.  Inactive/unreviewed rules abstain.
    """
    selected = rule or next((r for r in RULES if r.family == classification.family), None)
    facts_by_type = {f.fact_type: f for f in facts}
    if selected is None or not selected.active or not selected.counsel_reviewed:
        return Clock(clock_id, case_id, ClockType.STATUTORY_DEADLINE, None, None, selected.rule_id if selected else None, selected.version if selected else None, selected.legal_basis if selected else None, VerificationStatus.REVIEW_REQUIRED, None, label="Statutory calculation unavailable")
    trigger = next((facts_by_type.get(t) for t in selected.trigger_fact_types if facts_by_type.get(t)), None)
    if trigger is None or trigger.review_status not in {FactReviewStatus.USER_CONFIRMED, FactReviewStatus.USER_CORRECTED} or not trigger.effective_value:
        return Clock(clock_id, case_id, ClockType.STATUTORY_DEADLINE, trigger.id if trigger else None, None, selected.rule_id, selected.version, selected.legal_basis, VerificationStatus.NEEDS_CONFIRMATION, trigger.confidence if trigger else None, trigger.source_page if trigger else None, trigger.source_span if trigger else None, label="Statutory deadline needs confirmation")
    try:
        due = date.fromisoformat(trigger.effective_value) + timedelta(days=selected.days_after_trigger)
    except ValueError:
        due = None
    return Clock(clock_id, case_id, ClockType.STATUTORY_DEADLINE, trigger.id, due, selected.rule_id, selected.version, selected.legal_basis, VerificationStatus.VERIFIED if due else VerificationStatus.NEEDS_CONFIRMATION, trigger.confidence, trigger.source_page, trigger.source_span, label="Statutory deadline")


def recommended_action_target(*, case_id: str, target: date, action: str, clock_id: str = "action-target") -> Clock:
    return Clock(clock_id, case_id, ClockType.RECOMMENDED_ACTION_TARGET, None, target, None, None, "PRODUCT_PROCESS_GUIDANCE", VerificationStatus.VERIFIED, 1.0, label=action)


def reminder_from_clock(*, reminder_id: str, clock: Clock, reminder_date: date | None = None) -> Reminder:
    if clock.due_date is None or clock.clock_type == ClockType.REMINDER_DATE:
        raise ValueError("reminder requires a dated source clock")
    return Reminder(reminder_id, clock.case_id, clock.id, reminder_date or clock.due_date, clock_type=ClockType.REMINDER_DATE)


def first_response(*, classification: NoticeClassification, facts: Iterable[ProvenanceFact], clocks: Iterable[Clock], case_id: str) -> FirstResponse:
    facts_tuple = tuple(facts)
    clocks_tuple = tuple(clocks)
    needs_confirmation = any(c.verification_status in {VerificationStatus.NEEDS_CONFIRMATION, VerificationStatus.REVIEW_REQUIRED} for c in clocks_tuple)
    unsupported = not classification.supported
    handoff = unsupported or needs_confirmation
    actions = ("Confirm the missing date or fact shown in the evidence.",) if needs_confirmation else ("Review the source evidence and complete the next listed action.",)
    if unsupported:
        actions = ("Keep the document available and request human review; no supported legal conclusion was generated.",)
    return FirstResponse(classification, facts_tuple, clocks_tuple, actions, tuple(c for c in clocks_tuple if c.clock_type == ClockType.RECOMMENDED_ACTION_TARGET), handoff, "Unsupported or unresolved critical facts" if handoff else None)


def llm_statutory_override_attempt(*, candidate_due_date: date, authoritative_clock: Clock) -> Clock:
    """Explicitly ignore a model-proposed statutory date."""
    if authoritative_clock.clock_type != ClockType.STATUTORY_DEADLINE:
        raise ValueError("authoritative clock must be statutory")
    return authoritative_clock


def handoff_packet(response: FirstResponse, *, language: str = "de", contact_preference: str | None = None) -> dict[str, Any]:
    return {"case_id": response.clocks[0].case_id if response.clocks else None, "language": language, "facts": [f.__dict__ for f in response.facts], "clocks": [c.__dict__ for c in response.clocks], "next_actions": list(response.next_actions), "handoff_required": response.handoff_required, "handoff_reason": response.handoff_reason, "contact_preference": contact_preference, "counsel_decision": "UNKNOWN"}
