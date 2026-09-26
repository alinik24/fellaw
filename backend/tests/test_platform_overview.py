"""Overview read model: pure builder/formatter tests + HTTP auth boundary tests."""
from __future__ import annotations

from datetime import datetime

import pytest

from app.services.platform_overview import (
    CaseSummary,
    build_overview,
    format_overview_text,
)


def _cases():
    return [
        CaseSummary("1", "Kündigung anfechten", "employment", "active", "critical", "2026-09-20"),
        CaseSummary("2", "Mieterhöhung", "housing", "pending", "medium", None),
        CaseSummary("3", "Bußgeld", "traffic", "closed", "high", None),
    ]


def test_build_overview_counts_and_scoping():
    ov = build_overview(
        role="citizen",
        display_name="Alina",
        language="de",
        cases=_cases(),
        unread_notifications=2,
        open_referrals=1,
        conversations=4,
        now=datetime(2026, 9, 6, 12, 0, 0),
    )
    assert ov.counts == {
        "cases_total": 3,
        "cases_open": 2,
        "cases_urgent": 1,  # closed+high must NOT count
        "unread_notifications": 2,
        "open_referrals": 1,
        "conversations": 4,
    }
    assert [c.id for c in ov.urgent_cases] == ["1"]
    assert ov.deep_links["dashboard"] == "/user/dashboard"
    assert ov.deep_links["cases"] == "/user/dashboard"  # no /ongoing-cases after PR-01
    assert "my_cases" in ov.capabilities and "lawyer_dashboard" not in ov.capabilities
    assert ov.generated_at == "2026-09-06T12:00:00Z"


def test_lawyer_overview_deep_links_are_role_correct():
    ov = build_overview(
        role="lawyer", display_name="RA Muster", language="en", cases=[],
        unread_notifications=0, open_referrals=3, conversations=0,
    )
    # PR-01C: lawyers must NOT be sent to the citizen dashboard. Until an
    # honest lawyer surface exists, dashboard/cases deep-links resolve to "/"
    # (the entry surface); the removed `lawyer_dashboard` capability is not
    # advertised, so no surface can deep-link to it.
    assert ov.deep_links["dashboard"] == "/"
    assert ov.deep_links["cases"] == "/"
    assert ov.deep_links["new_case"] == "/new-case"
    assert "lawyer_dashboard" not in ov.capabilities


def test_citizen_and_admin_deep_links_point_to_state_backed_dashboard():
    for role in ("citizen", "admin"):
        ov = build_overview(
            role=role, display_name="A", language="en", cases=[],
            unread_notifications=0, open_referrals=0, conversations=0,
        )
        assert ov.deep_links["dashboard"] == "/user/dashboard"
        assert ov.deep_links["cases"] == "/user/dashboard"
        assert ov.deep_links["new_case"] == "/new-case"


def test_anonymous_deep_links_do_not_point_to_a_dashboard():
    # Anonymous users have no dashboard; deep-links resolve to "/" (entry).
    ov = build_overview(
        role="anonymous", display_name="Gast", language="en", cases=[],
        unread_notifications=0, open_referrals=0, conversations=0,
    )
    assert ov.deep_links["dashboard"] == "/"
    assert ov.deep_links["cases"] == "/"


@pytest.mark.parametrize("lang,needle", [("de", "keine Rechtsberatung"), ("en", "not legal advice")])
def test_text_rendering_is_channel_safe_and_has_disclaimer(lang, needle):
    ov = build_overview(
        role="citizen", display_name="A", language=lang, cases=_cases(),
        unread_notifications=0, open_referrals=0, conversations=0,
    )
    text = format_overview_text(ov)
    assert needle in text
    assert "Kündigung anfechten" in text
    assert "2026-09-20" in text
    assert "<" not in text and "*" not in text  # no markup that breaks Telegram/CLI


# ---------------------------------------------------------------------------
# U3: roadmap state is read-only truth derived from persisted steps
# ---------------------------------------------------------------------------


class _FakeStep:
    def __init__(self, step_number: int, title: str, status: str = "pending", deadline=None):
        self.step_number = step_number
        self.title = title
        self.status = status
        self.deadline = deadline


class _FakeCase:
    def __init__(self, steps):
        self.roadmap_steps = steps


def _roadmap_state_of(case):
    """Mirror of load_overview's _roadmap_state for pure-model testing."""
    steps = sorted((getattr(case, "roadmap_steps", None) or []), key=lambda s: s.step_number)
    if not steps:
        return False, None
    open_steps = [s for s in steps if s.status not in ("completed", "skipped")]
    return True, (open_steps[0].title if open_steps else None)


def test_roadmap_state_no_steps_is_explicit_not_generated():
    # No persisted steps -> never claim a roadmap; surface must show the
    # explicit not-generated state.
    assert _roadmap_state_of(_FakeCase([])) == (False, None)
    assert _roadmap_state_of(_FakeCase(None)) == (False, None)


def test_roadmap_state_picks_lowest_open_step():
    case = _FakeCase([
        _FakeStep(1, "Frist prüfen", status="completed"),
        _FakeStep(2, "Rechtsantragstelle aufsuchen"),
        _FakeStep(3, "Dokumente sammeln"),
    ])
    assert _roadmap_state_of(case) == (True, "Rechtsantragstelle aufsuchen")


def test_roadmap_state_all_completed_has_no_next_step():
    case = _FakeCase([_FakeStep(1, "Erledigt", status="completed")])
    generated, next_step = _roadmap_state_of(case)
    assert generated is True
    assert next_step is None  # "all steps completed" state, never a fabricated step


def test_case_summary_defaults_are_honest():
    # Default CaseSummary must not claim a roadmap when none was derived.
    cs = CaseSummary("1", "Fall", "housing", "active", "medium")
    assert cs.roadmap_generated is False
    assert cs.next_step_title is None


# ---------------------------------------------------------------------------
# HTTP boundary: no DB required for the 401 path
# ---------------------------------------------------------------------------


@pytest.fixture()
def client():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.api.platform import router
    from app.database import get_db

    app = FastAPI()
    app.include_router(router, prefix="/api/v1")

    class _NoDB:
        async def execute(self, *_a, **_k):  # pragma: no cover - should not be reached for 401
            raise AssertionError("DB must not be touched for unauthenticated overview")

    async def _fake_db():
        yield _NoDB()

    app.dependency_overrides[get_db] = _fake_db
    return TestClient(app)


def test_overview_requires_auth(client):
    assert client.get("/api/v1/platform/overview").status_code == 401
    assert client.get("/api/v1/platform/overview/text").status_code == 401


def test_capabilities_public_anonymous_without_db(client):
    r = client.get("/api/v1/platform/capabilities")
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "anonymous"
    ids = {c["id"] for c in body["capabilities"]}
    assert "urgent_help" in ids and "my_cases" not in ids
    assert "RDG" in body["disclaimer"]


def test_capabilities_with_garbage_token_is_anonymous(client):
    r = client.get("/api/v1/platform/capabilities", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 200
    assert r.json()["role"] == "anonymous"
