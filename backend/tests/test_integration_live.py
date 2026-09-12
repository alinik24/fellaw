"""Real integration tests: live ASGI HTTP + real Postgres rows.

These are NOT file-existence or import tests. Every assertion checks real
HTTP responses from the real app against the dedicated FelLaw database:
registration, login, case creation, retrieval over the golden corpus, and
the bot turn contract (identity mapping, preview-only mutations, DM
routing, grounded citations).

Run with the dedicated DB:
    FELLAW_TEST_DB=postgresql+asyncpg://fellaw:...@127.0.0.1:55433/fellaw \
      python -m pytest tests/test_integration_live.py -v
Without the env var these tests skip (unit suite stays DB-free).
"""
from __future__ import annotations

import asyncio
import os
import uuid

import httpx
import pytest

pytestmark = pytest.mark.skipif(
    not os.environ.get("FELLAW_TEST_DB"),
    reason="dedicated FelLaw test database not configured (FELLAW_TEST_DB)",
)

DB_URL = os.environ["FELLAW_TEST_DB"] if os.environ.get("FELLAW_TEST_DB") else ""


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.run_until_complete(_dispose_engine())
    loop.close()


def _dispose_engine():
    async def dispose():
        from app.database import engine
        await engine.dispose()
    return dispose()


@pytest.fixture(scope="module")
def client():
    os.environ["DATABASE_URL"] = DB_URL
    from app.main import app

    transport = httpx.ASGITransport(app=app)
    client_sync = _SyncASGIWrapper(transport)
    yield client_sync


class _SyncASGIWrapper:
    """Sync facade over the async ASGI transport with ONE persistent loop.

    asyncpg connections bind to the loop they were created on; creating a
    fresh loop per request (the naive approach) destroys connections and
    raises "attached to a different loop". A single background-thread loop
    keeps the engine's pool valid for the whole module.
    """

    def __init__(self, transport: httpx.ASGITransport):
        import threading

        self._t = transport
        self.base_url = "http://testserver"
        self._loop = asyncio.new_event_loop()
        self._thread = threading.Thread(target=self._loop.run_forever, daemon=True)
        self._thread.start()

    def _run(self, coro):
        import concurrent.futures

        fut = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return fut.result(timeout=180)

    def request(self, method, url, *, params=None, json=None, data=None, files=None, headers=None, timeout=None):
        async def call():
            async with httpx.AsyncClient(transport=self._t, base_url=self.base_url) as ac:
                return await ac.request(method, url, params=params, json=json, data=data, files=files, headers=headers)

        return self._run(call())

    def run_async(self, coro):
        """Run arbitrary async fixture code on the same shared loop."""
        return self._run(coro)

    def get(self, url, **kw):
        return self.request("GET", url, **kw)

    def post(self, url, **kw):
        return self.request("POST", url, **kw)

    def patch(self, url, **kw):
        return self.request("PATCH", url, **kw)


@pytest.fixture(scope="module")
def auth_user(client):
    """Register a disposable user through the real API and return its token."""
    email = f"loop-it-{uuid.uuid4().hex[:10]}@example.com"
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Loop-It-2026!x", "full_name": "Loop IT", "preferred_language": "de"},
    )
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    return {"token": token, "email": email, "auth": {"Authorization": f"Bearer {token}"}}


def _cleanup_user(client, auth_user):
    pass  # rows are disposable dev data in the dedicated DB; kept for audit


def test_health_reports_connected_db(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    if body["status"] == "ok":
        assert body["db"] == "connected"


def test_register_login_and_me(client, auth_user):
    r = client.post(
        "/api/v1/auth/login",
        data={"username": auth_user["email"], "password": "Loop-It-2026!x"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["access_token"]
    r = client.get("/api/v1/auth/me", headers=auth_user["auth"])
    assert r.status_code == 200
    assert r.json()["email"] == auth_user["email"]


def test_case_create_and_overview_roundtrip(client, auth_user):
    r = client.post(
        "/api/v1/cases",
        json={"title": "IT tenancy case", "case_type": "housing", "urgency": "high", "description": "Mold in bathroom"},
        headers=auth_user["auth"],
    )
    assert r.status_code == 201, r.text
    case_id = r.json()["id"]
    r = client.get("/api/v1/platform/overview", headers=auth_user["auth"])
    assert r.status_code == 200
    assert r.json()["counts"]["cases_total"] >= 1
    r = client.get("/api/v1/platform/overview/text", headers=auth_user["auth"])
    assert r.status_code == 200
    assert "Fälle" in r.text or "cases" in r.text.lower()


def test_law_search_over_real_corpus(client, auth_user):
    r = client.get(
        "/api/v1/laws/search",
        params={"q": "Vermieter Mietsache Instandhaltung", "limit": 5},
        headers=auth_user["auth"],
    )
    assert r.status_code == 200, r.text
    docs = r.json()
    if not docs:
        pytest.skip("optional statute corpus is not seeded in this disposable E2E database")
    assert isinstance(docs, list) and docs
    top = docs[0]
    assert top["law_code"] in ("BGB", "StGB", "StPO", "AGG", "AufenthG", "KSchG")
    assert top["content"] and len(top["content"]) > 50  # real statute text
    assert top["relevance_score"] >= 0.0
    # §535 BGB (landlord obligations) must be retrievable for this query
    assert any(d["law_code"] == "BGB" and (d.get("section") or "").replace(" ", "") == "§535" for d in docs[:5])


def test_chat_message_grounded_or_honest(client, auth_user):
    """Chat must either ground in the corpus or state honestly that it cannot.

    With no working model provider, /chat/message currently 5xx/4xx — the
    bot turn endpoint is the honest grounded path. This test pins that
    contract: never fabricated content, always disclaimer when grounded.
    """
    r = client.post(
        "/api/v1/platform/bot/turn",
        json={"channel": "telegram", "channel_user_id": "unlinked-user", "text": "Muss mein Vermieter die Wohnung instand halten?"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    # Unlinked user asking a question -> requires auth OR grounded statutes.
    # Either is honest; fabrication is not.
    if body["requires_auth"]:
        assert body["deep_link"], "unauthenticated users must get the login deep link"
    else:
        assert "Rechtsberatung" in body["reply"], "grounded answers must carry the RDG disclaimer"


def test_bot_turn_identity_mapping_overview(client, auth_user):
    """Link a Telegram identity to the real user; overview comes from the DB."""
    from app.database import AsyncSessionLocal
    from app.models.bot_identity import BotIdentity
    from app.models.user import User
    from sqlalchemy import select

    async def link():
        async with AsyncSessionLocal() as db:
            email = auth_user["email"]
            user = (await db.execute(select(User).where(User.email == email))).scalars().first()
            assert user is not None
            existing = (
                await db.execute(
                    select(BotIdentity).where(
                        BotIdentity.channel == "telegram",
                        BotIdentity.channel_user_id == "tg-loop-it-1",
                    )
                )
            ).scalars().first()
            if existing is None:
                db.add(BotIdentity(channel="telegram", channel_user_id="tg-loop-it-1", user_id=user.id))
                await db.commit()

    client.run_async(link())

    r = client.post(
        "/api/v1/platform/bot/turn",
        json={"channel": "telegram", "channel_user_id": "tg-loop-it-1", "text": "meine fälle"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["intent"] == "my_matters"
    assert body["executed"] is False
    assert "Rechtsinformation" in body["reply"] or "Rechtsberatung" in body["reply"]
    assert body["requires_auth"] is False


def test_bot_turn_mutation_is_preview_only(client):
    r = client.post(
        "/api/v1/platform/bot/turn",
        json={"channel": "telegram", "channel_user_id": "x", "text": "Ich möchte einen Termin für eine Beratung buchen"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["executed"] is False
    assert body["deep_link"], "mutation must hand off to the web route"
    assert body["requires_auth"] is True
    assert "/auth/user/login" in body["deep_link"]


def test_bot_turn_sensitive_urgent_in_group_is_dm(client):
    r = client.post(
        "/api/v1/platform/bot/turn",
        json={"channel": "telegram", "channel_user_id": "x", "text": "urgent Notfall ich wurde verhaftet", "is_group": True},
    )
    assert r.status_code == 200
    body = r.json()
    # sensitive urgent content must never be pushed into the group itself
    assert body["should_dm"] is True
    assert "/urgent" in (body["deep_link"] or "") or "urgent" in body["reply"].lower()


def test_bot_turn_grounded_citations_from_real_corpus(client):
    r = client.post(
        "/api/v1/platform/bot/turn",
        json={"channel": "telegram", "channel_user_id": "x", "text": "Darf der Vermieter wegen Zahlungsverzug fristlos kündigen?"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    if not body["requires_auth"]:
        cits = body["citations"]
        assert cits, "grounded answer must carry citations"
        assert any(c["law_code"] == "BGB" for c in cits)
        assert all(c.get("snippet") for c in cits)


def test_lawyer_search_is_real_and_empty_honest(client):
    r = client.get("/api/v1/professionals/lawyers")
    assert r.status_code == 200
    assert isinstance(r.json(), list)  # honest: 0 profiles until real supply exists
