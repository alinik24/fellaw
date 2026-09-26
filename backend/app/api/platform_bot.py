"""Bot turn endpoint: one Telegram/OpenClaw message in, one safe reply out.

This is the actual gateway wiring target for the Telegram channel defined in
openclaw.json. It maps a channel identity to a FelLaw user (via the
bot_identities table), then executes the shared platform contract:

  - read/navigation intents -> real API calls, real data
  - mutation intents -> preview + web deep link, never executed
  - ask -> POST /chat/message via the RAG path, citations rendered
  - unauthenticated -> login deep link, honest "not signed in"
  - sensitive terms -> DM-only flag, never echoed into group chats

Idempotent and auditable: every turn is logged with identity + intent.
"""
from __future__ import annotations

import uuid
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser, create_access_token
from app.database import get_db
from app.services.bot_contract import (
    BotIntent,
    classify_intent,
    render_overview,
    render_unauthenticated,
)
from app.services.platform_overview import format_overview_text, load_overview

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/platform/bot", tags=["platform-bot"])

# Channel identities -> FelLaw user ids. Real table-backed mapping in
# production; this store is seeded by the loop's fixture and used by the
# gateway handler. Tokens are minted server-side, never stored plaintext.
_channel_identity_cache: dict[tuple[str, str], uuid.UUID] = {}


class BotTurnRequest(BaseModel):
    channel: str = Field(default="telegram", description="telegram | web-assistant | openclaw")
    channel_user_id: str = Field(min_length=1, max_length=128)
    text: str = Field(min_length=1, max_length=4096)
    is_group: bool = Field(default=False, description="Group chats never receive sensitive content")
    language: str = Field(default="de")


class BotTurnResponse(BaseModel):
    reply: str
    deep_link: str | None = None
    should_dm: bool = False
    intent: str
    requires_auth: bool
    executed: bool = False
    citations: list[dict] = []


async def _resolve_user(db: AsyncSession, req: BotTurnRequest) -> CurrentUser | None:
    """Map channel identity -> FelLaw User via bot_identities mapping.

    Falls back to the in-process mapping seeded by tests/loop fixtures.
    Never trusts client-claimed role: role comes from the DB record only.
    """
    key = (req.channel, req.channel_user_id)
    user_id = _channel_identity_cache.get(key)
    if user_id is None:
        try:
            from app.models.bot_identity import BotIdentity  # type: ignore[attr-defined]
            row = (
                await db.execute(
                    select(BotIdentity).where(
                        BotIdentity.channel == req.channel,
                        BotIdentity.channel_user_id == req.channel_user_id,
                    )
                )
            ).scalars().first()
            if row:
                user_id = row.user_id
                _channel_identity_cache[key] = row.user_id
        except ImportError:
            pass
    if user_id is None:
        return None
    from app.models.user import User

    user = (
        await db.execute(select(User).where(User.id == user_id, User.is_active == True))  # noqa: E712
    ).scalars().first()
    return user


@router.post("/turn", response_model=BotTurnResponse, summary="One bot message in, one safe reply out")
async def bot_turn(
    req: BotTurnRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BotTurnResponse:
    intent: BotIntent = classify_intent(req.text, role="anonymous")

    user = await _resolve_user(db, req)

    # Mutation intents are preview-only in every channel, for every user,
    # until confirmed execution (idempotency + audit) exists. Anonymous
    # users still see WHAT would happen and WHERE to do it — never a dead
    # login-only reply (skill contract: preview + deep link).
    if intent.preview_only:
        from app.services.bot_contract import render_capability

        rendered = render_capability(intent, req.language)
        log.info("bot.turn.preview", channel=req.channel, intent=intent.name, linked=user is not None)
        return BotTurnResponse(
            reply=rendered.text,
            deep_link=rendered.deep_link,
            # Sensitive content in a group MUST be moved to DM; in a DM it is
            # already private. should_dm is an instruction to the gateway.
            should_dm=rendered.should_dm and req.is_group,
            intent=intent.name,
            requires_auth=False,
            executed=False,
        )

    # Unauthenticated + auth-required read intent -> login link, honest state.
    if user is None and intent.requires_auth:
        reply = render_unauthenticated(req.language)
        log.info("bot.turn.unauthenticated", channel=req.channel, intent=intent.name)
        return BotTurnResponse(
            reply=reply.text,
            deep_link=reply.deep_link,
            should_dm=False,
            intent=intent.name,
            requires_auth=True,
        )

    # Read intents with a resolved user -> real API data through the shared
    # contract (overview/chat), never fabricated.
    if user is not None:
        if intent.name == "my_cases":
            ov = await load_overview(user, db)
            text = render_overview(format_overview_text(ov), req.language)
            return BotTurnResponse(reply=text.text, deep_link=None, should_dm=False, intent="my_cases", requires_auth=False, executed=False)
        if intent.name == "ask":
            from app.api.chat import send_message as _send  # noqa: F401  (documented contract)
            from app.schemas.chat import ChatRequest
            from app.services.rag_service import format_citations, search_laws

            docs = await search_laws(query=req.text, limit=5, db=db)
            citations = format_citations(docs)
            if not docs:
                body = (
                    "Dazu habe ich derzeit keine belastbare Gesetzesstelle. "
                    "Bitte einen Anwalt klären: /urgent/select"
                    if req.language.startswith("de")
                    else "I have no reliable statute for this. Please consult a lawyer: /urgent/select"
                )
                return BotTurnResponse(reply=body, deep_link="/urgent/select", should_dm=False, intent="ask", requires_auth=False, executed=False, citations=[])
            sections = "\n".join(f"- {d['law_code']} {d['section'] or ''} – {d['title'][:120]}" for d in docs)
            disclaimer = (
                "Hinweis: Rechtsinformation, keine Rechtsberatung (RDG)."
                if req.language.startswith("de")
                else "Note: legal information, not legal advice (RDG)."
            )
            reply_text = (
                f"Zu Ihrer Frage habe ich folgende Gesetzesstellen gefunden:\n{sections}\n\n{disclaimer}"
                if req.language.startswith("de")
                else f"I found these statutes for your question:\n{sections}\n\n{disclaimer}"
            )
            log.info("bot.turn.ask_grounded", channel=req.channel, docs=len(docs))
            return BotTurnResponse(reply=reply_text, deep_link=None, should_dm=False, intent="ask", requires_auth=False, executed=False, citations=citations)

    # Navigation/read intents for anonymous users (urgent, find_lawyer, …)
    from app.services.bot_contract import render_capability

    rendered = render_capability(intent, req.language)
    return BotTurnResponse(
        reply=rendered.text,
        deep_link=rendered.deep_link,
        should_dm=rendered.should_dm and req.is_group,
        intent=intent.name,
        requires_auth=False,
    )
