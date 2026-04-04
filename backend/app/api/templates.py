"""Self-service document templates API."""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from jinja2 import Template
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.templates import DocumentTemplate, GeneratedDocument
from app.models.user import User
from app.schemas.templates import (
    DocumentTemplateResponse,
    GenerateDocumentRequest,
    GeneratedDocumentResponse,
)

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[DocumentTemplateResponse])
async def list_templates(
    db: Annotated[AsyncSession, Depends(get_db)],
    category: str | None = None,
    document_type: str | None = None,
    language: str = "de",
    skip: int = 0,
    limit: int = 50,
):
    """List available document templates."""
    query = select(DocumentTemplate).where(
        DocumentTemplate.is_active == True,
        DocumentTemplate.language == language,
    )

    if category:
        query = query.where(DocumentTemplate.category == category)
    if document_type:
        query = query.where(DocumentTemplate.document_type == document_type)

    result = await db.execute(
        query.order_by(DocumentTemplate.usage_count.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{template_id}", response_model=DocumentTemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get template details including required fields."""
    result = await db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    return template


@router.post("/generate", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
async def generate_document(
    data: GenerateDocumentRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Generate a document from a template."""
    # Get template
    template_result = await db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == data.template_id)
    )
    template = template_result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    # Validate required fields
    if template.required_fields:
        for field in template.required_fields:
            if field.get("required") and field["name"] not in data.template_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field['name']}",
                )

    # Generate document
    try:
        jinja_template = Template(template.template_content)
        rendered_content = jinja_template.render(**data.template_data)
    except Exception as e:
        log.error("template_render_failed", error=str(e), template_id=str(template.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate document",
        )

    # Save generated document
    file_name = f"{template.document_type}_{current_user.id}_{uuid.uuid4()}.{template.output_format}"
    file_path = Path(settings.UPLOAD_DIR) / "generated" / file_name

    # Create directory if not exists
    file_path.parent.mkdir(parents=True, exist_ok=True)

    # Write content to file
    file_path.write_text(rendered_content, encoding="utf-8")

    file_url = f"/uploads/generated/{file_name}"
    file_size = file_path.stat().st_size

    # Save to database
    generated_doc = GeneratedDocument(
        user_id=current_user.id,
        template_id=template.id,
        template_data=data.template_data,
        file_url=file_url,
        file_name=file_name,
        file_size=file_size,
        case_id=data.case_id,
        status="ready",
    )

    db.add(generated_doc)

    # Update template usage count
    template.usage_count += 1

    await db.commit()
    await db.refresh(generated_doc)

    log.info(
        "document_generated",
        doc_id=str(generated_doc.id),
        template_id=str(template.id),
        user_id=str(current_user.id),
    )

    return generated_doc


@router.get("/generated/my-documents", response_model=list[GeneratedDocumentResponse])
async def list_my_generated_documents(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 50,
):
    """List user's generated documents."""
    result = await db.execute(
        select(GeneratedDocument)
        .where(GeneratedDocument.user_id == current_user.id)
        .order_by(GeneratedDocument.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/generated/{doc_id}", response_model=GeneratedDocumentResponse)
async def get_generated_document(
    doc_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get generated document details."""
    result = await db.execute(
        select(GeneratedDocument).where(
            GeneratedDocument.id == doc_id,
            GeneratedDocument.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Track download
    doc.download_count += 1
    doc.last_downloaded_at = func.now()
    await db.commit()

    return doc


@router.get("/categories", response_model=list[str])
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all template categories."""
    result = await db.execute(
        select(DocumentTemplate.category)
        .where(DocumentTemplate.is_active == True)
        .distinct()
    )
    return result.scalars().all()
