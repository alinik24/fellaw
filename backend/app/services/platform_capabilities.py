"""
Shared web/bot capability registry for FelLaw.

This is the single source of truth that the React shell, the embedded
assistant, and the OpenClaw/Telegram "fellaw" bot consult so that every
surface advertises the *same* capabilities with the *same* honesty about
status.  It is deliberately pure (no DB, no I/O) so it can be unit-tested
and imported from anywhere.

Status semantics (keep them honest):
  implemented  – end-to-end path exists: UI/route + API + persistence.
  partial      – some layer exists but the loop is not closed (e.g. UI only,
                 API only, or AI-simulated placeholder).
  planned      – designed/documented, nothing executable yet.
  missing      – advertised somewhere but no design or code.
  removed      – explicitly taken out of public scope; not advertised to
                 users (frozen or fabricated surface unrouted pending the
                 narrower product contract).

Kind semantics:
  navigation – pure deep link (no API contract needed).
  read       – authenticated, profile-scoped read model.
  mutation   – changes state; MUST require explicit confirmation in any
               bot/assistant channel and go through the same API as the web.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Literal

Role = Literal["anonymous", "citizen", "lawyer", "admin"]
Status = Literal["implemented", "partial", "planned", "missing", "removed"]
Kind = Literal["navigation", "read", "mutation"]

ROLES: tuple[Role, ...] = ("anonymous", "citizen", "lawyer", "admin")


@dataclass(frozen=True)
class Capability:
    id: str
    label_de: str
    label_en: str
    kind: Kind
    status: Status
    roles: tuple[Role, ...]
    web_route: str
    bot_intent: str
    owner: str  # owning backend unit / router
    api_path: str | None = None
    requires_confirmation: bool = False
    note: str = ""
    tags: tuple[str, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict:
        return asdict(self)


PUBLIC: tuple[Role, ...] = ("anonymous", "citizen", "lawyer", "admin")
SIGNED_IN: tuple[Role, ...] = ("citizen", "lawyer", "admin")

CAPABILITIES: tuple[Capability, ...] = (
    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------
    Capability(
        id="urgent_help",
        label_de="Sofortige Hilfe (Krisensituation)",
        label_en="Urgent legal help (crisis now)",
        kind="navigation",
        status="implemented",
        roles=PUBLIC,
        web_route="/urgent/select",
        bot_intent="urgent",
        owner="frontend/pages/Urgent*, api/emergency.py",
        api_path="/api/v1/emergency",
        tags=("crisis", "police", "accident"),
    ),
    Capability(
        id="start_case_intake",
        label_de="Neuen Fall anlegen (Intake-Formular)",
        label_en="Start a new case (guided intake)",
        kind="navigation",
        status="implemented",
        roles=PUBLIC,
        web_route="/new-case",
        bot_intent="new_case",
        owner="frontend/pages/NewCase*.tsx, api/cases.py",
        api_path="/api/v1/cases",
        note="Six case-type forms exist (traffic, consumer, family, employment, visa, generic).",
    ),
    Capability(
        id="find_lawyer",
        label_de="Anwalt finden",
        label_en="Find a lawyer",
        kind="read",
        status="implemented",
        roles=PUBLIC,
        web_route="/find-lawyer",
        bot_intent="find_lawyer",
        owner="api/professionals.py",
        api_path="/api/v1/professionals/lawyers",
    ),
    Capability(
        id="law_firms",
        label_de="Kanzleien",
        label_en="Law firms directory",
        kind="read",
        status="removed",
        roles=PUBLIC,
        web_route="/",
        bot_intent="law_firms",
        owner="api/professionals.py",
        api_path="/api/v1/professionals/firms",
        note="Removed from public scope (PR-01): fabricated directory page unrouted. Directory frozen pending PR-04.",
    ),
    Capability(
        id="self_service",
        label_de="Selbsthilfe & Vorlagen",
        label_en="Self-service tools & templates",
        kind="read",
        status="removed",
        roles=PUBLIC,
        web_route="/",
        bot_intent="templates",
        owner="api/templates.py",
        api_path="/api/v1/templates",
        note="Removed from public scope (PR-01): fabricated self-service page unrouted. Template catalogue frozen pending PR-04.",
    ),
    Capability(
        id="insurance_check",
        label_de="Rechtsschutz prüfen",
        label_en="Legal insurance check",
        kind="read",
        status="removed",
        roles=PUBLIC,
        web_route="/",
        bot_intent="insurance",
        owner="api/insurance.py",
        api_path="/api/v1/insurance",
        note="Removed from public scope (PR-01): fabricated coverage page unrouted. Insurance checking frozen pending PR-04.",
    ),
    Capability(
        id="mediation",
        label_de="Mediation (Graybeard)",
        label_en="Mediation",
        kind="read",
        status="removed",
        roles=PUBLIC,
        web_route="/",
        bot_intent="mediation",
        owner="api/mediation.py",
        api_path="/api/v1/mediation",
        note="Removed from public scope (PR-01): fabricated mediation page unrouted. Mediation frozen pending PR-04.",
    ),
    Capability(
        id="lawyer_onboarding",
        label_de="Als Anwalt registrieren",
        label_en="Register as a lawyer",
        kind="navigation",
        status="removed",
        roles=PUBLIC,
        web_route="/",
        bot_intent="lawyer_signup",
        owner="api/professionals.py",
        api_path="/api/v1/professionals/lawyers/profile",
        note="Removed from public scope (PR-01): fabricated onboarding page unrouted. Professional onboarding frozen until an honest, persisted referral-directed flow exists (PR-04+).",
    ),
    Capability(
        id="careers",
        label_de="Karriere",
        label_en="Careers",
        kind="navigation",
        status="removed",
        roles=PUBLIC,
        web_route="/",
        bot_intent="careers",
        owner="api/careers.py",
        api_path="/api/v1/careers",
        note="Removed from public scope (PR-01): fabricated careers page unrouted. Careers frozen pending PR-04.",
    ),
    Capability(
        id="contact",
        label_de="Kontakt",
        label_en="Contact",
        kind="navigation",
        status="implemented",
        roles=PUBLIC,
        web_route="/contact",
        bot_intent="contact",
        owner="frontend/pages/Contact.tsx",
    ),
    # ------------------------------------------------------------------
    # Signed-in citizen capabilities
    # ------------------------------------------------------------------
    Capability(
        id="my_cases",
        label_de="Meine Fälle",
        label_en="My cases",
        kind="read",
        status="implemented",
        roles=SIGNED_IN,
        web_route="/user/dashboard",
        bot_intent="my_cases",
        owner="api/cases.py, api/platform.py (overview)",
        api_path="/api/v1/cases",
    ),
    Capability(
        id="case_assessment",
        label_de="Fallbewertung & Roadmap",
        label_en="Case assessment & roadmap",
        kind="read",
        status="removed",
        roles=SIGNED_IN,
        web_route="/user/dashboard",
        bot_intent="roadmap",
        owner="services/roadmap_service.py, api/chat.py",
        api_path="/api/v1/chat/roadmap",
        note="Removed from public scope (PR-01): fabricated assessment page unrouted; callers redirect to the real state-backed dashboard. First-response matter experience is a later PR.",
    ),
    Capability(
        id="laws_search",
        label_de="Rechtsfrage stellen (Quellen-Suche)",
        label_en="Ask a legal question (source lookup)",
        kind="read",
        status="implemented",
        roles=SIGNED_IN,
        web_route="/user/dashboard",
        bot_intent="ask",
        owner="api/laws.py, services/rag_service.py, api/chat.py (bounded A-path)",
        api_path="/api/v1/laws/search",
        note="Web floating assistant is still a simulated script; the bot and dashboard use this API. Bounded statute/source lookup (L0). Generative chat is gated pending review.",
        tags=("ai", "advisory-only"),
    ),
    Capability(
        id="upload_document",
        label_de="Dokument hochladen & analysieren",
        label_en="Upload & analyse a document",
        kind="mutation",
        status="implemented",
        roles=SIGNED_IN,
        web_route="/user/dashboard",
        bot_intent="upload",
        owner="api/document_upload.py, services/document_service.py",
        api_path="/api/v1/upload",
        requires_confirmation=True,
        note="OCR path is local-first; cloud DocIntel is optional and disabled by policy.",
    ),
    Capability(
        id="notifications",
        label_de="Benachrichtigungen",
        label_en="Notifications",
        kind="read",
        status="implemented",
        roles=SIGNED_IN,
        web_route="/user/dashboard",
        bot_intent="notifications",
        owner="api/notifications.py",
        api_path="/api/v1/notifications",
    ),
    Capability(
        id="request_referral",
        label_de="Anwaltsvermittlung anfragen",
        label_en="Request a lawyer referral",
        kind="mutation",
        status="partial",
        roles=("citizen", "admin"),
        web_route="/find-lawyer",
        bot_intent="refer_me",
        owner="api/referrals.py",
        api_path="/api/v1/referrals",
        requires_confirmation=True,
        note="API exists; acceptance/notification loop with the lawyer is not closed.",
    ),
    Capability(
        id="book_consultation",
        label_de="Beratungstermin buchen",
        label_en="Book a consultation",
        kind="mutation",
        status="planned",
        roles=("citizen",),
        web_route="/find-lawyer",
        bot_intent="book",
        owner="(missing) scheduling unit",
        requires_confirmation=True,
        note="No calendar/scheduling domain exists.",
    ),
    Capability(
        id="pay_consultation",
        label_de="Bezahlen",
        label_en="Pay for a consultation",
        kind="mutation",
        status="missing",
        roles=("citizen",),
        web_route="/find-lawyer",
        bot_intent="pay",
        owner="(missing) payments unit",
        requires_confirmation=True,
        note="No payment gateway, invoicing, or RVG fee logic.",
    ),
    # ------------------------------------------------------------------
    # Lawyer / admin
    # ------------------------------------------------------------------
    Capability(
        id="lawyer_dashboard",
        label_de="Anwalts-Dashboard",
        label_en="Lawyer dashboard",
        kind="read",
        status="removed",
        roles=("lawyer", "admin"),
        web_route="/",
        bot_intent="lawyer_dashboard",
        owner="api/referrals.py (backend preserved)",
        api_path="/api/v1/referrals",
        note="Removed from public scope (PR-01): fabricated professional dashboard unrouted. Real referral backend/domain preserved; no new lawyer dashboard in this PR.",
    ),
    Capability(
        id="verify_lawyer",
        label_de="Anwalt verifizieren",
        label_en="Verify a lawyer profile",
        kind="mutation",
        status="removed",
        roles=("admin",),
        web_route="/",
        bot_intent="verify_lawyer",
        owner="api/professionals.py",
        api_path="/api/v1/professionals/lawyers/profile",
        requires_confirmation=True,
        note="Removed from public scope (PR-01): admin/verification surface unrouted with the fabricated lawyer dashboard.",
    ),
)

_BY_ID = {c.id: c for c in CAPABILITIES}


def capability_by_id(capability_id: str) -> Capability | None:
    return _BY_ID.get(capability_id)


def capabilities_for_role(role: str) -> list[Capability]:
    if role not in ROLES:
        raise ValueError(f"unknown role: {role!r}; expected one of {ROLES}")
    # PR-01: removed capabilities are NOT advertised to any role (they remain
    # in the registry for history and bot intent-mapping, but are not offered).
    # PR-02: capabilities gated by the legal boundary (REVIEW_REQUIRED /
    # DISABLED) are also not advertised as available product features.
    from app.services.legal_boundary import registry_legal_execution_status

    return [
        c
        for c in CAPABILITIES
        if role in c.roles
        and c.status != "removed"
        and registry_legal_execution_status(c.id)
    ]


def registry_summary() -> dict:
    by_status: dict[str, int] = {}
    for c in CAPABILITIES:
        by_status[c.status] = by_status.get(c.status, 0) + 1
    return {"total": len(CAPABILITIES), "by_status": by_status}


def resolve_role(user) -> Role:
    """Derive the coarse role used by the registry from a User ORM object.

    Admin is not modelled in the schema yet, so it is never returned here;
    `lawyer` requires a LawyerProfile relationship to be loaded by the caller.
    """
    if user is None:
        return "anonymous"
    if getattr(user, "is_lawyer", False):
        return "lawyer"
    return "citizen"
