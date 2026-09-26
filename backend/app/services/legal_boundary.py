"""Canonical legal-capability boundary (PR-02).

Engineering/risk-review vocabulary ONLY. These classes and approval states say
nothing about what is legally permissible under the RDG; they are the
product's own risk-boundary contract used to quarantine individualized legal
judgment and strategic drafting until written counsel review exists.

Classes (L0..L4):

    L0_GENERAL_INFORMATION
        General/public legal information; not based on applying law to a
        user's concrete facts.

    L1_DOCUMENT_EXPLANATION
        Extraction, translation, summarization, or explanation of what a
        user's document visibly contains; must not silently become
        individualized legal judgment.

    L2_PROCESS_NAVIGATION
        Process/procedure information, official source navigation, required
        information collection, and safe next-step framing; no individualized
        legal conclusion or strategic recommendation.

    L3_INDIVIDUAL_LEGAL_ASSESSMENT
        Applying legal rules to a user's concrete facts to reach an
        individualized legal conclusion, merits assessment,
        entitlement/defense conclusion, or comparable judgment.

    L4_STRATEGIC_DRAFTING_OR_REPRESENTATION
        Rebuttal strategy; legal defenses selected for this matter;
        cross-examination/witness questions; pleadings/court submissions;
        strategic correspondence; representation/execution on the user's
        behalf.

Approval states (independent of class):

    APPROVED         -> normal public execution permitted
    REVIEW_REQUIRED  -> requires written counsel decision before release
    DISABLED         -> not executable in any mode

Engine rule: every public legal capability has one class + one approval
state. Higher-risk classes are not approved merely by being named; each real
implementation is reviewed for boundary leakage (an L1/L2 endpoint whose
prompt produces L3/L4 conclusions is classified by ACTUAL behavior).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

import structlog

log = structlog.get_logger(__name__)


class CapabilityClass(str, Enum):
    L0_GENERAL_INFORMATION = "L0_GENERAL_INFORMATION"
    L1_DOCUMENT_EXPLANATION = "L1_DOCUMENT_EXPLANATION"
    L2_PROCESS_NAVIGATION = "L2_PROCESS_NAVIGATION"
    L3_INDIVIDUAL_LEGAL_ASSESSMENT = "L3_INDIVIDUAL_LEGAL_ASSESSMENT"
    L4_STRATEGIC_DRAFTING_OR_REPRESENTATION = "L4_STRATEGIC_DRAFTING_OR_REPRESENTATION"


class ApprovalState(str, Enum):
    APPROVED = "APPROVED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    DISABLED = "DISABLED"


# ---------------------------------------------------------------------------
# Terminology (PR-02C): engineering execution state vs counsel decision
# ---------------------------------------------------------------------------
# APPROVED / REVIEW_REQUIRED / DISABLED are ENGINEERING EXECUTION STATES
# only. They describe whether this codebase is allowed to execute a
# capability's behavior for public users right now. They are NOT legal or
# counsel approval. Counsel approval is tracked separately per capability in
# docs/LEGAL_CAPABILITY_REVIEW.md under `counsel_decision` and remains
# UNKNOWN unless a written decision exists.


@dataclass(frozen=True)
class BoundaryPolicy:
    """One legal capability's risk-boundary record (canonical vocabulary)."""

    capability_id: str
    capability_class: CapabilityClass
    approval_state: ApprovalState
    entry_points: tuple[str, ...]
    reason: str = ""
    # True when this policy deliberately keeps an L0/L1/L2 behavior usable
    # while gating only the L3/L4 leakage of the same endpoint.
    preserves_grounded_info: bool = False


# ---------------------------------------------------------------------------
# Canonical policy table
# ---------------------------------------------------------------------------
# Every capability that can produce individualized legal judgment, strategic
# legal output, or case-specific legal drafting gets an explicit record here.
# Until written counsel review exists (docs/LEGAL_CAPABILITY_REVIEW.md):
#   L3 => REVIEW_REQUIRED (not publicly executable)
#   L4 => REVIEW_REQUIRED (not publicly executable)

BOUNDARY_POLICIES: tuple[BoundaryPolicy, ...] = (
    # --- L0 / L1 / L2: general information, document explanation, navigation ---
    BoundaryPolicy(
        capability_id="laws_search",
        capability_class=CapabilityClass.L0_GENERAL_INFORMATION,
        approval_state=ApprovalState.APPROVED,
        entry_points=(
            "GET /api/v1/laws/search",
            "POST /api/v1/chat/message (bounded A-path: statute/source lookup only)",
            "bot ask intent (statute/source lookup only)",
        ),
        reason=(
            "Bounded general/source lookup: deterministic RAG retrieval of "
            "statute/source text, general rule explanation, citations. No "
            "application of law to the user's concrete facts, no merits "
            "conclusion, no strategy, no drafting. The prompt is bound to "
            "retrieval-and-explain; it does not assess a case."
        ),
        preserves_grounded_info=True,
    ),
    BoundaryPolicy(
        capability_id="generic_legal_chat",
        capability_class=CapabilityClass.L3_INDIVIDUAL_LEGAL_ASSESSMENT,
        approval_state=ApprovalState.REVIEW_REQUIRED,
        entry_points=(
            "POST /api/v1/chat/message (generative B-path)",
            "GET /api/v1/chat/stream (generative B-path)",
        ),
        reason=(
            "Arbitrary generative legal conversation. The user's message text "
            "IS the concrete facts; a general-purpose generative chat cannot "
            "be bound to 'no application to the user's facts', so it can "
            "produce individualized legal assessment/strategy/drafting "
            "(L3/L4). Quarantined until a bounded behavioral contract is "
            "demonstrated and counsel review exists. The bounded A-path "
            "(laws_search) stays APPROVED."
        ),
    ),
    BoundaryPolicy(
        capability_id="analyze_document",
        capability_class=CapabilityClass.L1_DOCUMENT_EXPLANATION,
        approval_state=ApprovalState.REVIEW_REQUIRED,
        entry_points=(
            "POST /api/v1/chat/analyze-document",
            "upload pipeline (services/document_service.process_uploaded_document)",
        ),
        reason=(
            "Document extraction/summary/key_dates/key_persons is L1 and is "
            "preserved via the extraction-only operation "
            "(analyze_document_extraction). The rich analyzer "
            "(analyze_document_with_ai) additionally emits "
            "legal_implications + action_required + urgency (L3 leakage) for "
            "a user's concrete document; it is gated REVIEW_REQUIRED and "
            "NOT used by the ordinary upload pipeline. The chat endpoint is "
            "gated REVIEW_REQUIRED."
        ),
        preserves_grounded_info=True,
    ),
    BoundaryPolicy(
        capability_id="document_templates",
        capability_class=CapabilityClass.L4_STRATEGIC_DRAFTING_OR_REPRESENTATION,
        approval_state=ApprovalState.REVIEW_REQUIRED,
        entry_points=("POST /api/v1/templates/generate",),
        reason=(
            "Classified by OUTPUT, not implementation technology. The "
            "repository contains NO template bodies/seeds (migration creates "
            "tables only); active DB template bodies cannot be verified "
            "without a live DB. Because template output may be a strategic "
            "legal document (objection, complaint, termination-related legal "
            "correspondence, legal argument letter, pleading/court "
            "submission, defense/rebuttal correspondence), generation fails "
            "closed pending review. Listing/metadata endpoints stay "
            "functional (preserves_grounded_info)."
        ),
        preserves_grounded_info=True,
    ),
    # --- L3 / L4: individualized assessment and strategic drafting ---
    BoundaryPolicy(
        capability_id="roadmap_generation",
        capability_class=CapabilityClass.L3_INDIVIDUAL_LEGAL_ASSESSMENT,
        approval_state=ApprovalState.REVIEW_REQUIRED,
        entry_points=(
            "POST /api/v1/chat/roadmap",
            "POST /api/v1/cases/{case_id}/roadmap/generate",
            "PUT /api/v1/cases/{case_id}/roadmap/{step_id} (substantive mutation)",
        ),
        reason=(
            "Generates an individualized step-by-step legal action plan from "
            "case facts (defense strategy, deadlines, court actions). L3 per "
            "actual behavior. Quarantined until counsel review. Read-only GET "
            "of previously persisted rows stays operational to avoid breaking "
            "the dashboard; no NEW L3 content can be created while gated. "
            "PUT mutation of substantive steps (title/description/"
            "action_items/deadline/priority/resources) is gated; only the "
            "neutral lifecycle status field is permitted."
        ),
    ),
    BoundaryPolicy(
        capability_id="narrative_generation",
        capability_class=CapabilityClass.L4_STRATEGIC_DRAFTING_OR_REPRESENTATION,
        approval_state=ApprovalState.REVIEW_REQUIRED,
        entry_points=(
            "POST /api/v1/chat/narrative",
            "POST /api/v1/cases/{case_id}/narratives/generate",
            "PUT /api/v1/cases/{case_id}/narratives/{narrative_id} (substantive mutation)",
        ),
        reason=(
            "Constructs legally structured documents (Stellungnahmen, "
            "Schriftsätze, complaints, letters to opposing counsel) from case "
            "state + RAG context. L4 per actual behavior. Quarantined until "
            "counsel review. Read-only GET of previously persisted rows stays "
            "operational; no NEW narrative content can be created while "
            "gated. PUT mutation of substantive narrative content/type is "
            "gated; only the neutral is_final flag is permitted."
        ),
    ),
    BoundaryPolicy(
        capability_id="counterargument_analysis",
        capability_class=CapabilityClass.L4_STRATEGIC_DRAFTING_OR_REPRESENTATION,
        approval_state=ApprovalState.REVIEW_REQUIRED,
        entry_points=("POST /api/v1/chat/counterargument",),
        reason=(
            "Generates suggested rebuttals, legal defenses, and "
            "cross-examination questions for a user's matter. L4 per actual "
            "behavior. Quarantined until counsel review."
        ),
    ),
)

# ---------------------------------------------------------------------------
# Canonical execution route -> boundary capability id map (PR-02C Finding 6)
# ---------------------------------------------------------------------------
# ONE canonical mapping, derived (not hand-counted). Tests iterate this map.
# Each mapped REVIEW_REQUIRED generation/analysis route must: be registered,
# map to exactly one policy, fail closed, fail before DB/LLM/persistence.
#
# The two PUT routes are mapped to their capability for audit completeness,
# but they are SMA-gated (narrowed lifecycle schema: status / is_final only),
# not require_executable-gated — substantive mutation is rejected by the
# schema, which is the gate. Unit tests verify the schema narrowing directly.
BOUNDARY_ROUTE_MAP: dict[str, str] = {
    # bounded general/source lookup (L0, APPROVED)
    "GET /api/v1/laws/search": "laws_search",
    # arbitrary generative legal conversation (L3, REVIEW_REQUIRED)
    "POST /api/v1/chat/message": "generic_legal_chat",
    "GET /api/v1/chat/stream": "generic_legal_chat",
    # document analysis (L1 extraction preserved; rich analyzer gated)
    "POST /api/v1/chat/analyze-document": "analyze_document",
    # templates: generation gated; listing preserved (metadata only)
    "POST /api/v1/templates/generate": "document_templates",
    # roadmap generation (L3) + substantive mutation (L3, schema-gated)
    "POST /api/v1/chat/roadmap": "roadmap_generation",
    "POST /api/v1/cases/{case_id}/roadmap/generate": "roadmap_generation",
    "PUT /api/v1/cases/{case_id}/roadmap/{step_id}": "roadmap_generation",
    # narrative generation (L4) + substantive mutation (L4, schema-gated)
    "POST /api/v1/chat/narrative": "narrative_generation",
    "POST /api/v1/cases/{case_id}/narratives/generate": "narrative_generation",
    "PUT /api/v1/cases/{case_id}/narratives/{narrative_id}": "narrative_generation",
    # counterargument analysis (L4)
    "POST /api/v1/chat/counterargument": "counterargument_analysis",
}

_BY_ID: dict[str, BoundaryPolicy] = {p.capability_id: p for p in BOUNDARY_POLICIES}


def boundary_policy(capability_id: str) -> BoundaryPolicy | None:
    """Return the canonical boundary policy for a capability id."""
    return _BY_ID.get(capability_id)


def boundary_policies() -> tuple[BoundaryPolicy, ...]:
    """All canonical boundary policies (for inventory/contract tests)."""
    return BOUNDARY_POLICIES


def is_executable(capability_id: str) -> bool:
    """True for capabilities allowed normal public execution.

    Capabilities WITH a policy are executable only when APPROVED; L3/L4 and
    REVIEW_REQUIRED/DISABLED states fail closed.
    """
    p = _BY_ID.get(capability_id)
    if p is None:
        # Registry filtering: a capability with NO boundary policy is outside
        # the legal-judgment surface (navigation, intake, notifications,
        # referrals) and is not gated by this boundary. See
        # registry_legal_execution_status() for the safe lookup used by
        # display filtering.
        return True
    allowed = {ApprovalState.APPROVED}
    return p.approval_state in allowed


def registry_legal_execution_status(capability_id: str) -> bool:
    """Legal-execution status for REGISTRY DISPLAY filtering.

    Returns True (offer the capability) when the capability has no boundary
    policy (ordinary navigation/intake) OR its policy is APPROVED. Returns
    False when the policy exists and is not APPROVED (REVIEW_REQUIRED /
    DISABLED) — do not advertise unavailable legal capabilities.
    """
    p = _BY_ID.get(capability_id)
    if p is None:
        return True  # ordinary navigation etc. — not part of legal surface
    return p.approval_state == ApprovalState.APPROVED


class BoundaryDisabled(Exception):
    """Raised by the fail-closed gate when a capability is not executable.

    Carries the canonical capability id, class, and approval state so callers
    can render the deterministic typed response without guessing.
    """

    def __init__(self, capability_id: str, policy: BoundaryPolicy | None):
        self.capability_id = capability_id
        self.policy = policy
        super().__init__(
            f"capability {capability_id!r} is not executable "
            f"(class={policy.capability_class.value if policy else 'UNKNOWN'}, "
            f"approval={policy.approval_state.value if policy else 'NO_POLICY'})"
        )


def require_executable(capability_id: str) -> None:
    """Fail-closed LEGAL EXECUTION AUTHORITY gate.

    Raise BEFORE any LLM call or persistence. This is the single canonical
    boundary check. Call it as the FIRST statement of every L3/L4 (and
    leak-prone) handler, before constructing prompts, calling the model, or
    writing rows.

    Behavior (PR-02C Finding 2):
      explicit APPROVED       -> execute (return)
      REVIEW_REQUIRED         -> block  (raise BoundaryDisabled)
      DISABLED                -> block  (raise BoundaryDisabled)
      unknown / misspelled id -> block  (raise BoundaryDisabled as a
                                         configuration error; a typo must
                                         never enable a legal operation)
    """
    policy = _BY_ID.get(capability_id)
    if policy is None:
        log.error(
            "legal_boundary.unknown_capability",
            capability_id=capability_id,
        )
        raise BoundaryDisabled(capability_id, None)
    if policy.approval_state != ApprovalState.APPROVED:
        log.warning(
            "legal_boundary.blocked",
            capability_id=capability_id,
            approval=policy.approval_state.value,
        )
        raise BoundaryDisabled(capability_id, policy)


def disabled_response(capability_id: str, language: str = "de") -> dict[str, Any]:
    """Deterministic typed response for a blocked capability.

    Used by endpoints that must remain routable for compatibility. The
    response states the capability requires professional/legal review and
    points to the existing safe human handoff (/urgent/select or /find-lawyer),
    without inventing any licensed-professional availability.
    """
    policy = _BY_ID.get(capability_id)
    cls = policy.capability_class.value if policy else "UNKNOWN"
    state = policy.approval_state.value if policy else "NO_POLICY"
    if (language or "").lower().startswith("de"):
        reason = (
            "Diese Funktion erfordert eine fachliche/rechtliche Prüfung und ist "
            "derzeit nicht öffentlich verfügbar. Für eine akute Situation nutzen "
            "Sie die Soforthilfe; für anwaltliche Unterstützung nutzen Sie die "
            "Anwaltssuche."
        )
    else:
        reason = (
            "This capability requires professional/legal review and is not "
            "currently available for public use. For an acute situation use "
            "urgent help; for lawyer support use the lawyer search."
        )
    return {
        "capability_id": capability_id,
        "capability_class": cls,
        "approval_state": state,
        "executable": False,
        "detail": reason,
        "safe_handoff": "/urgent/select",
        "lawyer_handoff": "/find-lawyer",
    }
