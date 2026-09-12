"""Canonical FelLaw public capability registry.

Only the six first-response capabilities are advertised. Legacy records are
kept out of the public registry to avoid stale promises and route drift.
"""
from __future__ import annotations
from dataclasses import asdict, dataclass, field
from typing import Literal

Role = Literal["anonymous", "citizen", "lawyer", "admin"]
Status = Literal["implemented", "partial", "planned", "missing", "removed"]
Kind = Literal["navigation", "read", "mutation"]
ROLES: tuple[Role, ...] = ("anonymous", "citizen", "lawyer", "admin")
PUBLIC: tuple[Role, ...] = ROLES
SIGNED_IN: tuple[Role, ...] = ("citizen", "lawyer", "admin")

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
    owner: str
    api_path: str | None = None
    requires_confirmation: bool = False
    note: str = ""
    tags: tuple[str, ...] = field(default_factory=tuple)
    def to_dict(self) -> dict:
        return asdict(self)

CAPABILITIES: tuple[Capability, ...] = (
    Capability("submit_notice", "Schreiben einreichen", "Submit a notice", "mutation", "implemented", PUBLIC, "/new-case", "submit_notice", "api/cases.py", "/api/v1/cases", True, "Canonical first-response intake."),
    Capability("upload_document", "Dokument hochladen", "Upload a document", "mutation", "implemented", SIGNED_IN, "/user/dashboard", "upload_document", "api/documents.py", "/api/v1/documents/upload", True),
    Capability("first_response", "Erstantwort", "First response", "read", "implemented", SIGNED_IN, "/user/dashboard", "first_response", "services/first_response.py", "/api/v1/first-response"),
    Capability("my_matters", "Meine Vorgänge", "My matters", "read", "implemented", SIGNED_IN, "/user/dashboard", "my_matters", "api/platform.py", "/api/v1/platform/overview"),
    Capability("deadline_reminders", "Fristerinnerungen", "Deadline reminders", "read", "implemented", SIGNED_IN, "/user/dashboard", "deadline_reminders", "api/first_response_state.py", "/api/v1/first-response/{case_id}/reminders"),
    Capability("human_handoff", "Übergabe an Menschen", "Human handoff", "mutation", "implemented", SIGNED_IN, "/user/dashboard", "human_handoff", "api/first_response_state.py", "/api/v1/first-response/{case_id}/handoff", True),
)
_BY_ID = {c.id: c for c in CAPABILITIES}

def capability_by_id(capability_id: str) -> Capability | None:
    return _BY_ID.get(capability_id)

def capabilities_for_role(role: str) -> list[Capability]:
    if role not in ROLES:
        raise ValueError(f"unknown role: {role!r}; expected one of {ROLES}")
    from app.services.legal_boundary import registry_legal_execution_status
    return [c for c in CAPABILITIES if role in c.roles and registry_legal_execution_status(c.id)]

def registry_summary() -> dict:
    return {"total": len(CAPABILITIES), "by_status": {"implemented": len(CAPABILITIES)}}

def resolve_role(user) -> Role:
    if user is None:
        return "anonymous"
    return "lawyer" if getattr(user, "is_lawyer", False) else "citizen"
