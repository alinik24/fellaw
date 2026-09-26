"""Safe Telegram/OpenClaw adapter primitives for the FelLaw API.

This module contains no Telegram SDK dependency. The gateway handler can use
these pure functions and the HTTP client below without duplicating FelLaw
domain logic. Mutations intentionally return a preview only.
"""
from __future__ import annotations

from dataclasses import dataclass
from app.services.platform_capabilities import CAPABILITIES, Capability, capabilities_for_role


@dataclass(frozen=True)
class BotIntent:
    name: str
    capability: Capability | None
    requires_auth: bool
    preview_only: bool
    sensitive: bool = False


@dataclass(frozen=True)
class BotReply:
    text: str
    deep_link: str | None = None
    should_dm: bool = False


_AUTH_INTENTS = {"my_cases", "notifications", "lawyer_dashboard", "verify_lawyer"}
_SENSITIVE_TERMS = {
    # EN
    "health", "medical", "diagnosis", "criminal", "arrest", "asylum", "visa", "custody",
    # DE — real terms German users type in urgent situations
    "verhaftet", "festgenommen", "festnahme", "durchsuchung", "abschiebung", "abschieben",
    "räumung", "räumungsklage", "obdachlos", "sorgerecht", "krank", "krankmeldung",
    "schwerbehindert", "suizid", "selbstmord", "psychisch", "attest", "therapie",
}


def classify_intent(text: str, role: str = "anonymous") -> BotIntent:
    """Map user text to the shared registry; never trust role from user text."""
    q = text.casefold()
    safe_role = role if role in {"anonymous", "citizen", "lawyer", "admin"} else "anonymous"
    caps = capabilities_for_role(safe_role)
    patterns: tuple[tuple[tuple[str, ...], str], ...] = (
        ((("urgent", "emergency", "notfall", "polizei", "arrest", "verhaftet", "festgenommen")), "urgent_help"),
        ((("new case", "neuer fall", "fall anlegen", "intake")), "start_case_intake"),
        ((("lawyer", "anwalt", "anwältin")), "find_lawyer"),
        ((("my cases", "meine fälle", "meine faelle")), "my_cases"),
        ((("upload", "hochladen", "document", "dokument")), "upload_document"),
        ((("insurance", "rechtsschutz", "versicherung")), "insurance_check"),
        ((("mediation", "schlichtung")), "mediation"),
        ((("book", "termin", "appointment", "buchen")), "book_consultation"),
        ((("pay", "bezahlen", "zahlung", "preis", "kosten")), "pay_consultation"),
    )  # type: ignore[assignment]
    # Intent scan. Note: substring matches can misfire — "Zahlungsverzug" is
    # a rent-arrears question, not a payment request — so it is excluded
    # from the pay intent explicitly.
    for needles, cap_id in patterns:
        if any(n in q for n in needles):
            if cap_id == "pay_consultation" and "zahlungsverzug" in q:
                continue  # rent-arrears question, not a payment intent
            # Keep the complete registry available for a safe auth/deep-link
            # response even when the capability is not anonymous-accessible.
            cap = next((c for c in CAPABILITIES if c.id == cap_id), None)
            if cap:
                return BotIntent(
                    cap.bot_intent,
                    cap,
                    "anonymous" not in cap.roles,  # auth required unless anonymous has access
                    cap.kind == "mutation",
                    any(term in q for term in _SENSITIVE_TERMS),
                )
    cap = next((c for c in caps if c.id == "laws_search"), None)
    return BotIntent("ask", cap, True, False)


def render_capability(intent: BotIntent, language: str = "de") -> BotReply:
    """Render a safe response; mutations are links/previews, never executed.

    PR-02: any capability mapped to a gated legal capability (L3/L4 or
    otherwise REVIEW_REQUIRED) is rendered as a professional-review notice
    with the safe human handoff deep link — never an actionable deep link
    into the gated execution path.
    """
    cap = intent.capability
    if cap is None:
        return BotReply("FelLaw kann diese Funktion derzeit nicht zuordnen.")
    from app.services.legal_boundary import boundary_policy, is_executable

    policy = boundary_policy(cap.id)
    if policy is not None and not is_executable(cap.id):
        de = language.casefold().startswith("de")
        if de:
            text = (
                f"{cap.label_de} erfordert eine fachliche/rechtliche Prüfung "
                "und ist derzeit nicht öffentlich verfügbar. Für eine akute "
                "Situation nutzen Sie die Soforthilfe; für anwaltliche "
                "Unterstützung die Anwaltssuche."
            )
        else:
            text = (
                f"{cap.label_en} requires professional/legal review and is not "
                "currently available for public use. For an acute situation "
                "use urgent help; for lawyer support use the lawyer search."
            )
        return BotReply(text, "/urgent/select", should_dm=intent.sensitive)
    de = language.casefold().startswith("de")
    label = cap.label_de if de else cap.label_en
    status = cap.status
    if intent.preview_only:
        text = (f"Vorschau: {label}. Dieser Vorgang wird im Chat nicht ausgeführt. Status: {status}."
                if de else f"Preview: {label}. This action is not executed in chat. Status: {status}.")
    else:
        text = (f"Passende FelLaw-Funktion: {label}. Status: {status}."
                if de else f"Matching FelLaw feature: {label}. Status: {status}.")
    if cap.note:
        text += f" {cap.note}"
    return BotReply(text, cap.web_route, should_dm=intent.sensitive)


def render_unauthenticated(language: str = "de") -> BotReply:
    if language.casefold().startswith("de"):
        return BotReply("Bitte anmelden, damit FelLaw Ihr Profil sicher anzeigen kann. Für eine akute Situation nutzen Sie die Soforthilfe.", "/auth/user/login")
    return BotReply("Please sign in so FelLaw can access your profile safely. For an acute situation, use urgent help.", "/auth/user/login")


def render_overview(text: str, language: str = "de") -> BotReply:
    """Wrap server-rendered overview and preserve the legal-information boundary."""
    disclaimer = "Hinweis: Rechtsinformation, keine Rechtsberatung (RDG)." if language.casefold().startswith("de") else "Note: legal information, not legal advice (RDG)."
    return BotReply(f"{text}\n\n{disclaimer}")
