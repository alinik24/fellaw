"""
Chat router – AI-powered RAG chat, streaming, and specialised AI endpoints.
"""
from __future__ import annotations

import json
import uuid
from typing import Annotated, AsyncGenerator

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import CurrentUser, get_current_user
from app.config import settings
from app.database import get_db
from app.models.case import Case
from app.models.law_document import Conversation, Message
from app.schemas.chat import (
    ChatRequest,
    ConversationCreate,
    ConversationResponse,
    CounterargumentRequest,
    MessageResponse,
    NarrativeRequest,
    RoadmapRequest,
)

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_or_create_conversation(
    conversation_id: uuid.UUID | None,
    case_id: uuid.UUID | None,
    conversation_type: str,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Conversation:
    if conversation_id:
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        conv = (await db.execute(stmt)).scalars().first()
        if conv is None:
            raise HTTPException(status_code=404, detail="Konversation nicht gefunden.")
        return conv

    conv = Conversation(
        user_id=user_id,
        case_id=case_id,
        conversation_type=conversation_type,
        title=None,
    )
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv


async def _load_conversation_history(
    conversation_id: uuid.UUID,
    db: AsyncSession,
    limit: int = 20,
) -> list[dict[str, str]]:
    """Load recent messages as OpenAI-format message list."""
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = (await db.execute(stmt)).scalars().all()
    messages = list(reversed(messages))  # chronological order
    return [{"role": m.role, "content": m.content} for m in messages]


async def _get_case_context(
    case_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> str | None:
    stmt = select(Case).where(Case.id == case_id, Case.user_id == user_id)
    case = (await db.execute(stmt)).scalars().first()
    if case is None:
        return None

    parts = [
        f"Falltyp: {case.case_type}",
        f"Titel: {case.title}",
        f"Status: {case.status}",
        f"Dringlichkeit: {case.urgency}",
    ]
    if case.description:
        parts.append(f"Beschreibung: {case.description}")
    if case.opposing_party:
        parts.append(f"Gegenpartei: {case.opposing_party}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# POST /chat/message – main chat endpoint
# ---------------------------------------------------------------------------


@router.post("/message", response_model=MessageResponse)
async def send_message(
    body: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    from app.services.ai_service import SYSTEM_PROMPT_DE, chat_completion
    from app.services.rag_service import format_citations, get_context_for_chat, search_laws

    # Get or create conversation
    conv = await _get_or_create_conversation(
        body.conversation_id,
        body.case_id,
        body.conversation_type,
        current_user.id,
        db,
    )

    # Load chat history
    history = await _load_conversation_history(conv.id, db)

    # Build case context if a case is linked
    case_context: str | None = None
    if body.case_id:
        case_context = await _get_case_context(body.case_id, current_user.id, db)

    # RAG: retrieve relevant law snippets
    law_context = ""
    raw_law_docs: list[dict] = []
    try:
        raw_law_docs = await search_laws(
            query=body.message,
            limit=5,
            db=db,
        )
        law_context = await get_context_for_chat(
            query=body.message,
            case_context=case_context,
            db=db,
        )
    except Exception as exc:
        log.warning("send_message.rag_failed", error=str(exc))

    # Assemble system prompt
    system_content = SYSTEM_PROMPT_DE
    if case_context:
        system_content += f"\n\n**Aktueller Fall des Nutzers:**\n{case_context}"
    if law_context:
        system_content += f"\n\n{law_context}"

    messages: list[dict[str, str]] = [{"role": "system", "content": system_content}]
    messages.extend(history)
    messages.append({"role": "user", "content": body.message})

    # Call the AI
    ai_response = await chat_completion(
        messages=messages,
        stream=False,
        temperature=0.3,
        max_tokens=4096,
    )
    assert isinstance(ai_response, str)

    # Format citations
    citations = format_citations(raw_law_docs) if raw_law_docs else []

    # Persist user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=body.message,
        citations=[],
        metadata_={},
    )
    db.add(user_msg)

    # Persist assistant message
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=ai_response,
        citations=citations,
        metadata_={"model": settings.AZURE_CHAT_MODEL, "rag_docs": len(raw_law_docs)},
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    log.info(
        "send_message.done",
        conversation_id=str(conv.id),
        citations=len(citations),
    )
    return MessageResponse.model_validate(assistant_msg)


# ---------------------------------------------------------------------------
# GET /chat/stream – SSE streaming endpoint
# ---------------------------------------------------------------------------


@router.get("/stream")
async def stream_chat(
    message: str = Query(..., min_length=1),
    conversation_id: uuid.UUID | None = Query(None),
    case_id: uuid.UUID | None = Query(None),
    current_user: Annotated[Any, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> StreamingResponse:
    from app.services.ai_service import SYSTEM_PROMPT_DE, chat_completion
    from app.services.rag_service import get_context_for_chat

    # Get or create conversation
    conv = await _get_or_create_conversation(
        conversation_id,
        case_id,
        "legal_chat",
        current_user.id,
        db,
    )

    history = await _load_conversation_history(conv.id, db)

    case_context: str | None = None
    if case_id:
        case_context = await _get_case_context(case_id, current_user.id, db)

    law_context = ""
    try:
        law_context = await get_context_for_chat(query=message, case_context=case_context, db=db)
    except Exception as exc:
        log.warning("stream_chat.rag_failed", error=str(exc))

    system_content = SYSTEM_PROMPT_DE
    if case_context:
        system_content += f"\n\n**Aktueller Fall:**\n{case_context}"
    if law_context:
        system_content += f"\n\n{law_context}"

    messages_list: list[dict[str, str]] = [{"role": "system", "content": system_content}]
    messages_list.extend(history)
    messages_list.append({"role": "user", "content": message})

    # Persist user message immediately
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=message,
        citations=[],
        metadata_={},
    )
    db.add(user_msg)
    await db.flush()

    async def event_generator() -> AsyncGenerator[str, None]:
        full_response = ""
        try:
            stream = await chat_completion(messages=messages_list, stream=True, temperature=0.3)
            async for chunk in stream:  # type: ignore[union-attr]
                full_response += chunk
                # SSE format: "data: <chunk>\n\n"
                yield f"data: {json.dumps({'content': chunk})}\n\n"

            # Persist assistant message after streaming completes
            async with db:
                assistant_msg = Message(
                    conversation_id=conv.id,
                    role="assistant",
                    content=full_response,
                    citations=[],
                    metadata_={"model": settings.AZURE_CHAT_MODEL, "streaming": True},
                )
                db.add(assistant_msg)
                await db.commit()

        except Exception as exc:
            log.error("stream_chat.error", error=str(exc))
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Conversation management
# ---------------------------------------------------------------------------


@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    body: ConversationCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationResponse:
    conv = Conversation(
        user_id=current_user.id,
        case_id=body.case_id,
        title=body.title,
        conversation_type=body.conversation_type,
    )
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return ConversationResponse.model_validate(conv)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[ConversationResponse]:
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    convs = (await db.execute(stmt)).scalars().all()
    return [ConversationResponse.model_validate(c) for c in convs]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConversationResponse:
    stmt = (
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .options(selectinload(Conversation.messages))
    )
    conv = (await db.execute(stmt)).scalars().first()
    if conv is None:
        raise HTTPException(status_code=404, detail="Konversation nicht gefunden.")
    return ConversationResponse.model_validate(conv)


@router.delete("/conversations/{conversation_id}", status_code=204, response_model=None)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    )
    conv = (await db.execute(stmt)).scalars().first()
    if conv is None:
        raise HTTPException(status_code=404, detail="Konversation nicht gefunden.")
    await db.delete(conv)
    await db.flush()


# ---------------------------------------------------------------------------
# Specialised AI endpoints
# ---------------------------------------------------------------------------


@router.post("/narrative", response_model=MessageResponse, status_code=201)
async def generate_narrative_chat(
    body: NarrativeRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Generate a legal narrative and return it as a chat message."""
    from app.services.narrative_service import build_narrative
    from sqlalchemy.orm import selectinload

    stmt = (
        select(Case)
        .where(Case.id == body.case_id, Case.user_id == current_user.id)
        .options(selectinload(Case.timeline_events))
    )
    case = (await db.execute(stmt)).scalars().first()
    if case is None:
        raise HTTPException(status_code=404, detail="Fall nicht gefunden.")

    content = await build_narrative(
        case=case,
        narrative_type=body.narrative_type,
        language=body.language,
        additional_context=body.additional_context or "",
        db=db,
    )

    # Create a dedicated conversation for this narrative
    conv = Conversation(
        user_id=current_user.id,
        case_id=body.case_id,
        conversation_type="narrative_builder",
        title=f"Narrativ: {body.narrative_type}",
    )
    db.add(conv)
    await db.flush()

    msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=content,
        citations=[],
        metadata_={"narrative_type": body.narrative_type, "language": body.language},
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)

    return MessageResponse.model_validate(msg)


@router.post("/roadmap", response_model=MessageResponse, status_code=201)
async def generate_roadmap_chat(
    body: RoadmapRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Generate a legal roadmap and return it as a formatted chat message."""
    from app.services.roadmap_service import generate_roadmap

    stmt = select(Case).where(Case.id == body.case_id, Case.user_id == current_user.id)
    case = (await db.execute(stmt)).scalars().first()
    if case is None:
        raise HTTPException(status_code=404, detail="Fall nicht gefunden.")

    steps = await generate_roadmap(case, db)

    # Format as readable Markdown
    lines = [f"# Rechtlicher Aktionsplan für: {case.title}\n"]
    for step in steps:
        priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(
            step.get("priority", "medium"), "⚪"
        )
        lines.append(
            f"## Schritt {step['step_number']}: {step['title']} {priority_emoji}\n"
            f"{step['description']}\n"
        )
        if step.get("action_items"):
            lines.append("**Maßnahmen:**")
            for action in step["action_items"]:
                lines.append(f"- {action}")
            lines.append("")
        if step.get("deadline_days"):
            lines.append(f"**Frist:** {step['deadline_days']} Tage\n")

    content = "\n".join(lines)

    conv = Conversation(
        user_id=current_user.id,
        case_id=body.case_id,
        conversation_type="roadmap_generator",
        title=f"Aktionsplan: {case.title}",
    )
    db.add(conv)
    await db.flush()

    msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=content,
        citations=[],
        metadata_={"steps_count": len(steps)},
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)

    return MessageResponse.model_validate(msg)


@router.post("/counterargument", response_model=MessageResponse, status_code=201)
async def analyze_counterargument(
    body: CounterargumentRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Analyse opponent claims and return counterarguments as a chat message."""
    from app.services.counterargument_service import analyze_opponent_claims

    stmt = select(Case).where(Case.id == body.case_id, Case.user_id == current_user.id)
    case = (await db.execute(stmt)).scalars().first()
    if case is None:
        raise HTTPException(status_code=404, detail="Fall nicht gefunden.")

    case_context = f"Falltyp: {case.case_type}\nTitel: {case.title}"
    if case.description:
        case_context += f"\nBeschreibung: {case.description}"
    if body.context:
        case_context += f"\n{body.context}"

    analysis = await analyze_opponent_claims(
        claims=body.opponent_claims,
        case_context=case_context,
        db=db,
    )

    # Format as Markdown
    lines = ["# Gegenargumentationsanalyse\n"]
    if analysis.get("weaknesses"):
        lines.append("## Schwächen der Gegenseite")
        for w in analysis["weaknesses"]:
            lines.append(f"- {w}")
        lines.append("")
    if analysis.get("contradictions"):
        lines.append("## Widersprüche")
        for c in analysis["contradictions"]:
            lines.append(f"- {c}")
        lines.append("")
    if analysis.get("suggested_rebuttals"):
        lines.append("## Empfohlene Gegenargumente")
        for r in analysis["suggested_rebuttals"]:
            lines.append(f"- {r}")
        lines.append("")
    if analysis.get("legal_defenses"):
        lines.append("## Rechtliche Verteidigungsstrategien")
        for d in analysis["legal_defenses"]:
            lines.append(f"- {d}")
        lines.append("")
    if analysis.get("questions_for_witness"):
        lines.append("## Kreuzfragen")
        for q in analysis["questions_for_witness"]:
            lines.append(f"- {q}")

    content = "\n".join(lines)

    conv = Conversation(
        user_id=current_user.id,
        case_id=body.case_id,
        conversation_type="counterargument",
        title="Gegenargumentationsanalyse",
    )
    db.add(conv)
    await db.flush()

    msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=content,
        citations=[],
        metadata_={"analysis_keys": list(analysis.keys())},
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)

    return MessageResponse.model_validate(msg)


@router.post("/analyze-document", response_model=MessageResponse, status_code=201)
async def analyze_document_chat(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    document_text: str = Query(..., min_length=1),
    doc_type: str = Query("other"),
    case_id: uuid.UUID | None = Query(None),
) -> MessageResponse:
    """Analyze provided document text and return AI analysis as a chat message."""
    from app.services.document_service import analyze_document_with_ai

    case_context: str | None = None
    if case_id:
        case_context = await _get_case_context(case_id, current_user.id, db)

    analysis = await analyze_document_with_ai(
        text=document_text,
        doc_type=doc_type,
        case_context=case_context,
    )

    # Format analysis as readable Markdown
    lines = [f"# Dokumentanalyse ({doc_type})\n"]
    if analysis.get("summary"):
        lines.append(f"## Zusammenfassung\n{analysis['summary']}\n")
    if analysis.get("key_dates"):
        lines.append("## Wichtige Daten")
        for d in analysis["key_dates"]:
            if isinstance(d, dict):
                lines.append(f"- **{d.get('date', '')}**: {d.get('significance', '')}")
            else:
                lines.append(f"- {d}")
        lines.append("")
    if analysis.get("key_persons"):
        lines.append("## Beteiligte Personen / Institutionen")
        for p in analysis["key_persons"]:
            if isinstance(p, dict):
                lines.append(f"- **{p.get('name', '')}** ({p.get('role', '')})")
            else:
                lines.append(f"- {p}")
        lines.append("")
    if analysis.get("legal_implications"):
        lines.append(f"## Rechtliche Bedeutung\n{analysis['legal_implications']}\n")
    if analysis.get("action_required"):
        lines.append(f"## Erforderliche Maßnahmen\n{analysis['action_required']}\n")
    urgency = analysis.get("urgency", "medium")
    urgency_label = {"low": "Niedrig", "medium": "Mittel", "high": "Hoch", "critical": "Kritisch"}.get(urgency, urgency)
    lines.append(f"**Dringlichkeit:** {urgency_label}")

    content = "\n".join(lines)

    conv = Conversation(
        user_id=current_user.id,
        case_id=case_id,
        conversation_type="document_analysis",
        title=f"Dokumentanalyse: {doc_type}",
    )
    db.add(conv)
    await db.flush()

    msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=content,
        citations=[],
        metadata_={"doc_type": doc_type, "urgency": urgency},
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)

    return MessageResponse.model_validate(msg)
