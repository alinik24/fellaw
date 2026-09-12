"""Live cross-user ownership + north-star authenticity (blockers 5/14)."""
from __future__ import annotations

import os
import uuid
import pytest
from test_integration_live import client

pytestmark = pytest.mark.skipif(not os.environ.get("FELLAW_TEST_DB"), reason="isolated E2E DB required")


def _user(client, prefix: str):
    email = f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "First-Response-2026!x", "full_name": prefix})
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _matter_with_document(client, auth, title="Private"):
    case = client.post("/api/v1/cases", headers=auth, json={"title": title, "case_type": "employment"})
    assert case.status_code == 201
    case_id = case.json()["id"]
    upload = client.post(
        "/api/v1/documents/upload",
        headers=auth,
        params={"case_id": case_id},
        files={"file": ("kündigung.txt", "Kündigung des Arbeitsverhältnisses zum 31.03.2026".encode("utf-8"), "text/plain")},
    )
    assert upload.status_code == 201, upload.text
    return case_id, upload.json()["id"]


def test_cross_user_ownership_and_event_allowlist(client):
    auth_a = _user(client, "owner-a")
    auth_b = _user(client, "owner-b")
    case_id, document_id = _matter_with_document(client, auth_a)

    # user B cannot compute, read facts, create handoff, reminders, events, north star
    assert client.post("/api/v1/first-response", headers=auth_b, json={"case_id": case_id, "document_id": document_id}).status_code == 404
    assert client.get(f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth_b).status_code == 404
    assert client.post(f"/api/v1/first-response/{case_id}/handoff", headers=auth_b, json={"exact_human_question": "q"}).status_code == 404
    assert client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth_b).status_code == 404

    # unknown event names rejected
    assert client.post(f"/api/v1/first-response/{case_id}/events", headers=auth_a, json={"event_name": "made_up_event"}).status_code == 422
    # client cannot forge authoritative domain events
    for forged in ("action_completed", "handoff_created", "notice_upload_completed", "handoff_accepted", "matter_resolved"):
        assert client.post(f"/api/v1/first-response/{case_id}/events", headers=auth_a, json={"event_name": forged}).status_code == 422

    # north star false with telemetry only
    assert client.post(f"/api/v1/first-response/{case_id}/events", headers=auth_a, json={"event_name": "first_response_viewed"}).status_code == 200
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth_a).json()
    assert north["verified_next_action_completed"] is False


def test_current_action_identity_lifecycle(client):
    """Directive: north star == current identified action (stable identity)
    has actually been completed. Historical completion of a superseded action
    A must NEVER satisfy action B. Completion is BOUND to the action id/version
    the client observed: a stale click on A after B superseded it fails closed
    and must never complete B."""
    auth = _user(client, "action-identity")
    case_id, document_id = _matter_with_document(client, auth)

    # no action yet -> bound completion of a nonexistent id fails 404
    ghost = str(uuid.uuid4())
    assert client.post(f"/api/v1/first-response/{case_id}/actions/{ghost}/complete", headers=auth).status_code == 404

    # derive action A (compute first response on the Kündigung fixture)
    r = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert r.status_code == 200, r.text
    action_a = r.json()["current_action"]
    assert action_a["status"] == "pending"
    action_a_id = action_a["id"]
    action_a_version = action_a["version"]

    # north false while A pending
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is False
    assert north["current_action"]["id"] == action_a_id
    assert north["current_action"]["version"] == action_a_version

    # wrong version fails closed (expected_version mismatch) BEFORE any transition
    wrong_version = client.post(
        f"/api/v1/first-response/{case_id}/actions/{action_a_id}/complete",
        headers=auth, json={"expected_version": action_a_version + 1},
    )
    assert wrong_version.status_code == 409
    # nothing was completed
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is False
    assert north["current_action"]["status"] == "pending"

    # complete A through the authenticated server-owned operation (version bound)
    r = client.post(
        f"/api/v1/first-response/{case_id}/actions/{action_a_id}/complete",
        headers=auth, json={"expected_version": action_a_version},
    )
    assert r.status_code == 200, r.text
    assert r.json()["completed"] is True
    assert r.json()["action"]["id"] == action_a_id
    assert r.json()["north_star"]["verified_next_action_completed"] is True

    # fresh authenticated reload -> A remains true
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is True
    assert north["current_action"]["id"] == action_a_id

    # double completion rejected (409 already-completed)
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{action_a_id}/complete", headers=auth, json={"expected_version": action_a_version})
    assert r.status_code == 409
    assert "already completed" in r.json()["detail"].lower()

    # derive/change to genuinely NEW action B: upload a SECOND document with a
    # DIFFERENT classification (traffic/Bußgeld) to the SAME case and compute
    # the first response on it → family changes → action_key changes → B.
    traffic_upload = client.post(
        "/api/v1/documents/upload",
        headers=auth,
        params={"case_id": case_id},
        files={"file": ("bussgeld.txt", "Bußgeldbescheid wegen Ordnungswidrigkeit im Verkehr. Erhalten am 01.02.2026.".encode("utf-8"), "text/plain")},
    )
    assert traffic_upload.status_code == 201, traffic_upload.text
    traffic_doc_id = traffic_upload.json()["id"]

    r = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": traffic_doc_id})
    assert r.status_code == 200, r.text
    action_b = r.json()["current_action"]
    assert action_b["id"] != action_a_id, "genuinely new action B must have new identity"
    assert action_b["status"] == "pending"
    assert action_b["version"] == action_a_version + 1
    action_b_id = action_b["id"]
    action_b_version = action_b["version"]

    # B pending -> north false again (historical A completion must NOT satisfy)
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is False, "historical A completion must never satisfy B"
    assert north["current_action"]["id"] == action_b_id
    assert north["current_action"]["status"] == "pending"

    # STALE completion of A (the action id the client saw BEFORE B) FAILS CLOSED
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{action_a_id}/complete", headers=auth, json={"expected_version": action_a_version})
    assert r.status_code == 409, "stale A completion must fail closed"
    assert "superseded" in r.json()["detail"].lower() or "stale" in r.json()["detail"].lower()

    # B remains pending, north still false after the stale click
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is False
    assert north["current_action"]["id"] == action_b_id
    assert north["current_action"]["status"] == "pending"
    # A must still be superseded, B is the ONLY completable action
    assert action_a_id != action_b_id

    # complete B (bound)
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{action_b_id}/complete", headers=auth, json={"expected_version": action_b_version})
    assert r.status_code == 200, r.text
    assert r.json()["action"]["id"] == action_b_id
    assert r.json()["north_star"]["verified_next_action_completed"] is True

    # fresh authenticated reload -> B remains true
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is True
    assert north["current_action"]["id"] == action_b_id

    # wrong-case action id denied (a random case's bogus action id on this case)
    other_case, _ = _matter_with_document(client, auth)
    r = client.post(f"/api/v1/first-response/{other_case}/actions/{action_b_id}/complete", headers=auth, json={"expected_version": action_b_version})
    # B's id is not scoped to other_case -> 404 (not found for that case)
    assert r.status_code == 404

    # cross-user completion denied
    auth_b = _user(client, "action-identity-b")
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{action_b_id}/complete", headers=auth_b, json={"expected_version": action_b_version})
    assert r.status_code == 404, "cross-user completion must be denied"

    # client STILL cannot forge action_completed through telemetry
    assert client.post(f"/api/v1/first-response/{case_id}/events", headers=auth, json={"event_name": "action_completed"}).status_code == 422


def test_stale_click_race(client):
    """The exact race/invariant: client reads A.id/version, B supersedes A,
    then the stale A completion arrives → fail closed, B stays pending,
    north false; completing B succeeds; hard reload remains true for B."""
    auth = _user(client, "stale-click")
    case_id, document_id = _matter_with_document(client, auth)

    # derive A, client observes A id+version
    r = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert r.status_code == 200, r.text
    action_a = r.json()["current_action"]
    a_id = action_a["id"]
    a_ver = action_a["version"]

    # derive B (different family) BEFORE A is completed — the race
    traffic_upload = client.post(
        "/api/v1/documents/upload",
        headers=auth,
        params={"case_id": case_id},
        files={"file": ("bussgeld.txt", "Bußgeldbescheid wegen Ordnungswidrigkeit im Verkehr. Erhalten am 01.02.2026.".encode("utf-8"), "text/plain")},
    )
    assert traffic_upload.status_code == 201
    traffic_doc_id = traffic_upload.json()["id"]
    r = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": traffic_doc_id})
    assert r.status_code == 200, r.text
    action_b = r.json()["current_action"]
    b_id = action_b["id"]
    b_ver = action_b["version"]
    assert b_id != a_id

    # stale A completion (with A's observed version) FAILS CLOSED
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{a_id}/complete", headers=auth, json={"expected_version": a_ver})
    assert r.status_code == 409, "stale A click must fail closed"
    assert "superseded" in r.json()["detail"].lower() or "stale" in r.json()["detail"].lower()

    # B remains pending, north false
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is False
    assert north["current_action"]["id"] == b_id
    assert north["current_action"]["status"] == "pending"

    # complete using B's id/version -> B completed
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{b_id}/complete", headers=auth, json={"expected_version": b_ver})
    assert r.status_code == 200, r.text
    assert r.json()["action"]["id"] == b_id
    assert r.json()["north_star"]["verified_next_action_completed"] is True

    # hard/fresh reload remains true for B
    north = client.get(f"/api/v1/first-response/{case_id}/verified-next-action", headers=auth).json()
    assert north["verified_next_action_completed"] is True
    assert north["current_action"]["id"] == b_id

    # A remains superseded (never completed)
    r = client.post(f"/api/v1/first-response/{case_id}/actions/{a_id}/complete", headers=auth, json={"expected_version": a_ver})
    assert r.status_code == 409, "A must remain stale/superseded after B completed"


def test_concurrent_current_action_derivation(client):
    """Two near-simultaneous derivations for the same semantic action must
    produce exactly ONE current non-superseded CurrentAction with stable
    identity (the Case-row SELECT ... FOR UPDATE serializes them)."""
    import threading

    auth = _user(client, "concurrent-derive")
    case_id, document_id = _matter_with_document(client, auth)

    barrier = threading.Barrier(2)
    results: dict[str, int] = {}

    def derive_once(tag: str):
        barrier.wait()  # both threads fire at the same moment
        r = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
        results[tag] = r.status_code
        if r.status_code == 200:
            results[f"{tag}-id"] = r.json()["current_action"]["id"]
            results[f"{tag}-status"] = r.json()["current_action"]["status"]

    threads = [threading.Thread(target=derive_once, args=("t1",)), threading.Thread(target=derive_once, args=("t2",))]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=120)

    assert results.get("t1") == 200 and results.get("t2") == 200, f"both derivations should succeed, got {results}"
    ids = {results["t1-id"], results["t2-id"]}
    assert len(ids) == 1, f"two concurrent derivations must yield ONE current action identity, got {ids}"
    assert results["t1-status"] == "pending" and results["t2-status"] == "pending"

    # exactly one non-superseded current action in the DB (stable identity)
    import asyncio
    from app.database import AsyncSessionLocal
    from app.models.first_response_state import CurrentAction
    from sqlalchemy import select

    async def count_current():
        async with AsyncSessionLocal() as db:
            rows = (await db.execute(
                select(CurrentAction).where(CurrentAction.case_id == case_id, CurrentAction.status.in_(("pending", "completed")))
            )).scalars().all()
            return len(rows), rows[0].id if rows else None

    check_loop = asyncio.new_event_loop()
    try:
        n, stable_id = check_loop.run_until_complete(count_current())
    finally:
        check_loop.close()
    assert n == 1, f"exactly one non-superseded CurrentAction expected, got {n}"
    assert str(stable_id) in ids



def test_duplicate_statutory_clock_reconciliation(client):
    """Directive #2: exactly ONE coherent persisted statutory clock across
    pre-facts / post-facts / post-review recomputes; identity stable where
    semantics same, superseded (cancelled) where they change; reminder
    source_clock_id remains valid."""
    auth = _user(client, "dup-clock")
    case_id, document_id = _matter_with_document(client, auth)

    def stat_count():
        s = client.get(f"/api/v1/first-response/{case_id}/state", headers=auth).json()
        return len([c for c in s["clocks"] if c["clock_type"] == "STATUTORY_DEADLINE"]), s["clocks"]

    # 1) pre-facts first response (document upload may not have extracted yet,
    #    but the route computes from current persisted facts)
    r0 = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert r0.status_code == 200
    n0, clocks0 = stat_count()
    assert n0 == 1, f"pre-facts statutory count must be 1, got {n0}"
    id0 = next(c for c in clocks0 if c["clock_type"] == "STATUTORY_DEADLINE")["id"]

    # 2) post-facts recompute (facts now extracted/confirmed)
    facts = client.get(f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth).json()
    for f in facts:
        client.patch(
            f"/api/v1/first-response/{case_id}/documents/{document_id}/facts/{f['id']}",
            headers=auth,
            json={"review_status": "USER_CONFIRMED"},
        )
    r1 = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert r1.status_code == 200
    n1, clocks1 = stat_count()
    assert n1 == 1, f"post-facts statutory count must be 1, got {n1}"
    id1 = next(c for c in clocks1 if c["clock_type"] == "STATUTORY_DEADLINE")["id"]
    active1 = [c for c in clocks1 if c["status"] != "cancelled" and c["clock_type"] == "STATUTORY_DEADLINE"]
    assert len(active1) == 1, "exactly ONE active statutory clock after post-facts recompute"

    # 3) post-review recompute again (same semantics)
    r2 = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert r2.status_code == 200
    n2, clocks2 = stat_count()
    assert n2 == 1, f"post-review statutory count must be 1, got {n2}"
    id2 = next(c for c in clocks2 if c["clock_type"] == "STATUTORY_DEADLINE")["id"]
    assert id2 == id1, "identity must remain stable where semantics are the same"

    # reminder survives recompute: create against the current clock, recompute,
    # and the reminder's source_clock_id must still point at a live clock
    rem = client.post(
        f"/api/v1/first-response/{case_id}/reminders",
        headers=auth,
        json={"source_clock_id": id1, "reminder_date": "2026-03-20"},
    )
    assert rem.status_code == 200, rem.text
    r3 = client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id})
    assert r3.status_code == 200
    n3, clocks3 = stat_count()
    assert n3 == 1, f"post-reminder recompute statutory count must be 1, got {n3}"
    id3 = next(c for c in clocks3 if c["clock_type"] == "STATUTORY_DEADLINE")["id"]
    assert id3 == id1, "identity must remain stable across reminder recompute"
    s = client.get(f"/api/v1/first-response/{case_id}/state", headers=auth).json()
    rem_row = s["reminders"][0]
    assert rem_row["source_clock_id"] == id1, "reminder source_clock_id must remain valid"
    live_ids = {c["id"] for c in s["clocks"] if c["status"] != "cancelled"}
    assert rem_row["source_clock_id"] in live_ids, "reminder source clock must still be live"


def test_journey_state_reconstruction_after_persisted_writes(client):
    """Section A: GET /state reconstructs facts+facts review state, semantic
    clocks, reminders, handoff dossier availability, and north-star state from
    the DB — the read contract the CaseJourney UI uses after a hard reload."""
    auth = _user(client, "state-recon")
    case_id, document_id = _matter_with_document(client, auth)

    # no state yet
    s0 = client.get(f"/api/v1/first-response/{case_id}/state", headers=auth)
    assert s0.status_code == 200, s0.text
    assert s0.json()["facts"] == [] and s0.json()["clocks"] == []
    assert s0.json()["handoff"] is None
    assert s0.json()["north_star"]["verified_next_action_completed"] is False

    # confirm an extraction fact (if any) — the fixture text has no extractions
    # on empty text, so we add a user fact and review it instead.
    facts = client.get(f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth).json()
    if not facts:
        created = client.post(
            f"/api/v1/first-response/{case_id}/documents/{document_id}/facts",
            headers=auth,
            json={"fact_type": "termination_date", "value": "2026-03-31"},
        )
        assert created.status_code == 201, created.text
        facts = client.get(f"/api/v1/first-response/{case_id}/documents/{document_id}/facts", headers=auth).json()
    assert facts, "expected at least one fact"
    target = facts[0]
    assert client.patch(
        f"/api/v1/first-response/{case_id}/documents/{document_id}/facts/{target['id']}",
        headers=auth,
        json={"review_status": "USER_CONFIRMED"},
    ).status_code == 200

    # compute first response (persists clocks)
    assert client.post("/api/v1/first-response", headers=auth, json={"case_id": case_id, "document_id": document_id}).status_code == 200

    # create a reminder against the first clock
    s1 = client.get(f"/api/v1/first-response/{case_id}/state", headers=auth).json()
    assert s1["clocks"], "expected semantic clocks after first response"
    clock_id = s1["clocks"][0]["id"]
    assert client.post(
        f"/api/v1/first-response/{case_id}/reminders",
        headers=auth,
        json={"source_clock_id": clock_id, "reminder_date": "2026-02-10"},
    ).status_code == 200

    # create a handoff (dossier availability)
    assert client.post(
        f"/api/v1/first-response/{case_id}/handoff",
        headers=auth,
        json={"exact_human_question": "Bitte individuell prüfen.", "language": "de", "contact_preference": "email"},
    ).status_code == 200

    # reconstruct: everything the UI needs after a hard reload
    s2 = client.get(f"/api/v1/first-response/{case_id}/state", headers=auth).json()
    assert s2["facts"], "facts must reconstruct"
    assert any(f["review_status"] == "USER_CONFIRMED" for f in s2["facts"]), "fact review state must reconstruct"
    assert s2["clocks"], "semantic clocks must reconstruct"
    assert any(r["reminder_date"] == "2026-02-10" and r["status"] == "scheduled" for r in s2["reminders"]), "reminder must reconstruct"
    assert s2["handoff"] is not None and s2["handoff"]["status"], "handoff dossier availability must reconstruct"
    assert s2["handoff"]["dossier"], "handoff dossier content must reconstruct"
    assert {"facts", "clocks", "reminders", "timeline"} <= set(s2["handoff"]["dossier"].keys()), "dossier shape must be complete"
    assert s2["north_star"]["verified_next_action_completed"] is False, "north star must reconstruct (false before completion)"
    assert "action_completed" not in s2["north_star"]["evidence_events"]

    # cross-user state read denied
    auth_b = _user(client, "state-recon-b")
    assert client.get(f"/api/v1/first-response/{case_id}/state", headers=auth_b).status_code == 404

    # unauth read denied
    assert client.get(f"/api/v1/first-response/{case_id}/state").status_code in (401, 403)
