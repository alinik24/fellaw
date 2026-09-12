"""Tests for FelLaw's canonical six-capability public registry."""
from __future__ import annotations
import pytest
from app.services.platform_capabilities import CAPABILITIES, Capability, capabilities_for_role, capability_by_id, registry_summary

PUBLIC_IDS = {"submit_notice", "upload_document", "first_response", "my_matters", "deadline_reminders", "human_handoff"}

def test_registry_is_exactly_the_six_public_capabilities():
    ids = {c.id for c in CAPABILITIES}
    assert ids == PUBLIC_IDS
    assert len(ids) == len(CAPABILITIES)

def test_every_capability_is_fully_described():
    for cap in CAPABILITIES:
        assert isinstance(cap, Capability)
        assert cap.status == "implemented"
        assert cap.roles and cap.web_route.startswith("/") and cap.bot_intent and cap.owner
        assert cap.api_path and cap.api_path.startswith("/api/v1/")
        if cap.kind == "mutation":
            assert cap.requires_confirmation is True

def test_anonymous_sees_only_submit_notice():
    assert {c.id for c in capabilities_for_role("anonymous")} == {"submit_notice"}

def test_citizen_gets_only_first_response_capabilities():
    assert {c.id for c in capabilities_for_role("citizen")} == PUBLIC_IDS

def test_unknown_role_is_rejected():
    with pytest.raises(ValueError):
        capabilities_for_role("superuser")

def test_legacy_capability_ids_are_not_public_or_resolvable():
    for legacy in ("urgent_help", "start_case_intake", "my_cases", "laws_search", "notifications", "chat_legal_question"):
        assert capability_by_id(legacy) is None

def test_summary_counts_add_up():
    summary = registry_summary()
    assert summary == {"total": 6, "by_status": {"implemented": 6}}
