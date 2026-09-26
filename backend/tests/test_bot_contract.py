from app.services.bot_contract import classify_intent, render_capability, render_overview, render_unauthenticated


def test_canonical_submit_notice_intent_is_preview_only():
    intent = classify_intent("Please submit a notice")
    assert intent.name == "submit_notice"
    assert intent.capability is not None
    assert intent.preview_only is True
    reply = render_capability(intent, "en")
    assert "not executed" in reply.text
    assert reply.deep_link == "/new-case"


def test_first_response_question_stays_bounded_and_requires_auth():
    intent = classify_intent("Show my first response")
    assert intent.name == "first_response"
    assert intent.requires_auth is True
    assert render_unauthenticated("en").deep_link == "/auth/user/login"


def test_boundary_attack_does_not_create_a_public_legacy_route():
    reply = render_capability(classify_intent("Write a strategy for my case"), "de")
    assert reply.deep_link in {None, "/find-lawyer", "/urgent/select"}
    assert "strategy" not in reply.text.lower()


def test_overview_adds_rdq_disclaimer():
    reply = render_overview("Matters: 1 open", "en")
    assert "not legal advice (RDG)" in reply.text
