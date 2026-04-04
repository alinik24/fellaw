"""
fellaw – FastAPI application entry point.

Initialises the app, registers middleware, mounts routers, and configures
startup/shutdown lifecycle events.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import structlog
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings

# ---------------------------------------------------------------------------
# Structured logging configuration
# ---------------------------------------------------------------------------

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown logic."""
    log.info("startup.begin", app=settings.APP_NAME, version=settings.APP_VERSION)

    # 1. Create upload directory
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    log.info("startup.uploads_dir", path=str(upload_path.resolve()))

    # 2. Initialise database (create tables, pgvector extension)
    try:
        from app.database import init_db
        await init_db()
        log.info("startup.db_init_done")
    except Exception as exc:
        log.error("startup.db_init_failed", error=str(exc))
        # Don't crash; let the health endpoint report the DB status

    # 3. Knowledge base status check (ingestion done via scripts/preload_db.py)
    try:
        from app.database import AsyncSessionLocal
        from app.models.law_document import LawDocument
        from sqlalchemy import func, select
        async with AsyncSessionLocal() as db:
            law_count = (await db.execute(select(func.count(LawDocument.id)))).scalar_one()
        log.info("startup.knowledge_base", law_documents=law_count,
                 hint="Run 'python scripts/preload_db.py --all' to populate" if law_count == 0 else "")
    except Exception as exc:
        log.warning("startup.knowledge_base_check_failed", error=str(exc))

    log.info("startup.complete")
    yield

    # Shutdown
    log.info("shutdown.begin")


# ---------------------------------------------------------------------------
# FastAPI app factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="fellaw API",
    description=(
        "AI-powered German legal assistance system. "
        "Provides RAG-based legal information, case management, "
        "narrative generation, and counterargument analysis."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from app.api.auth import router as auth_router
from app.api.cases import router as cases_router
from app.api.careers import router as careers_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.document_upload import router as document_upload_router
from app.api.emergency import router as emergency_router
from app.api.evidence import router as evidence_router
from app.api.insurance import router as insurance_router
from app.api.laws import router as laws_router
from app.api.mediation import router as mediation_router
from app.api.notifications import router as notifications_router
from app.api.professionals import router as professionals_router
from app.api.referrals import router as referrals_router
from app.api.templates import router as templates_router

_API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=_API_PREFIX)
app.include_router(cases_router, prefix=_API_PREFIX)
app.include_router(evidence_router, prefix=_API_PREFIX)
app.include_router(documents_router, prefix=_API_PREFIX)
app.include_router(document_upload_router, prefix=_API_PREFIX)
app.include_router(chat_router, prefix=_API_PREFIX)
app.include_router(laws_router, prefix=_API_PREFIX)
app.include_router(professionals_router, prefix=_API_PREFIX)
app.include_router(referrals_router, prefix=_API_PREFIX)
app.include_router(emergency_router, prefix=_API_PREFIX)
app.include_router(insurance_router, prefix=_API_PREFIX)
app.include_router(mediation_router, prefix=_API_PREFIX)
app.include_router(careers_router, prefix=_API_PREFIX)
app.include_router(templates_router, prefix=_API_PREFIX)
app.include_router(notifications_router, prefix=_API_PREFIX)

# ---------------------------------------------------------------------------
# Static files – serve uploaded documents
# ---------------------------------------------------------------------------

_upload_dir = Path(settings.UPLOAD_DIR)
_upload_dir.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=str(_upload_dir)),
    name="uploads",
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    log.warning(
        "http_exception",
        path=request.url.path,
        status_code=exc.status_code,
        detail=exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers or {},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.error(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Interner Serverfehler. Bitte versuchen Sie es später erneut."},
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, Any]:
    """
    Basic health check endpoint.

    Returns application version and database connectivity status.
    """
    db_status = "connected"
    try:
        from app.database import engine
        from sqlalchemy import text

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"error: {exc}"
        log.error("health_check.db_error", error=str(exc))

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "version": settings.APP_VERSION,
        "app": settings.APP_NAME,
        "db": db_status,
    }


@app.get("/", tags=["system"])
async def root() -> dict[str, str]:
    return {
        "message": f"Willkommen bei {settings.APP_NAME}",
        "docs": "/api/docs",
        "health": "/health",
        "version": settings.APP_VERSION,
    }
