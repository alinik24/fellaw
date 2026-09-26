"""Tests for the shared web/bot capability registry (pure, no DB)."""
from __future__ import annotations

import pytest

from app.services.platform_capabilities import (
    CAPABILITIES,
    Capability,
    capabilities_for_role,
    capability_by_id,
    registry_summary,
)

VALID_STATUS = {"implemented", "partial", "planned", "missing", "removed"}
VALID_ROLES = {"anonymous", "citizen", "lawyer", "admin"}


def test_registry_is_non_empty_and_unique():
    ids = [c.id for c in CAPABILITIES]
    assert len(ids) >= 15
    assert len(ids) == len(set(ids)), "capability ids must be unique"


def test_every_capability_is_fully_described():
    for cap in CAPABILITIES:
        assert isinstance(cap, Capability)
        assert cap.status in VALID_STATUS, cap.id
        assert cap.roles and set(cap.roles) <= VALID_ROLES, cap.id
        assert cap.web_route.startswith("/"), cap.id
        assert cap.bot_intent, cap.id
        assert cap.owner, cap.id
        # mutations must be explicit about confirmation
        if cap.kind == "mutation":
            assert cap.requires_confirmation is True, cap.id
        # implemented claims need a verifiable API path
        if cap.status == "implemented" and cap.kind != "navigation":
            assert cap.api_path and cap.api_path.startswith("/api/v1/"), cap.id


def test_anonymous_sees_only_public_capabilities():
    caps = capabilities_for_role("anonymous")
    assert caps, "anonymous must still see public entry points"
    for cap in caps:
        assert "anonymous" in cap.roles
    ids = {c.id for c in caps}
    assert "urgent_help" in ids
    assert "my_cases" not in ids


def test_citizen_gets_case_capabilities_but_not_lawyer_dashboard():
    ids = {c.id for c in capabilities_for_role("citizen")}
    assert {"my_cases", "laws_search", "upload_document"} <= ids
    assert "lawyer_dashboard" not in ids
    # RIG-PR02C-06: the old public capability id is gone (canonical id is
    # laws_search); no capability may pair a stale id with the bounded path.
    assert "chat_legal_question" not in ids


def test_fabricated_frozen_capabilities_are_removed_not_advertised():
    # PR-01: case_assessment, self_service, law_firms, insurance, lawyer_dashboard,
    # verify_lawyer were fabricated or frozen and must NOT be advertised as available.
    for cap in CAPABILITIES:
        if cap.id in {"case_assessment", "self_service", "law_firms", "insurance_check", "lawyer_dashboard", "verify_lawyer", "mediation", "careers", "lawyer_onboarding"}:
            assert cap.status == "removed", cap.id
            # removed capabilities must not deep-link to a fabricated page
            assert cap.web_route not in {"/case-assessment/:caseId", "/self-service", "/law-firms",
                                         "/insurance", "/lawyer/dashboard", "/dashboard",
                                         "/graybeard-mediation", "/work-with-us/careers",
                                         "/work-with-us/professionals"}
            assert cap.web_route in {"/", "/user/dashboard"}, cap.id


def test_removed_capabilities_are_not_advertised_to_any_role():
    # PR-01: `capabilities_for_role` must not return removed capabilities.
    for role in ("anonymous", "citizen", "lawyer", "admin"):
        ids = {c.id for c in capabilities_for_role(role)}
        for removed in {"case_assessment", "self_service", "law_firms", "insurance_check",
                        "lawyer_dashboard", "verify_lawyer", "mediation", "careers", "lawyer_onboarding"}:
            assert removed not in ids, f"{removed} should not be advertised to {role}"


def test_lawyer_no_longer_gets_advertised_dashboard():
    ids = {c.id for c in capabilities_for_role("lawyer")}
    assert "lawyer_dashboard" not in ids  # removed; bot answers via intent table only


def test_unknown_role_is_rejected():
    with pytest.raises(ValueError):
        capabilities_for_role("superuser")


def test_capability_lookup():
    cap = capability_by_id("laws_search")
    # RIG-PR02C-06: canonical id is laws_search (registry == boundary);
    # it points at the bounded source-lookup A-path; generative chat is
    # gated separately.
    assert cap.api_path == "/api/v1/laws/search"
    # The old id no longer exists as a registry capability.
    assert capability_by_id("chat_legal_question") is None
    assert capability_by_id("does-not-exist") is None


def test_payment_and_bot_mutations_are_not_claimed_implemented():
    # Honest gap accounting: no payments, no bot-executed mutations yet.
    for cap in CAPABILITIES:
        if cap.id in {"pay_consultation", "book_consultation"}:
            assert cap.status in {"planned", "missing"}, cap.id


def test_summary_counts_add_up():
    summary = registry_summary()
    assert sum(summary["by_status"].values()) == summary["total"] == len(CAPABILITIES)
