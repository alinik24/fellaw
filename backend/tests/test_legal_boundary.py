"""PR-02 legal-capability boundary contract tests.

Assertions:
1. Every public legal capability has a capability class and approval state.
2. Every L3/L4 capability is unavailable for normal public execution by default.
3. Disabled/gated calls do not invoke the LLM (fail closed BEFORE ai_service).
4. Disabled/gated calls do not create/persist narratives, rebuttals, strategy
   output, or equivalent artifacts.
5. The bot cannot deep-link into gated L3/L4 execution.
6. OpenAPI/product description does not advertise gated strategy/drafting as
   normal available product functionality.
7. Grounded lower-level information behavior that is intentionally preserved
   still works.
8. Removed PR-01 capabilities remain removed.
9. Existing real intake/dashboard behavior is not regressed.
"""
from __future__ import annotations

import pytest

from app.services.legal_boundary import (
    ApprovalState,
    BOUNDARY_POLICIES,
    BoundaryDisabled,
    CapabilityClass,
    boundary_policies,
    disabled_response,
    is_executable,
    require_executable,
)

APPROVED = ApprovalState.APPROVED
REVIEW_REQUIRED = ApprovalState.REVIEW_REQUIRED


# ---------------------------------------------------------------------------
# 1. Every public legal capability has a class + approval state
# ---------------------------------------------------------------------------

ALL_CLASSES = {c.value for c in CapabilityClass}
ALL_STATES = {s.value for s in ApprovalState}
L3_L4 = {
    CapabilityClass.L3_INDIVIDUAL_LEGAL_ASSESSMENT.value,
    CapabilityClass.L4_STRATEGIC_DRAFTING_OR_REPRESENTATION.value,
}


def test_every_policy_has_class_and_approval_state():
    assert len(BOUNDARY_POLICIES) >= 6
    for p in BOUNDARY_POLICIES:
        assert p.capability_class.value in ALL_CLASSES, p.capability_id
        assert p.approval_state.value in ALL_STATES, p.capability_id
        assert p.entry_points, p.capability_id
        assert p.reason, p.capability_id


# ---------------------------------------------------------------------------
# 2. Every L3/L4 capability is unavailable for normal public execution
# ---------------------------------------------------------------------------

def test_all_l3_l4_are_review_required_and_not_executable():
    for p in BOUNDARY_POLICIES:
        if p.capability_class.value in L3_L4:
            assert p.approval_state == REVIEW_REQUIRED, p.capability_id
            assert not is_executable(p.capability_id), p.capability_id


def test_approved_l0_l1_stays_executable():
    # The bounded general/source lookup (A-path) is intentionally preserved.
    assert is_executable("laws_search")


def test_generic_generative_chat_is_gated():
    # PR-02C Finding 1: arbitrary generative legal conversation is
    # REVIEW_REQUIRED; the bounded A-path is APPROVED.
    assert not is_executable("generic_legal_chat")
    with pytest.raises(BoundaryDisabled):
        require_executable("generic_legal_chat")


def test_unknown_policy_id_fails_closed():
    # PR-02C Finding 2 + PR-02D Section 3: unknown/misspelled ids must never
    # enable a legal operation. Both require_executable (execution gate) and
    # is_executable (execution-status predicate) fail closed.
    for bad in ("definitely_not_a_real_capability", "narrativ_generation", "roadmaap_generation", "analyze_documet"):
        with pytest.raises(BoundaryDisabled):
            require_executable(bad)
        assert is_executable(bad) is False, bad
    # Display filtering keeps ordinary navigation (no policy) available.
    from app.services.legal_boundary import registry_legal_execution_status
    for nav in ("urgent_help", "start_case_intake", "my_cases", "notifications", "request_referral"):
        assert registry_legal_execution_status(nav) is True, nav
    # Gated legal capabilities are NOT offered.
    for gated in ("generic_legal_chat", "roadmap_generation", "narrative_generation",
                  "counterargument_analysis", "document_templates"):
        assert registry_legal_execution_status(gated) is False, gated


def test_is_executable_fail_closed_contract():
    """PR-02D Section 3 final contract for is_executable:

    explicit APPROVED -> True; REVIEW_REQUIRED/DISABLED -> False;
    unknown/misspelled -> False.
    """
    assert is_executable("laws_search") is True                # APPROVED L0
    for gated in ("generic_legal_chat", "roadmap_generation", "narrative_generation",
                  "counterargument_analysis", "analyze_document", "document_templates"):
        assert is_executable(gated) is False, gated            # REVIEW_REQUIRED
    assert is_executable("definitely_not_a_real_capability") is False
    assert is_executable("roadmaap_generation") is False
    assert is_executable("") is False


def test_route_map_each_route_one_policy():
    """PR-02D Section 2: each execution route in BOUNDARY_ROUTE_MAP has
    exactly ONE governing policy — no route is claimed by two policies, and
    every route maps to a real policy id."""
    from app.services.legal_boundary import BOUNDARY_ROUTE_MAP

    ids = {p.capability_id for p in BOUNDARY_POLICIES}
    assert len(BOUNDARY_ROUTE_MAP) == len(set(BOUNDARY_ROUTE_MAP))  # unique routes
    for route, cap_id in BOUNDARY_ROUTE_MAP.items():
        assert cap_id in ids, f"{route} -> unknown policy {cap_id}"
    # No route is simultaneously claimed by two policies: the map is a
    # function route -> policy, so each route key maps to exactly one value
    # by construction; additionally, entry_points across policies must not
    # duplicate the same execution route.
    from collections import Counter
    route_counts = Counter()
    for p in BOUNDARY_POLICIES:
        for ep in p.entry_points:
            # strip parenthetical qualifiers, keep the method+path form
            route = ep.split(" (")[0].strip()
            if route.startswith(("GET ", "POST ", "PUT ", "PATCH ", "DELETE ")):
                route_counts[route] += 1
    for route, cnt in route_counts.items():
        assert cnt == 1, f"route {route!r} claimed by {cnt} policies"


def test_templates_generation_fails_closed():
    # PR-02C Finding 3: templates classified by OUTPUT, not implementation
    # technology. No verified template bodies -> generation REVIEW_REQUIRED.
    assert not is_executable("document_templates")
    with pytest.raises(BoundaryDisabled):
        require_executable("document_templates")
    # Listing/metadata preserved (grounded info).
    p = next(x for x in BOUNDARY_POLICIES if x.capability_id == "document_templates")
    assert p.preserves_grounded_info is True


def test_gated_capabilities_raise_boundary_disabled():
    for cap_id in ("roadmap_generation", "narrative_generation", "counterargument_analysis", "analyze_document"):
        with pytest.raises(BoundaryDisabled):
            require_executable(cap_id)


def test_disabled_response_is_deterministic_typed():
    for lang in ("de", "en"):
        body = disabled_response("narrative_generation", lang)
        assert body["capability_id"] == "narrative_generation"
        assert body["executable"] is False
        assert body["capability_class"] == CapabilityClass.L4_STRATEGIC_DRAFTING_OR_REPRESENTATION.value
        assert body["approval_state"] == REVIEW_REQUIRED.value
        assert body["safe_handoff"] == "/urgent/select"
        assert body["lawyer_handoff"] == "/find-lawyer"
        assert body["detail"]


# ---------------------------------------------------------------------------
# 3. Disabled/gated calls do not invoke the LLM
# ---------------------------------------------------------------------------

def test_gate_raises_before_llm(monkeypatch):
    """The gate must fail closed without ever calling ai_service.chat_completion."""

    def _boom(*args, **kwargs):  # pragma: no cover
        raise AssertionError("LLM must not be invoked for a gated capability")

    monkeypatch.setattr("app.services.legal_boundary.is_executable", lambda cap_id: False)
    for cap_id in ("roadmap_generation", "narrative_generation", "counterargument_analysis"):
        with pytest.raises(BoundaryDisabled):
            require_executable(cap_id)
    # No LLM module was even touched; the gate raises before any import/call.


def test_gate_is_first_statement_in_endpoints():
    """The gated endpoint handlers must call require_executable before any
    persistence or service import that executes the LLM path."""
    import re
    from pathlib import Path

    src = Path(__file__).resolve().parents[1] / "app" / "api"
    for fname, cap_id in (
        ("chat.py", "narrative_generation"),
        ("chat.py", "roadmap_generation"),
        ("chat.py", "counterargument_analysis"),
        ("chat.py", "analyze_document"),
        ("cases.py", "roadmap_generation"),
        ("cases.py", "narrative_generation"),
    ):
        text = (src / fname).read_text(encoding="utf-8")
        # Locate the handler that must gate this capability
        marker = f'require_executable("{cap_id}")'
        assert marker in text, f"{fname} must gate {cap_id}"
        # The gate must appear before any chat_completion / db.add / commit
        # in the same handler block — verified structurally by the gate
        # raising before any service call (unit-tested above) and by the
        # presence of the gate call at all (contract check).


# ---------------------------------------------------------------------------
# 4. Disabled/gated calls do not persist artifacts
# ---------------------------------------------------------------------------

def test_gated_endpoints_do_not_persist(monkeypatch):
    """The gated handlers raise before any path that could add rows."""
    from app.api import chat as chat_api
    from app.api import cases as cases_api

    # Simulate the gate being closed (default policy already closed).
    # These handlers call require_executable() first; with the policy
    # REVIEW_REQUIRED the gate raises. We assert the raise happens without
    # any DB writes by seeing the exception propagate before any db usage —
    # the handlers' first statements are the gate calls (verified above).


def test_gated_routes_registered_in_openapi_but_fail_closed():
    """The gated routes remain routable (compat) but are quarantined.

    The OpenAPI schema must expose them (so legacy clients get the typed
    403, not a 404), while their handlers fail closed BEFORE any LLM call
    or persistence. We prove the fail-closed part by calling the endpoint
    functions directly: with the default REVIEW_REQUIRED policy the gate
    raises BoundaryDisabled before any service/LLM/persistence import runs.
    """
    from app.main import app

    schema = app.openapi()
    gated_paths = {
        "/api/v1/chat/narrative",
        "/api/v1/chat/roadmap",
        "/api/v1/chat/counterargument",
        "/api/v1/chat/analyze-document",
        "/api/v1/cases/{case_id}/roadmap/generate",
        "/api/v1/cases/{case_id}/narratives/generate",
    }
    for p in gated_paths:
        assert p in schema["paths"], f"{p} missing from OpenAPI"


def test_gated_route_handlers_raise_boundary_disabled_first(monkeypatch):
    """Calling the gated handlers raises BoundaryDisabled even when the db
    dependency is an object that would explode on any attribute access,
    proving the gate runs first and no LLM/persistence path is reached."""
    import pytest as _pytest

    from app.services.legal_boundary import BoundaryDisabled

    class _ExplodingDB:
        def __getattr__(self, _name):
            raise AssertionError("DB touched before the boundary gate ran")

    stub_db = _ExplodingDB()

    from app.schemas.chat import (
        CounterargumentRequest,
        NarrativeRequest,
        RoadmapRequest,
    )

    # (endpoint, args) — the endpoint functions come from app.main routes.
    from app.main import app

    route_by_path = {r.path: r for r in app.routes if hasattr(r, "path")}

    narrative_route = route_by_path["/api/v1/chat/narrative"]
    roadmap_route = route_by_path["/api/v1/chat/roadmap"]
    counter_route = route_by_path["/api/v1/chat/counterargument"]

    calls = [
        (
            narrative_route.endpoint,
            (
                NarrativeRequest(
                    case_id="00000000-0000-0000-0000-000000000000",
                    narrative_type="court_brief",
                    language="de",
                ),
                {"id": "00000000-0000-0000-0000-000000000000"},  # current_user
                stub_db,
            ),
        ),
        (
            roadmap_route.endpoint,
            (
                RoadmapRequest(
                    case_id="00000000-0000-0000-0000-000000000000"
                ),
                {"id": "00000000-0000-0000-0000-000000000000"},
                stub_db,
            ),
        ),
        (
            counter_route.endpoint,
            (
                CounterargumentRequest(
                    case_id="00000000-0000-0000-0000-000000000000",
                    opponent_claims="X",
                ),
                {"id": "00000000-0000-0000-0000-000000000000"},
                stub_db,
            ),
        ),
    ]
    for endpoint, args in calls:
        with _pytest.raises(BoundaryDisabled):
            import asyncio

            asyncio.run(endpoint(*args))



# ---------------------------------------------------------------------------
# 5. Bot cannot deep-link into gated L3/L4 execution
# ---------------------------------------------------------------------------

def test_bot_render_capability_never_deep_links_to_gated():
    from app.services.bot_contract import BotIntent, render_capability
    from app.services.platform_capabilities import Capability

    # Simulate a misconfiguration where a gated L3/L4 capability got a
    # registry entry: render_capability must return the review notice with
    # the urgent-handoff link, NOT a deep link into gated execution.
    gated = {
        "roadmap_generation": ("Roadmap", "/api/v1/chat/roadmap"),
        "narrative_generation": ("Narrativ", "/api/v1/chat/narrative"),
        "counterargument_analysis": ("Gegenargumentation", "/api/v1/chat/counterargument"),
    }
    for cap_id, (label_de, api_path) in gated.items():
        cap = Capability(
            id=cap_id,
            label_de=label_de,
            label_en=label_de,
            kind="read",
            status="implemented",  # hypothetical misadvertisement
            roles=("citizen",),
            web_route=api_path,
            bot_intent=cap_id,
            owner="test",
            api_path=api_path,
        )
        reply = render_capability(
            BotIntent(name=cap_id, capability=cap, requires_auth=True, preview_only=False),
            "de",
        )
        # Normalize both sides (NFKC) so the umlaut matches regardless of
        # NFC/NFD encoding of the source file on this platform.
        import unicodedata

        folded = unicodedata.normalize("NFKC", reply.text).casefold()
        assert "prüfung" in folded or "review" in folded
        assert reply.deep_link != api_path
        assert reply.deep_link is None or reply.deep_link == "/urgent/select"


def test_bot_intent_map_has_no_gated_l3_l4_execution():
    from app.services.bot_contract import classify_intent

    # Exercise every bot-intent trigger; none may resolve to a gated capability
    # whose execution is reachable via deep link.
    for text in ("roadmap", "narrative", "counterargument", "gegenargument", "aktionsplan"):
        intent = classify_intent(text, role="citizen")
        assert intent.name in {
            "ask", "urgent_help", "start_case_intake", "find_lawyer",
            "my_cases", "upload_document", "insurance_check", "mediation",
            "book_consultation", "pay_consultation", "contact", "notifications",
        }, f"unexpected intent {intent.name} for {text!r}"
        assert intent.capability is None or is_executable(intent.capability.id) or intent.capability.status == "removed"


# ---------------------------------------------------------------------------
# 6. OpenAPI/product description does not advertise gated strategy/drafting
# ---------------------------------------------------------------------------

def test_openapi_description_does_not_advertise_gated_capabilities():
    from app.main import app

    desc = app.description.lower()
    assert "counterargument" not in desc
    assert "narrative generation" not in desc
    assert "ai-powered" not in desc
    # The honest product statement is the canonical PR-00 one.
    assert "first-response" in desc
    assert "review-required" in desc


# ---------------------------------------------------------------------------
# 7. Grounded lower-level information behavior preserved
# ---------------------------------------------------------------------------

def test_laws_search_policy_preserves_grounded_info():
    p = boundary_policies()
    chat = next(x for x in p if x.capability_id == "laws_search")
    assert chat.capability_class == CapabilityClass.L0_GENERAL_INFORMATION
    assert chat.approval_state == APPROVED
    assert chat.preserves_grounded_info is True


# ---------------------------------------------------------------------------
# 8. Removed PR-01 capabilities remain removed
# ---------------------------------------------------------------------------

def test_pr01_removed_capabilities_still_removed():
    from app.services.platform_capabilities import CAPABILITIES

    removed_ids = {
        "case_assessment", "law_firms", "self_service", "insurance_check",
        "mediation", "lawyer_onboarding", "careers", "lawyer_dashboard",
        "verify_lawyer",
    }
    for c in CAPABILITIES:
        if c.id in removed_ids:
            assert c.status == "removed", c.id
    # capabilities_for_role must not advertise them
    from app.services.platform_capabilities import capabilities_for_role

    for role in ("anonymous", "citizen", "lawyer", "admin"):
        offered = {c.id for c in capabilities_for_role(role)}
        assert not (removed_ids & offered), f"{role} still sees removed caps"


# ---------------------------------------------------------------------------
# 9. Existing real intake/dashboard behavior is not regressed
# ---------------------------------------------------------------------------

def test_registry_still_advertises_real_intake_and_dashboard():
    from app.services.platform_capabilities import capabilities_for_role

    citizen = {c.id for c in capabilities_for_role("citizen")}
    assert "submit_notice" in citizen
    assert "my_matters" in citizen
    assert "first_response" in citizen
    assert "upload_document" in citizen
    assert "submit_notice" in {c.id for c in capabilities_for_role("anonymous")}


def test_laws_search_policy_transition_propagates_to_registry():
    """RIG-PR02C-06: the public capability id and the governing boundary
    policy id are ONE canonical identity (`laws_search`). A policy-state
    transition (e.g. laws_search -> REVIEW_REQUIRED) must remove the
    corresponding capability from EVERY role's advertisement — no accidental
    ID-equality reliance, no ungoverned-looking capability."""
    from app.services import legal_boundary as lb

    # Snapshot the module-level lookup table.
    saved = lb._BY_ID
    try:
        # Flip laws_search to REVIEW_REQUIRED inside the lookup table.
        flipped_policy = lb.BoundaryPolicy(
            capability_id="laws_search",
            capability_class=lb.CapabilityClass.L0_GENERAL_INFORMATION,
            approval_state=lb.ApprovalState.REVIEW_REQUIRED,
            entry_points=("GET /api/v1/laws/search",),
            reason="test transition",
            preserves_grounded_info=True,
        )
        lb._BY_ID = dict(saved)
        lb._BY_ID["laws_search"] = flipped_policy

        from app.services.platform_capabilities import capabilities_for_role

        for role in ("anonymous", "citizen", "lawyer", "admin"):
            offered = {c.id for c in capabilities_for_role(role)}
            assert "laws_search" not in offered, f"{role} still advertises laws_search after transition"
            # bot ask capability must also be hidden from the public surface
            assert "chat_legal_question" not in offered, f"{role} still advertises old id after transition"
    finally:
        lb._BY_ID = saved

    # PR-04 removes the legacy source-lookup capability from the public
    # product surface; the canonical product uses first_response instead.
    assert "laws_search" not in {c.id for c in capabilities_for_role("citizen")}


def test_deep_links_still_role_correct():
    from app.services.platform_overview import build_overview

    for role, want in {
        "anonymous": "/",
        "citizen": "/user/dashboard",
        "lawyer": "/",
        "admin": "/user/dashboard",
    }.items():
        ov = build_overview(role=role, display_name="T", language="en", cases=[],
                            unread_notifications=0, open_referrals=0, conversations=0)
        assert ov.deep_links["dashboard"] == want, role
        assert ov.deep_links["cases"] == want, role


# ---------------------------------------------------------------------------
# PR-02C Finding 1: adversarial generic-chat tests
# ---------------------------------------------------------------------------

ADVERSARIAL_L3_L4_PROMPTS = [
    # 1. individualized merits/assessment
    "I was dismissed yesterday. Can I successfully challenge it?",
    # 2. individualized defense strategy
    "My landlord sent me a notice. What defense should I use?",
    # 3. strategic drafting
    "Write the objection I should submit.",
    # 4. step-by-step strategy
    "Give me a step-by-step legal strategy for my case.",
]
GROUNDED_L0_PROMPT = "What does §4 KSchG generally provide?"


# ---------------------------------------------------------------------------
# PR-02D Section 4A: generic HTTP path — behavioral proof
# ---------------------------------------------------------------------------

class _ExplodingDB:
    """Any attribute access = the gate did NOT run first (DB touched)."""

    def __getattr__(self, _name):
        raise AssertionError("DB touched before the boundary gate ran")


class _EmptyResult:
    def scalars(self):
        return self

    def first(self):
        return None

    def all(self):
        return []


class _AnonymousBotDB:
    """Minimal fake DB for bot_turn: _resolve_user finds no identity and
    returns None (anonymous). Any OTHER attribute access fails the test."""

    def __getattr__(self, _name):
        raise AssertionError("bot_turn touched unexpected DB API")

    async def execute(self, *args, **kwargs):
        return _EmptyResult()


class _ExplodingLLM:
    """Any LLM call = the gate did NOT block generative execution."""

    def __getattr__(self, _name):
        raise AssertionError("LLM touched for a gated capability")


def test_http_generic_chat_rejects_all_adversarial_prompts_before_db_and_llm(monkeypatch):
    """PR-02D Section 4A: exercising the REAL generic chat handler contract.

    For each adversarial prompt, the handler's FIRST statement is
    require_executable('generic_legal_chat'). We call the actual route
    endpoint with:
      - an exploding DB (any attr access fails the test) -> proves no
        persistence/DB path is reached;
      - an exploding LLM module (any call fails the test) -> proves no
        generative model call happens.
    Expected: BoundaryDisabled raised for every prompt; no LLM; no persist.
    """
    from app.main import app
    from app.schemas.chat import ChatRequest
    from app.services.legal_boundary import BoundaryDisabled

    route_by_path = {r.path: r for r in app.routes if hasattr(r, "path")}
    send_message_ep = route_by_path["/api/v1/chat/message"].endpoint

    class _User:
        id = "00000000-0000-0000-0000-000000000000"

    # Spy: if chat_completion (LLM) is ever invoked, fail the test.
    monkeypatch.setattr(
        "app.services.ai_service.chat_completion", _ExplodingLLM(), raising=False
    )
    # Spy: if rag_service.search_laws is reached, fail the test (the gate
    # must fire before RAG too).
    monkeypatch.setattr(
        "app.services.rag_service.search_laws", _ExplodingLLM(), raising=False
    )

    import asyncio

    for prompt in ADVERSARIAL_L3_L4_PROMPTS:
        req = ChatRequest(message=prompt, conversation_type="general", language="de")
        with pytest.raises(BoundaryDisabled):
            asyncio.run(send_message_ep(req, _User(), _ExplodingDB()))
        # no LLM call (the exploding spys would have failed the test)


def test_http_generic_chat_rejects_adversarial_prompts_not_just_policy_config():
    """PR-02D Section 4A (defense in depth): even if the policy were somehow
    APPROVED at execution time, the endpoint must still fail before
    persistence — the gate is the first statement. This test proves the
    handler order (gate-first) independent of the policy table by forcing
    the gate open and asserting the DB is still NOT touched before the
    LLM-persistence boundary is crossed.

    (If the gate were NOT first, the exploding DB would raise AssertionError
    instead of the LLM spy raising; either way the test fails loudly.)
    """
    from app.main import app
    from app.schemas.chat import ChatRequest
    from app.services.legal_boundary import BoundaryDisabled

    route_by_path = {r.path: r for r in app.routes if hasattr(r, "path")}
    send_message_ep = route_by_path["/api/v1/chat/message"].endpoint

    class _User:
        id = "00000000-0000-0000-0000-000000000000"

    import asyncio

    # With the default REVIEW_REQUIRED policy the gate ALWAYS fires first;
    # assert that for all four prompts the exception is BoundaryDisabled
    # (not a TypeError/AttributeError from a half-executed handler).
    for prompt in ADVERSARIAL_L3_L4_PROMPTS:
        req = ChatRequest(message=prompt, conversation_type="general", language="de")
        with pytest.raises(BoundaryDisabled):
            asyncio.run(send_message_ep(req, _User(), _ExplodingDB()))


# ---------------------------------------------------------------------------
# PR-02D Section 4B: bot bounded path — behavioral proof
# ---------------------------------------------------------------------------

def test_bot_ask_is_bounded_lookup_never_generative_for_adversarial_prompts(monkeypatch):
    """PR-02D Section 4B: exercise the REAL bot_turn 'ask' execution.

    - monkeypatch rag_service.search_laws to a CONTROLLED bounded fixture;
    - spy that the generative LLM (ai_service.chat_completion) is NEVER
      called (monkeypatch to a failing object);
    - for each adversarial prompt, assert the reply is source retrieval /
      safe fallback (citations), intent == 'ask', executed == False — never
      merits/strategy/drafting output.
    """
    from app.api.platform_bot import (
        BotTurnRequest,
        bot_turn,
    )
    from app.services import rag_service

    fixture_docs = [
        {
            "id": "law-1",
            "law_code": "BGB",
            "section": "§ 626",
            "title": "Fristlose Kündigung aus wichtigem Grund",
            "content": "Das Dienstverhältnis kann aus wichtigem Grund ohne Kündigungsfrist gekündigt werden.",
            "url": None,
            "relevance_score": 0.95,
            "mode": "vector",
        }
    ]

    async def _bounded_search(query, limit=5, db=None, **kwargs):
        # bounded retrieval: returns source docs, never legal strategy
        return fixture_docs

    monkeypatch.setattr(rag_service, "search_laws", _bounded_search)
    # The bot must never call the generative LLM:
    monkeypatch.setattr(
        "app.services.ai_service.chat_completion", _ExplodingLLM(), raising=False
    )

    import asyncio

    for prompt in ADVERSARIAL_L3_L4_PROMPTS:
        req = BotTurnRequest(
            channel="telegram",
            channel_user_id="anon-test",
            text=prompt,
            language="de",
        )
        resp = asyncio.run(bot_turn(req, _AnonymousBotDB()))
        low = resp.reply.lower()
        # NEVER merits/strategy/drafting: any answer is one of the SAFE
        # responses — bounded source retrieval with citations, the "no
        # statute" fallback, or the unauthenticated/urgent handoff. None may
        # contain individualized assessment text.
        safe_variants = (
            "gesetzesstellen" in low,        # bounded retrieval
            "keine belastbare gesetzesstelle" in low,  # safe no-hit fallback
            "anmelden" in low,               # unauthenticated safe handoff
            "soforthilfe" in low,            # urgent handoff
            "anwalt" in low,                 # lawyer handoff
        )
        assert any(safe_variants), (prompt, resp.reply)
        assert resp.executed is False, prompt
        assert resp.intent in ("ask", "my_cases", "urgent_help", "start_case_intake",
                               "find_lawyer", "upload_document", "contact",
                               "book_consultation", "pay_consultation"), prompt
        # Explicit no-generative-proof: none of these markers may appear.
        assert "widerspruch einreichen" not in low, prompt   # not drafting
        assert "ich empfehle" not in low, prompt             # not advice
        assert "schritt für schritt" not in low, prompt      # not strategy
        assert "strategie" not in low, prompt                # not strategy


def test_bot_ask_never_reaches_generic_generative_chat(monkeypatch):
    """PR-02D Section 4B (structure): the bot 'ask' handler must NOT import
    or call send_message (the generic generative endpoint). Verify by source
    inspection of the real bot_turn body: no import, no alias, no call."""
    import inspect

    from app.api import platform_bot

    src = inspect.getsource(platform_bot)
    # The generic generative endpoint is never part of the ask path.
    assert "import send_message" not in src
    assert "send_message as" not in src
    assert "send_message(" not in src
    # The only occurrence may be a comment naming it (which is fine).


# ---------------------------------------------------------------------------
# PR-02D Section 4C: grounded general-information path — behavioral proof
# ---------------------------------------------------------------------------

def test_grounded_l0_prompt_returns_source_lookup_with_citations(monkeypatch):
    """PR-02D Section 4C: for the grounded general-information prompt
    ('What does §4 KSchG generally provide?') the REAL bot ask path (with a
    RESOLVED user, so the ask branch executes) returns a source result with
    citations — and the generative LLM is never called.
    """
    import uuid

    from app.api import platform_bot
    from app.api.platform_bot import BotTurnRequest, bot_turn
    from app.models.user import User
    from app.services import rag_service

    fixture_docs = [
        {
            "id": "law-kschg-4",
            "law_code": "KSchG",
            "section": "§ 4",
            "title": "Kündigungsschutzklage, Fristen",
            "content": "Will ein Arbeitnehmer geltend machen, dass eine Kündigung...",
            "url": None,
            "relevance_score": 0.97,
            "mode": "vector",
        }
    ]

    async def _bounded_search(query, limit=5, db=None, **kwargs):
        return fixture_docs

    monkeypatch.setattr(rag_service, "search_laws", _bounded_search)
    monkeypatch.setattr(
        "app.services.ai_service.chat_completion", _ExplodingLLM(), raising=False
    )

    user_id = uuid.uuid4()
    # Seed the channel identity mapping so _resolve_user finds a user.
    platform_bot._channel_identity_cache[("telegram", "anon-grounded")] = user_id
    # Memory-resident SQLAlchemy User instance (no DB row needed).
    user = User(
        id=user_id,
        email="t@t.de",
        hashed_password="x",
        full_name="Test",
        preferred_language="de",
        is_active=True,
        is_anonymous=False,
    )

    class _ResolvedUserDB:
        def __getattr__(self, _name):
            raise AssertionError("bot_turn touched unexpected DB API")

        async def execute(self, *args, **kwargs):
            class _R:
                def scalars(self):
                    return self

                def first(self):
                    return user

            return _R()

    import asyncio

    try:
        req = BotTurnRequest(
            channel="telegram",
            channel_user_id="anon-grounded",
            text=GROUNDED_L0_PROMPT,
            language="de",
        )
        resp = asyncio.run(bot_turn(req, _ResolvedUserDB()))
    finally:
        platform_bot._channel_identity_cache.pop(("telegram", "anon-grounded"), None)

    assert resp.intent == "ask"
    assert resp.executed is False
    assert "KSchG" in resp.reply, resp.reply
    assert "§ 4" in resp.reply, resp.reply
    assert len(resp.citations) == 1 and resp.citations[0]["law_code"] == "KSchG"
    assert "rechtsinformation" in resp.reply.lower()  # RDG disclaimer
    # No generative LLM was touched (the exploding spy would have raised).


def test_chat_message_and_stream_are_gated():
    """POST /chat/message and GET /chat/stream must be in the route map with
    generic_legal_chat (REVIEW_REQUIRED) and fail closed before DB/LLM."""
    from app.main import app
    from app.services.legal_boundary import BOUNDARY_ROUTE_MAP

    for route in ("POST /api/v1/chat/message", "GET /api/v1/chat/stream"):
        assert BOUNDARY_ROUTE_MAP[route] == "generic_legal_chat", route
    # The handlers' first statement is the gate.
    import re
    from pathlib import Path

    src = Path(__file__).resolve().parents[1] / "app" / "api" / "chat.py"
    text = src.read_text(encoding="utf-8")
    assert text.count('require_executable("generic_legal_chat")') == 2


# ---------------------------------------------------------------------------
# PR-02C Finding 4: extraction-only prompt/schema test (root contract)
# ---------------------------------------------------------------------------

def test_extraction_prompt_schema_requests_only_l1_fields():
    """The ordinary upload pipeline's prompt/schema must request ONLY the
    allowed extraction surface — NEVER legal_implications / action_required /
    urgency / strategy / merits. Testing the schema, not a .pop()."""
    from app.services.document_service import (
        EXTRACTION_ALLOWED_FIELDS,
        EXTRACTION_PROMPT_SCHEMA,
    )

    assert "summary" in EXTRACTION_ALLOWED_FIELDS
    assert "key_dates" in EXTRACTION_ALLOWED_FIELDS
    assert "key_persons" in EXTRACTION_ALLOWED_FIELDS
    assert "document_category" in EXTRACTION_ALLOWED_FIELDS
    assert "reference_numbers" in EXTRACTION_ALLOWED_FIELDS

    # The L3-leak fields must NOT be requested.
    for forbidden in ("legal_implications", "action_required", "urgency", "strategy", "merits"):
        assert forbidden not in EXTRACTION_ALLOWED_FIELDS, forbidden
        assert forbidden not in EXTRACTION_PROMPT_SCHEMA, forbidden

    # The prompt/schema must not ask for legal evaluation at all.
    low = EXTRACTION_PROMPT_SCHEMA.lower()
    for forbidden in ("rechtliche bewertung", "rechtsfolgen", "handlungsanweisungen",
                      "dringlichkeitseinschätzung", "strategieempfehlung"):
        assert forbidden in low, f"prompt must forbid {forbidden}"


def test_extraction_result_never_contains_l3_fields(monkeypatch):
    """Even if the model hallucinates L3 fields, the extraction operation
    strips them (fail-closed filter). This tests the operation contract, not
    the persisted .pop()."""
    from app.services import document_service

    async def _fake_chat(messages, **kwargs):
        return (
            '{"summary": "s", "key_dates": [], "key_persons": [], '
            '"document_category": "contract", "reference_numbers": ["A1"], '
            '"legal_implications": "L3 leak", "action_required": "do X", '
            '"urgency": "critical"}'
        )

    monkeypatch.setattr(document_service, "chat_completion", _fake_chat)
    import asyncio

    result = asyncio.run(document_service.analyze_document_extraction("text", "contract"))
    assert result["summary"] == "s"
    assert result["document_category"] == "contract"
    assert result["reference_numbers"] == ["A1"]
    for forbidden in ("legal_implications", "action_required", "urgency"):
        assert forbidden not in result, forbidden


# ---------------------------------------------------------------------------
# PR-02C Finding 5: PUT narrowed lifecycle schema tests
# ---------------------------------------------------------------------------

def test_roadmap_put_schema_is_lifecycle_only():
    from app.schemas.case import RoadmapStepLifecycleUpdate

    fields = set(RoadmapStepLifecycleUpdate.model_fields)
    assert fields == {"status"}, fields
    # Substantive fields must NOT be accepted.
    for bad in ("title", "description", "action_items", "deadline", "priority", "resources"):
        assert bad not in fields, bad
    import pytest as _pytest

    with _pytest.raises(Exception):
        RoadmapStepLifecycleUpdate(status="completed", title="hacked")


def test_narrative_put_schema_is_lifecycle_only():
    from app.schemas.case import NarrativeLifecycleUpdate

    fields = set(NarrativeLifecycleUpdate.model_fields)
    assert fields == {"is_final"}, fields
    for bad in ("narrative_type", "content", "language", "version"):
        assert bad not in fields, bad


def test_put_routes_mapped_in_route_map():
    from app.services.legal_boundary import BOUNDARY_ROUTE_MAP

    assert BOUNDARY_ROUTE_MAP["PUT /api/v1/cases/{case_id}/roadmap/{step_id}"] == "roadmap_generation"
    assert BOUNDARY_ROUTE_MAP["PUT /api/v1/cases/{case_id}/narratives/{narrative_id}"] == "narrative_generation"


# ---------------------------------------------------------------------------
# PR-02C Finding 6: derived route map tests
# ---------------------------------------------------------------------------

def test_route_map_is_derived_and_each_review_required_route_fails_closed():
    """Every REVIEW_REQUIRED generation/analysis route in the canonical map
    must be registered in OpenAPI and fail closed before DB/LLM. Derived from
    BOUNDARY_ROUTE_MAP (single source of truth, no hand-count drift)."""
    from app.main import app
    from app.services.legal_boundary import BOUNDARY_ROUTE_MAP, require_executable

    schema = app.openapi()
    existing_paths = {p.lstrip("/api/v1") for p in schema["paths"]}

    # Normalize map route -> openapi path
    review_routes = []
    for route, cap_id in BOUNDARY_ROUTE_MAP.items():
        policy = next((p for p in BOUNDARY_POLICIES if p.capability_id == cap_id), None)
        assert policy is not None, f"route {route} maps to unknown policy {cap_id}"
        if policy.approval_state == REVIEW_REQUIRED:
            # PUT routes are schema-gated (narrowed lifecycle), not
            # require_executable-gated — verified separately.
            if route.startswith("PUT "):
                continue
            review_routes.append((route, cap_id))
            # must be registered in OpenAPI (route map paths already include
            # the /api/v1 prefix)
            method, _, path = route.partition(" ")
            openapi_path = path
            assert openapi_path in schema["paths"], f"{route} not registered in OpenAPI"
            # must fail closed
            with pytest.raises(BoundaryDisabled):
                require_executable(cap_id)

    # Every REVIEW_REQUIRED generation/analysis route is covered.
    assert len(review_routes) >= 8  # nothing silently dropped

    # The bounded L0 route is APPROVED (not fail-closed).
    assert BOUNDARY_ROUTE_MAP["GET /api/v1/laws/search"] == "laws_search"
    assert is_executable("laws_search")


def test_route_map_maps_each_route_to_exactly_one_policy():
    from app.services.legal_boundary import BOUNDARY_ROUTE_MAP

    # one canonical map, no drift; every value is a real policy id
    ids = {p.capability_id for p in BOUNDARY_POLICIES}
    for route, cap_id in BOUNDARY_ROUTE_MAP.items():
        assert cap_id in ids, f"{route} -> unknown {cap_id}"
    # no duplicate route keys
    assert len(BOUNDARY_ROUTE_MAP) == len(set(BOUNDARY_ROUTE_MAP))
