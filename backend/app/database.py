from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,           # set True for SQL debug logging
    pool_pre_ping=True,   # recycle stale connections
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ---------------------------------------------------------------------------
# Declarative base (shared by all models)
# ---------------------------------------------------------------------------


class Base(DeclarativeBase):
    """All ORM models inherit from this base."""


# ---------------------------------------------------------------------------
# Database initialisation
# ---------------------------------------------------------------------------


async def init_db() -> None:
    """Create the pgvector extension and all tables on startup.

    This is intentionally idempotent: CREATE EXTENSION IF NOT EXISTS and
    CREATE TABLE IF NOT EXISTS are both safe to call multiple times.
    """
    async with engine.begin() as conn:
        # pgvector must exist before any table with a Vector column is created.
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        logger.info("pgvector extension verified / created.")

        # Import all models so that Base.metadata is fully populated before
        # create_all is called.
        import app.models  # noqa: F401 – side-effect import

        await conn.run_sync(Base.metadata.create_all)
        logger.info("All database tables created / verified.")


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session, rolling back on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
