"""
Documents router – file upload, processing, and retrieval.
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import Annotated

import aiofiles
import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import CurrentUser
from app.config import settings
from app.database import get_db, AsyncSessionLocal
from app.models.evidence import Document
from app.schemas.case import DocumentResponse
from app.services.document_service import get_safe_filename, process_uploaded_document

log = structlog.get_logger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

# ---------------------------------------------------------------------------
# Allowed MIME types / extensions
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "image/jpeg",
    "image/png",
    "image/tiff",
    "text/plain",
}

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".txt"}


# ---------------------------------------------------------------------------
# Background processing helper (runs in its own session)
# ---------------------------------------------------------------------------


async def _background_process(document_id: uuid.UUID) -> None:
    """Process a document in the background using a fresh DB session."""
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(Document).where(Document.id == document_id)
            doc = (await db.execute(stmt)).scalars().first()
            if doc is None:
                log.warning("background_process.not_found", document_id=str(document_id))
                return
            await process_uploaded_document(doc, db)
            await db.commit()
            log.info("background_process.done", document_id=str(document_id))
        except Exception as exc:
            log.error("background_process.failed", document_id=str(document_id), error=str(exc))
            await db.rollback()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Dokument hochladen und verarbeiten",
)
async def upload_document(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    case_id: uuid.UUID | None = Query(None, description="Optional: case to attach to"),
    document_category: str = Query(
        "other",
        description="police_report|court_letter|contract|id_document|medical|financial|correspondence|other",
    ),
) -> DocumentResponse:
    # Validate file
    if file.filename is None:
        raise HTTPException(status_code=400, detail="Kein Dateiname angegeben.")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Dateityp nicht unterstützt. Erlaubt: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content_type = file.content_type or "application/octet-stream"

    # Read file content and check size
    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Datei zu groß. Maximum: {settings.MAX_FILE_SIZE}",
        )

    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate safe filename and save
    safe_name = get_safe_filename(file.filename)
    file_path = upload_dir / safe_name

    async with aiofiles.open(str(file_path), "wb") as f:
        await f.write(content)

    log.info("upload_document.saved", filename=safe_name, size=len(content))

    # Create DB record
    doc = Document(
        case_id=case_id,
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=safe_name,
        file_path=str(file_path),
        mime_type=content_type,
        file_size=len(content),
        document_category=document_category,
        processing_status="pending",
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)

    # Trigger background processing
    background_tasks.add_task(_background_process, doc.id)

    log.info("upload_document.done", doc_id=str(doc.id))
    return DocumentResponse.model_validate(doc)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentResponse:
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id,
    )
    doc = (await db.execute(stmt)).scalars().first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden.")
    return DocumentResponse.model_validate(doc)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    case_id: uuid.UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[DocumentResponse]:
    stmt = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if case_id is not None:
        stmt = stmt.where(Document.case_id == case_id)

    docs = (await db.execute(stmt)).scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_document(
    document_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id,
    )
    doc = (await db.execute(stmt)).scalars().first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden.")

    # Delete physical file
    try:
        if doc.file_path and os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except OSError as exc:
        log.warning("delete_document.file_remove_failed", error=str(exc))

    await db.delete(doc)
    await db.flush()
    log.info("delete_document.done", document_id=str(document_id))


@router.post("/{document_id}/reanalyze", response_model=DocumentResponse)
async def reanalyze_document(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentResponse:
    """Re-trigger AI analysis for an existing document."""
    stmt = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id,
    )
    doc = (await db.execute(stmt)).scalars().first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden.")

    doc.processing_status = "pending"
    await db.flush()
    await db.refresh(doc)

    background_tasks.add_task(_background_process, doc.id)
    log.info("reanalyze_document.queued", document_id=str(document_id))
    return DocumentResponse.model_validate(doc)
