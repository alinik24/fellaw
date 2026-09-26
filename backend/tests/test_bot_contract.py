from app.services.bot_contract import (
    classify_intent,
    render_capability,
    render_overview,
    render_unauthenticated,
)


def test_intent_uses_registry_and_preview_for_mutations():
    intent = classify_intent("Please book an appointment")
    assert intent.name == "book"
    assert intent.capability is not None
    assert intent.preview_only is True
    reply = render_capability(intent, "en")
    assert "not executed" in reply.text
    assert reply.deep_link == "/find-lawyer"


def test_unknown_question_requires_auth_for_real_chat():
    intent = classify_intent("What is the notice period?")
    assert intent.name == "ask"
    assert intent.requires_auth is True
    assert render_unauthenticated("en").deep_link == "/auth/user/login"


def test_sensitive_route_is_marked_for_private_delivery():
    reply = render_capability(classify_intent("I was arrested and need urgent help"), "de")
    assert reply.should_dm is True
    assert reply.deep_link == "/urgent/select"


def test_overview_adds_rdq_disclaimer():
    reply = render_overview("Cases: 1 open", "en")
    assert "not legal advice (RDG)" in reply.text
