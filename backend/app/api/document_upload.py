"""
Document Upload and Processing API
Handles file uploads, document analysis, and extraction
"""

import os
import uuid
import logging
from pathlib import Path
from typing import Annotated, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user, get_current_user_optional
from app.services.document_intelligence import get_document_intelligence_service
from app.services.openrouter_vision import get_openrouter_vision_service
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["Document Upload"])

# Configuration
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    # Documents
    ".pdf", ".doc", ".docx", ".txt", ".rtf",
    # Images
    ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif",
    # Other
    ".eml", ".msg"
}


class DocumentAnalysisResponse(BaseModel):
    """Response model for document analysis"""
    file_id: str
    filename: str
    file_type: str
    file_size: int
    analysis_complete: bool
    extracted_text: str
    key_value_pairs: list
    tables: list
    entities: list
    metadata: dict


@router.post("/document", response_model=DocumentAnalysisResponse)
async def upload_and_analyze_document(
    file: UploadFile = File(...),
    analyze: bool = True,
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
):
    """
    Upload a document and optionally analyze it with AI

    Args:
        file: The uploaded file
        analyze: Whether to run AI analysis on the document
        current_user: Optional authenticated user
        db: Database session

    Returns:
        Document analysis results
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )

        # Check file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read and validate file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        # Generate unique file ID and save file
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename

        with open(file_path, "wb") as f:
            f.write(contents)

        logger.info(f"File uploaded successfully: {file.filename} -> {safe_filename}")

        # Initialize response
        response = {
            "file_id": file_id,
            "filename": file.filename,
            "file_type": file_ext,
            "file_size": len(contents),
            "analysis_complete": False,
            "extracted_text": "",
            "key_value_pairs": [],
            "tables": [],
            "entities": [],
            "metadata": {}
        }

        # Perform AI analysis if requested
        if analyze:
            analysis_result = None
            service_used = None

            # Try OpenRouter first for images (best for vision tasks)
            if file_ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".gif", ".webp"]:
                try:
                    openrouter_service = get_openrouter_vision_service()

                    if "invoice" in file.filename.lower() or "rechnung" in file.filename.lower():
                        analysis_result = await openrouter_service.analyze_invoice(str(file_path))
                    else:
                        analysis_result = await openrouter_service.analyze_document_image(str(file_path))

                    service_used = "openrouter"
                    logger.info(f"Image analyzed with OpenRouter: {file.filename}")
                except ValueError as e:
                    logger.warning(f"OpenRouter not available: {str(e)}")
                except Exception as e:
                    logger.error(f"OpenRouter analysis failed: {str(e)}")

            # Fallback to Azure Document Intelligence if OpenRouter failed or for PDFs
            if not analysis_result:
                try:
                    doc_intel_service = get_document_intelligence_service()

                    # Determine analysis type based on file extension
                    if file_ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"]:
                        analysis_result = await doc_intel_service.analyze_image(str(file_path))
                    elif "invoice" in file.filename.lower() or "rechnung" in file.filename.lower():
                        analysis_result = await doc_intel_service.analyze_invoice(str(file_path))
                    elif "receipt" in file.filename.lower() or "quittung" in file.filename.lower():
                        analysis_result = await doc_intel_service.analyze_receipt(str(file_path))
                    else:
                        analysis_result = await doc_intel_service.analyze_legal_document(str(file_path))

                    service_used = "azure"
                    logger.info(f"Document analyzed with Azure: {file.filename}")
                except ValueError as e:
                    logger.warning(f"Azure Document Intelligence not available: {str(e)}")
                except Exception as e:
                    logger.error(f"Azure analysis failed: {str(e)}")

            # Process results if we got any
            if analysis_result:
                # Update response with analysis results
                response.update({
                    "analysis_complete": True,
                    "extracted_text": analysis_result.get("text", "") or analysis_result.get("full_text", "") or analysis_result.get("extracted_text", ""),
                    "key_value_pairs": analysis_result.get("key_value_pairs", []) or analysis_result.get("key_fields", []),
                    "tables": analysis_result.get("tables", []),
                    "entities": analysis_result.get("entities", []),
                    "metadata": {
                        **analysis_result.get("metadata", {}),
                        "service_used": service_used
                    }
                })

                logger.info(f"Document analysis completed for {file.filename} using {service_used}")
            else:
                # No analysis service available
                response["metadata"]["warning"] = "AI analysis not available - no service configured (set OPENROUTER_API_KEY or DOCINTEL_API_KEY)"

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    extract_text: bool = True,
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None
):
    """
    Upload an image and extract text via OCR

    Args:
        file: The uploaded image file
        extract_text: Whether to extract text from the image
        current_user: Optional authenticated user

    Returns:
        Image upload result with OCR text
    """
    try:
        # Validate image file
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format. Allowed: JPG, PNG, BMP, TIFF"
            )

        # Read file
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        # Save file
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename

        with open(file_path, "wb") as f:
            f.write(contents)

        result = {
            "file_id": file_id,
            "filename": file.filename,
            "file_size": len(contents),
            "extracted_text": ""
        }

        # Extract text if requested
        if extract_text:
            try:
                doc_intel_service = get_document_intelligence_service()
                analysis = await doc_intel_service.analyze_image(str(file_path))
                result["extracted_text"] = analysis.get("text", "")
                result["metadata"] = analysis.get("metadata", {})
            except ValueError:
                result["warning"] = "OCR not available - service not configured"
            except Exception as e:
                logger.error(f"OCR failed for {file.filename}: {str(e)}")
                result["error"] = str(e)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None
):
    """
    Upload an audio file (for future speech-to-text processing)

    Args:
        file: The uploaded audio file
        current_user: Optional authenticated user

    Returns:
        Audio upload result
    """
    try:
        # Validate audio file
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in [".mp3", ".wav", ".m4a", ".ogg", ".webm"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid audio format. Allowed: MP3, WAV, M4A, OGG, WEBM"
            )

        # Read file
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {MAX_FILE_SIZE / 1024 / 1024}MB"
            )

        # Save file
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename

        with open(file_path, "wb") as f:
            f.write(contents)

        return {
            "file_id": file_id,
            "filename": file.filename,
            "file_size": len(contents),
            "note": "Audio file uploaded successfully. Speech-to-text processing will be added in future updates."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/file/{file_id}")
async def delete_uploaded_file(
    file_id: str,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Delete an uploaded file

    Args:
        file_id: The file ID to delete
        current_user: Authenticated user

    Returns:
        Deletion confirmation
    """
    try:
        # Find file with this ID
        found = False
        for file_path in UPLOAD_DIR.glob(f"{file_id}*"):
            file_path.unlink()
            found = True
            logger.info(f"Deleted file: {file_path}")

        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        return {"message": "File deleted successfully", "file_id": file_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
