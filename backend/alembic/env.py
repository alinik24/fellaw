"""
Alembic environment configuration (async edition).

Key behaviours:
- DATABASE_URL is read from the environment variable of the same name, which
  allows the same script to work locally (pointing at localhost) and inside
  Docker (pointing at the 'postgres' service hostname).
- All SQLAlchemy models are imported here so that autogenerate can detect
  schema changes automatically.
- Migrations are run via an async engine (asyncpg driver) using asyncio.run().
"""

import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ---------------------------------------------------------------------------
# Alembic Config object (gives access to values in alembic.ini)
# ---------------------------------------------------------------------------
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Override sqlalchemy.url with the DATABASE_URL environment variable.
# This is the single source of truth for the database connection string.
# ---------------------------------------------------------------------------
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Set it in your .env file or export it before running alembic."
    )
config.set_main_option("sqlalchemy.url", database_url)

# ---------------------------------------------------------------------------
# Import all models so that autogenerate can detect the full schema.
# Add any new model modules here as the application grows.
# ---------------------------------------------------------------------------
# pylint: disable=wrong-import-position
from app.database import Base  # noqa: E402  (Base carries the metadata)

# Import every model module so their Table objects register on Base.metadata.
import app.models  # noqa: E402, F401  (side-effect: registers all ORM models)

target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Offline migrations (generate SQL without a live DB connection)
# ---------------------------------------------------------------------------


def run_migrations_offline() -> None:
    """Emit migration SQL to stdout without connecting to the database."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online migrations (connect to the live DB and apply changes)
# ---------------------------------------------------------------------------


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations inside a sync callback."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online migrations — wraps the async runner."""
    asyncio.run(run_async_migrations())


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
