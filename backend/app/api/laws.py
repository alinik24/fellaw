"""
Laws router – semantic search in the German law database and admin ingestion.
"""
from __future__ import annotations

import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser
from app.database import get_db
from app.models.law_document import LawDocument
from app.schemas.chat import LawDocumentResponse, LawSearchRequest

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/laws", tags=["laws"])

# ---------------------------------------------------------------------------
# In-memory ingestion status tracker (simple – not persistent across restarts)
# ---------------------------------------------------------------------------

_ingestion_status: dict[str, str] = {
    "status": "idle",  # idle | running | completed | failed
    "message": "",
    "ingested": 0,
}


async def _run_ingestion(law_codes: list[str] | None) -> None:
    """Background task that runs the full ingestion pipeline."""
    from app.database import AsyncSessionLocal
    from app.services.scraper.gesetze_scraper import ingest_laws_to_db

    _ingestion_status["status"] = "running"
    _ingestion_status["message"] = f"Ingesting {law_codes or 'all priority laws'}…"

    try:
        async with AsyncSessionLocal() as db:
            await ingest_laws_to_db(db, law_codes)
            await db.commit()
        _ingestion_status["status"] = "completed"
        _ingestion_status["message"] = "Ingestion completed successfully."
        log.info("ingest.completed")
    except Exception as exc:
        _ingestion_status["status"] = "failed"
        _ingestion_status["message"] = str(exc)
        log.error("ingest.failed", error=str(exc))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/search", response_model=list[LawDocumentResponse])
async def search_laws(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, description="Search query"),
    law_codes: list[str] = Query(
        default=[],
        description="Filter by law codes, e.g. BGB,StGB",
    ),
    limit: int = Query(5, ge=1, le=50),
) -> list[LawDocumentResponse]:
    from app.services.rag_service import search_laws as svc_search

    results = await svc_search(
        query=q,
        law_codes=law_codes if law_codes else None,
        limit=limit,
        db=db,
    )

    return [
        LawDocumentResponse(
            id=uuid.UUID(r["id"]) if isinstance(r["id"], str) else r["id"],
            title=r["title"],
            law_code=r["law_code"],
            section=r.get("section"),
            content=r["content"],
            url=r.get("url"),
            relevance_score=r.get("relevance_score", 0.0),
        )
        for r in results
    ]


@router.get("/codes", response_model=list[dict])
async def list_law_codes(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[dict]:
    """List all available law codes with document counts."""
    stmt = (
        select(LawDocument.law_code, func.count(LawDocument.id).label("count"))
        .where(LawDocument.is_active == True)  # noqa: E712
        .group_by(LawDocument.law_code)
        .order_by(LawDocument.law_code)
    )
    rows = (await db.execute(stmt)).fetchall()
    return [{"law_code": row.law_code, "count": row.count} for row in rows]


@router.get("/ingest/status")
async def get_ingestion_status(current_user: CurrentUser) -> dict:
    """Check the current status of the law ingestion process."""
    return _ingestion_status.copy()


@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def trigger_ingestion(
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    law_codes: list[str] = Query(
        default=[],
        description="Specific law codes to ingest. Empty = all priority laws.",
    ),
) -> dict:
    """
    Admin endpoint: trigger scraping and ingestion of German law texts.
    Returns immediately; ingestion runs in the background.
    """
    if _ingestion_status["status"] == "running":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ingestion läuft bereits.",
        )

    codes = law_codes if law_codes else None
    _ingestion_status["status"] = "queued"
    _ingestion_status["message"] = "Starting ingestion…"

    background_tasks.add_task(_run_ingestion, codes)
    log.info("ingest.triggered", law_codes=codes)

    return {
        "message": "Ingestion gestartet.",
        "law_codes": codes,
        "status_url": "/api/v1/laws/ingest/status",
    }


@router.get("/{law_id}", response_model=LawDocumentResponse)
async def get_law_document(
    law_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LawDocumentResponse:
    stmt = select(LawDocument).where(
        LawDocument.id == law_id, LawDocument.is_active == True  # noqa: E712
    )
    doc = (await db.execute(stmt)).scalars().first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Rechtsdokument nicht gefunden.")
    return LawDocumentResponse(
        id=doc.id,
        title=doc.title,
        law_code=doc.law_code,
        section=doc.section,
        content=doc.content,
        url=doc.url,
        relevance_score=0.0,
    )
