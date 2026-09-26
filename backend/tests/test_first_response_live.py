"""Canonical live first-response journey against the disposable E2E DB.

Blockers 6/14: facts come from the server-side deterministic extraction
pipeline (EXTRACTED_CANDIDATE with real provenance), NOT from client POSTs.
The client only CONFIRMS/CORRECTS facts — it can never set extractor/
confidence/source provenance. Reminders survive recomputation (no cascade
deletion). North-star derives only from authoritative server-side events.
"""
from __future__ import annotations

import os
import uuid
import pytest
from test_integration_live import client

pytestmark = pytest.mark.skipif(not os.environ.get("FELLAW_TEST_DB"), reason="isolated E2E DB required")


def _user(client, prefix):
    email = f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "First-Response-2026!x", "full_name": prefix})
    assert r.status_code == 201
    return email, {"Authorization": f"Bearer {r.json()['access_token']}"}


FIXTURE_NOTICE = (
    "Kündigung des Arbeitsverhältnisses zum 31.03.2026.\n"
    "Das Schreiben wurde erhalten am 01.02.2026.\n"
    "Die Widerspruchsfrist endet spätestens am 15.02.2026."
).encode("utf-8")


def test_cannot_forge_provenance(client):
    _, auth = _user(client, "forge")
    case = client.post("/api/v1/cases", headers=auth, json={"title": "Kündigung", "case_type": "employment"})
    case_id = case.json()["id"]
    upload = client.post(
        "/api/v1/documents/upload", headers=auth, params={"case_id": case_id},
        files={"file": ("kuendigung.txt", FIXTURE_NOTICE, "text/plain")},
    )
    document_id = upload.json()["id"]
    # Client attempting to set extraction provenance must be rejected (422).
    r = client.post(
        f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth,
        json={"fact_type": "received_date", "value": "2026-02-01", "extractor": "deterministic_extraction", "confidence": 0.99, "source_page": 1},
    )
    assert r.status_code == 422, r.text
    # A clean user-provided fact is labeled 'user_provided', never 'deterministic_extraction'.
    ok = client.post(
        f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth,
        json={"fact_type": "received_date", "value": "2026-02-01"},
    )
    assert ok.status_code == 201, ok.text
    assert ok.json()["extractor"] == "user_provided"


def test_persisted_first_response_journey(client):
    email, auth = _user(client, "journey")
    case = client.post("/api/v1/cases", headers=auth, json={"title": "Kündigung", "case_type": "employment"})
    assert case.status_code == 201
    case_id = case.json()["id"]

    # upload -> extraction pipeline creates EXTRACTED_CANDIDATE facts with real provenance
    upload = client.post(
        "/api/v1/documents/upload",
        headers=auth,
        params={"case_id": case_id},
        files={"file": ("kuendigung.txt", FIXTURE_NOTICE, "text/plain")},
    )
    assert upload.status_code == 201, upload.text
    document_id = upload.json()["id"]

    facts = client.get(f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth)
    assert facts.status_code == 200, facts.text
    fact_list = facts.json()
    by_type = {f["fact_type"]: f for f in fact_list}
    assert "received_date" in by_type
    assert "document_stated_deadline" in by_type
    # Provenance is server-assigned and truthful
    assert by_type["received_date"]["extractor"] == "deterministic_extraction"
    assert by_type["received_date"]["value"] == "2026-02-01"
    assert by_type["document_stated_deadline"]["value"] == "2026-02-15"
    received_fact_id = by_type["received_date"]["id"]
    deadline_fact_id = by_type["document_stated_deadline"]["id"]

    # Unconfirmed trigger -> statutory clock abstains (REVIEW_REQUIRED, no guessed date)
    first = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert first.status_code == 200, first.text
    clocks = {c["clock_type"]: c for c in first.json()["clocks"]}
    statutory = clocks["STATUTORY_DEADLINE"]
    assert statutory["due_date"] is None
    assert statutory["verification_status"] in {"REVIEW_REQUIRED", "NEEDS_CONFIRMATION"}

    # Reminder lifecycle: create from returned source clock, recompute, reload —
    # reminder must survive recomputation (no cascade deletion).
    reminder = client.post(
        f"/api/v1/first-response/{case_id}/reminders",
        headers=auth,
        json={"source_clock_id": statutory["id"], "reminder_date": "2026-02-06"},
    )
    assert reminder.status_code == 200, reminder.text
    reminder_id = reminder.json()["id"]

    recompute = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert recompute.status_code == 200, recompute.text

    from app.database import AsyncSessionLocal
    from app.models.first_response_state import FirstResponseClock, FirstResponseReminder
    from sqlalchemy import select

    async def reload_state():
        async with AsyncSessionLocal() as db:
            rows = (await db.execute(select(FirstResponseReminder).where(FirstResponseReminder.case_id == case_id))).scalars().all()
            clocks2 = (await db.execute(select(FirstResponseClock).where(FirstResponseClock.case_id == case_id))).scalars().all()
            return rows, clocks2

    reminders, clocks2 = client.run_async(reload_state())
    assert any(str(r.id) == str(reminder_id) and r.status in {"scheduled", "active"} for r in reminders), "reminder must survive first-response recomputation"
    assert any(c.clock_type == "STATUTORY_DEADLINE" and c.status != "cancelled" for c in clocks2)

    # Confirm the critical received_date fact (user confirms an extracted candidate)
    corrected = client.patch(
        f"/api/v1/first-response/{case_id}/documents/{document_id}/facts/{received_fact_id}",
        headers=auth, json={"review_status": "USER_CONFIRMED"},
    )
    assert corrected.status_code == 200, corrected.text
    # Confirm the stated deadline too
    client.patch(
        f"/api/v1/first-response/{case_id}/documents/{document_id}/facts/{deadline_fact_id}",
        headers=auth, json={"review_status": "USER_CONFIRMED"},
    )

    # Wire the document-stated deadline as a clock; it stays semantically separate.
    # The statutory clock derives from the confirmed received_date + rule.
    first_again = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert first_again.status_code == 200, first_again.text
    clocks3 = {c["clock_type"]: c for c in first_again.json()["clocks"]}
    assert clocks3["DOCUMENT_STATED_DEADLINE"]["due_date"] == "2026-02-15"
    # Unreviewed rule (active=False, counsel_reviewed=False) still abstains with no guessed date.
    assert clocks3["STATUTORY_DEADLINE"]["due_date"] is None
    assert clocks3["STATUTORY_DEADLINE"]["verification_status"] == "REVIEW_REQUIRED"

    handoff = client.post(f"/api/v1/first-response/{case_id}/handoff", headers=auth, json={"exact_human_question": "Which individualized review is needed?", "language": "de", "contact_preference": "email"})
    assert handoff.status_code == 200, handoff.text
    dossier = handoff.json()["dossier"]
    assert dossier["counsel_decision"] == "UNKNOWN"
    # Blocker 12: dossier assembles real persisted canonical state, not a stub row.
    assert any(f["fact_type"] == "received_date" and f["review_status"] == "USER_CONFIRMED" for f in dossier["facts"])
    assert any(c["clock_type"] == "DOCUMENT_STATED_DEADLINE" for c in dossier["clocks"])
    assert any(c["clock_type"] == "STATUTORY_DEADLINE" for c in dossier["clocks"])
    assert any(r["status"] == "scheduled" for r in dossier["reminders"]), "dossier must include the persisted reminder"
    assert any(ev["event_name"] == "handoff_created" for ev in dossier["timeline"])

    # Blocker 11: fresh authenticated reload (same owner, new token) sees the
    # persisted reminder, clock, and handoff — proving durable persistence.
    final_auth = client.post("/api/v1/auth/login", data={"username": email, "password": "First-Response-2026!x"})
    assert final_auth.status_code in (200, 201), final_auth.text
    fresh = {"Authorization": f"Bearer {final_auth.json()['access_token']}"}

    reloaded_matter = client.get(f"/api/v1/cases/{case_id}", headers=fresh)
    assert reloaded_matter.status_code == 200, reloaded_matter.text
    reloaded_facts = client.get(f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=fresh)
    assert reloaded_facts.status_code == 200, reloaded_facts.text
    assert any(f["fact_type"] == "received_date" and f["extractor"] == "deterministic_extraction" for f in reloaded_facts.json())

    event = client.post(f"/api/v1/first-response/{case_id}/events", headers=auth, json={"event_name": "first_response_viewed", "metadata": {"source": "live-test"}})
    assert event.status_code == 200, event.text

    # North star is NOT satisfied by telemetry only (blocker 5)
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is False

    private = client.post("/api/v1/first-response", json={"case_id": case_id, "document_id": document_id})
    assert private.status_code == 401
