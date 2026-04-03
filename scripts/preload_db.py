#!/usr/bin/env python3
"""
LegalAssist Nexus ? Database Preload Script
==========================================
Run ONCE before launching the app to populate the knowledge base with German
law documents (scraped from gesetze-im-internet.de) and forum posts (scraped
from Reddit, Gutefrage, Anwalt.de, and legal forums).

This script is STANDALONE ? it does NOT rely on the FastAPI application being
running. It creates its own DB connection and exits cleanly when done.

Usage
-----
    python scripts/preload_db.py [options]

Options
-------
    --all               Run law ingestion AND forum ingestion (recommended first run)
    --laws              Ingest law documents only
    --forums            Ingest forum posts only
    --law-codes CODE ...  Specific law codes to ingest (e.g. StGB BGB StPO)
    --sources SRC ...     Forum sources: reddit gutefrage anwalt_de rechtsforum jura_forum
    --force-reload      Re-ingest even if records already exist (skips dedup check)
    --status            Print current DB counts and exit

Examples
--------
    python scripts/preload_db.py --all
    python scripts/preload_db.py --laws --law-codes StGB BGB StPO ZPO
    python scripts/preload_db.py --forums --sources reddit gutefrage
    python scripts/preload_db.py --status

Exit codes
----------
    0   Success
    1   Error (DB unreachable, import failure, etc.)
"""
from __future__ import annotations

import argparse
import asyncio
import os
import sys
import time
from pathlib import Path

# Force UTF-8 stdout/stderr on Windows to avoid cp1252 encoding errors
# (Rich spinners use braille characters that cp1252 cannot encode)
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ---------------------------------------------------------------------------
# Path setup ? must happen before any app imports
# ---------------------------------------------------------------------------

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_DIR = _PROJECT_ROOT / "backend"

# Insert backend/ at the front of sys.path so that `from app.xxx import ...`
# resolves correctly without installing the package.
sys.path.insert(0, str(_BACKEND_DIR))

# ---------------------------------------------------------------------------
# .env loading ? load from project root before importing settings
# ---------------------------------------------------------------------------

from dotenv import load_dotenv  # noqa: E402  (after sys.path setup)

_ENV_FILE = _PROJECT_ROOT / ".env"
if _ENV_FILE.exists():
    load_dotenv(_ENV_FILE)
else:
    # Fallback: look for .env next to this script or in cwd
    load_dotenv()

# ---------------------------------------------------------------------------
# App imports (after path + env setup)
# ---------------------------------------------------------------------------

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import (
        BarColumn,
        MofNCompleteColumn,
        Progress,
        SpinnerColumn,
        TaskProgressColumn,
        TextColumn,
        TimeElapsedColumn,
    )
    from rich.table import Table
    from rich import print as rprint

    _RICH = True
except ImportError:
    _RICH = False

# ---------------------------------------------------------------------------
# PRIORITY_LAWS default (mirrors gesetze_scraper.PRIORITY_LAWS)
# ---------------------------------------------------------------------------

DEFAULT_PRIORITY_LAWS: list[str] = [
    "StGB",
    "BGB",
    "StPO",
    "ZPO",
    "VwGO",
    "AGG",
    "SGB2",
    "AufenthG",
    "AsylG",
    "WoGG",
    "BtMG",
]

ALL_FORUM_SOURCES: list[str] = [
    "reddit",
    "gutefrage",
    "anwalt_de",
    "rechtsforum",
    "jura_forum",
]

# ---------------------------------------------------------------------------
# Console helpers
# ---------------------------------------------------------------------------


def _make_console() -> "Console | None":
    if _RICH:
        # Use sys.stdout (already UTF-8 wrapped on Windows above)
        # legacy_windows=False disables the Win32 console API path that ignores our wrapper
        return Console(
            file=sys.stdout,
            highlight=False,
            emoji=False,
            markup=True,
            legacy_windows=False,
            force_terminal=False,
        )
    return None


_console = _make_console()


def _info(msg: str) -> None:
    if _RICH and _console:
        _console.print(f"[bold cyan]i[/bold cyan]  {msg}")
    else:
        print(f"[INFO]  {msg}")


def _success(msg: str) -> None:
    if _RICH and _console:
        _console.print(f"[bold green]OK[/bold green]  {msg}")
    else:
        print(f"[OK]    {msg}")


def _warn(msg: str) -> None:
    if _RICH and _console:
        _console.print(f"[bold yellow]WARN[/bold yellow]  {msg}")
    else:
        print(f"[WARN]  {msg}", file=sys.stderr)


def _error(msg: str) -> None:
    if _RICH and _console:
        _console.print(f"[bold red]ERR[/bold red]  {msg}")
    else:
        print(f"[ERR]   {msg}", file=sys.stderr)


def _banner() -> None:
    if _RICH and _console:
        _console.print(
            Panel.fit(
                "[bold white]LegalAssist Nexus[/bold white] ? Database Preload\n"
                "[dim]Populates law documents and forum posts for the RAG knowledge base[/dim]",
                border_style="blue",
            )
        )
    else:
        print("=" * 60)
        print("  LegalAssist Nexus ? Database Preload")
        print("=" * 60)


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="preload_db.py",
        description=(
            "Populate the LegalAssist Nexus knowledge base with German law "
            "documents and/or forum posts."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    action_group = parser.add_argument_group("Actions (pick at least one)")
    action_group.add_argument(
        "--all",
        action="store_true",
        help="Ingest law documents AND forum posts",
    )
    action_group.add_argument(
        "--laws",
        action="store_true",
        help="Ingest law documents (gesetze-im-internet.de)",
    )
    action_group.add_argument(
        "--forums",
        action="store_true",
        help="Ingest forum posts (Reddit, Gutefrage, Anwalt.de, ...)",
    )
    action_group.add_argument(
        "--status",
        action="store_true",
        help="Show current DB counts and exit without ingesting anything",
    )

    filter_group = parser.add_argument_group("Filters")
    filter_group.add_argument(
        "--law-codes",
        nargs="+",
        metavar="CODE",
        default=None,
        help=(
            f"Law codes to ingest (default: all priority laws). "
            f"Example: --law-codes StGB BGB StPO"
        ),
    )
    filter_group.add_argument(
        "--sources",
        nargs="+",
        metavar="SRC",
        choices=ALL_FORUM_SOURCES,
        default=None,
        help=(
            "Forum sources to scrape (default: all). "
            "Choices: " + " ".join(ALL_FORUM_SOURCES)
        ),
    )
    filter_group.add_argument(
        "--force-reload",
        action="store_true",
        help="Delete existing records and re-ingest (use with caution)",
    )

    args = parser.parse_args()

    # Validate: at least one action required
    if not any([args.all, args.laws, args.forums, args.status]):
        parser.error(
            "No action specified. Use --all, --laws, --forums, or --status."
        )

    return args


# ---------------------------------------------------------------------------
# Status display
# ---------------------------------------------------------------------------


async def print_status(db) -> None:
    """Print per-law-code and per-forum-source document counts."""
    from sqlalchemy import func, select, text

    from app.models.law_document import LawDocument
    from app.models.forum_post import ForumPost

    _info("Fetching database status ...")

    # Law documents by law_code
    law_rows = (
        await db.execute(
            select(LawDocument.law_code, func.count(LawDocument.id).label("cnt"))
            .group_by(LawDocument.law_code)
            .order_by(LawDocument.law_code)
        )
    ).fetchall()

    # Forum posts by source
    forum_rows = (
        await db.execute(
            select(ForumPost.source, func.count(ForumPost.id).label("cnt"))
            .group_by(ForumPost.source)
            .order_by(ForumPost.source)
        )
    ).fetchall()

    if _RICH and _console:
        # Law documents table
        law_table = Table(title="Law Documents", show_header=True, header_style="bold blue")
        law_table.add_column("Law Code", style="cyan")
        law_table.add_column("Sections", justify="right")
        total_law = 0
        for row in law_rows:
            law_table.add_row(row.law_code, str(row.cnt))
            total_law += row.cnt
        law_table.add_section()
        law_table.add_row("[bold]TOTAL[/bold]", f"[bold]{total_law}[/bold]")
        _console.print(law_table)

        # Forum posts table
        forum_table = Table(title="Forum Posts", show_header=True, header_style="bold blue")
        forum_table.add_column("Source", style="cyan")
        forum_table.add_column("Posts", justify="right")
        total_forum = 0
        for row in forum_rows:
            forum_table.add_row(row.source, str(row.cnt))
            total_forum += row.cnt
        forum_table.add_section()
        forum_table.add_row("[bold]TOTAL[/bold]", f"[bold]{total_forum}[/bold]")
        _console.print(forum_table)

        if total_law == 0 and total_forum == 0:
            _warn("Knowledge base is empty. Run: python scripts/preload_db.py --all")
        else:
            _success(
                f"Knowledge base: {total_law} law sections, {total_forum} forum posts"
            )
    else:
        print("\n--- Law Documents ---")
        for row in law_rows:
            print(f"  {row.law_code}: {row.cnt} sections")
        if not law_rows:
            print("  (empty)")

        print("\n--- Forum Posts ---")
        for row in forum_rows:
            print(f"  {row.source}: {row.cnt} posts")
        if not forum_rows:
            print("  (empty)")


# ---------------------------------------------------------------------------
# Force-reload helpers
# ---------------------------------------------------------------------------


async def _delete_law_docs(db, law_codes: list[str]) -> int:
    """Delete existing law_documents for the given law codes. Returns deleted count."""
    from sqlalchemy import delete as sql_delete
    from app.models.law_document import LawDocument

    result = await db.execute(
        sql_delete(LawDocument).where(LawDocument.law_code.in_(law_codes))
    )
    await db.commit()
    deleted = result.rowcount or 0
    _warn(f"Force-reload: deleted {deleted} existing law documents for {law_codes}")
    return deleted


async def _delete_forum_posts(db, sources: list[str]) -> int:
    """Delete existing forum_posts for the given sources. Returns deleted count."""
    from sqlalchemy import delete as sql_delete
    from app.models.forum_post import ForumPost

    result = await db.execute(
        sql_delete(ForumPost).where(ForumPost.source.in_(sources))
    )
    await db.commit()
    deleted = result.rowcount or 0
    _warn(f"Force-reload: deleted {deleted} existing forum posts for {sources}")
    return deleted


# ---------------------------------------------------------------------------
# Laws ingestion wrapper with progress display
# ---------------------------------------------------------------------------


async def run_law_ingestion(
    db,
    law_codes: list[str],
    force_reload: bool = False,
) -> dict:
    """
    Wrapper around gesetze_scraper.ingest_laws_to_db with Rich progress output.
    """
    from app.services.scraper.gesetze_scraper import ingest_laws_to_db

    if force_reload:
        await _delete_law_docs(db, law_codes)

    _info(f"Starting law ingestion for: {', '.join(law_codes)}")
    start = time.monotonic()

    if _RICH and _console:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            MofNCompleteColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=_console,
            transient=False,
        ) as progress:
            overall = progress.add_task(
                "[cyan]Ingesting laws ...", total=len(law_codes)
            )

            # We monkey-patch the logger output to update the progress bar
            # by running ingestion law by law with task updates
            for law_code in law_codes:
                progress.update(
                    overall,
                    description=f"[cyan]Ingesting [bold]{law_code}[/bold] ...",
                )
                try:
                    await ingest_laws_to_db(db, [law_code])
                    progress.advance(overall)
                    _success(f"  {law_code} done")
                except Exception as exc:
                    _error(f"  {law_code} failed: {exc}")
                    progress.advance(overall)
    else:
        for i, law_code in enumerate(law_codes, 1):
            print(f"[{i}/{len(law_codes)}] Ingesting {law_code} ...")
            try:
                await ingest_laws_to_db(db, [law_code])
                print(f"  {law_code} done.")
            except Exception as exc:
                print(f"  {law_code} FAILED: {exc}", file=sys.stderr)

    elapsed = time.monotonic() - start
    return {"law_codes": law_codes, "elapsed_seconds": round(elapsed, 1)}


# ---------------------------------------------------------------------------
# Forum ingestion wrapper with progress display
# ---------------------------------------------------------------------------


async def run_forum_ingestion(
    db,
    sources: list[str],
    force_reload: bool = False,
) -> dict:
    """
    Wrapper around forum_scraper.ingest_forum_posts with Rich progress output.
    """
    from app.services.scraper.forum_scraper import ingest_forum_posts

    if force_reload:
        # Map friendly source names to DB source values
        db_sources = []
        source_map = {
            "reddit": "reddit",
            "gutefrage": "gutefrage",
            "anwalt_de": "anwalt_de",
            "rechtsforum": "legal_forum",
            "jura_forum": "jura_forum",
        }
        for s in sources:
            db_sources.append(source_map.get(s, s))
        await _delete_forum_posts(db, db_sources)

    _info(f"Starting forum ingestion for sources: {', '.join(sources)}")
    start = time.monotonic()

    if _RICH and _console:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            TimeElapsedColumn(),
            console=_console,
            transient=False,
        ) as progress:
            task = progress.add_task(
                "[cyan]Scraping and ingesting forum posts ...", total=None
            )
            try:
                result = await ingest_forum_posts(db, sources=sources)
                progress.update(task, description="[green]Forum ingestion complete")
            except Exception as exc:
                _error(f"Forum ingestion failed: {exc}")
                result = {"total_scraped": 0, "new_added": 0, "skipped_duplicates": 0, "by_source": {}}
    else:
        print("Scraping and ingesting forum posts ...")
        try:
            result = await ingest_forum_posts(db, sources=sources)
        except Exception as exc:
            print(f"Forum ingestion FAILED: {exc}", file=sys.stderr)
            result = {"total_scraped": 0, "new_added": 0, "skipped_duplicates": 0, "by_source": {}}

    elapsed = time.monotonic() - start
    result["elapsed_seconds"] = round(elapsed, 1)
    return result


# ---------------------------------------------------------------------------
# Final report
# ---------------------------------------------------------------------------


def print_report(
    law_result: dict | None,
    forum_result: dict | None,
    total_elapsed: float,
) -> None:
    if _RICH and _console:
        _console.rule("[bold blue]Preload Report")

    if law_result:
        codes = law_result.get("law_codes", [])
        elapsed = law_result.get("elapsed_seconds", 0)
        _success(f"Laws ingested: {len(codes)} law codes in {elapsed}s")

    if forum_result:
        scraped = forum_result.get("total_scraped", 0)
        added = forum_result.get("new_added", 0)
        skipped = forum_result.get("skipped_duplicates", 0)
        elapsed = forum_result.get("elapsed_seconds", 0)
        by_source = forum_result.get("by_source", {})
        _success(
            f"Forums: scraped={scraped}, new={added}, "
            f"skipped_dups={skipped} in {elapsed}s"
        )
        if by_source:
            for src, cnt in by_source.items():
                _info(f"  {src}: {cnt} new posts")

    if _RICH and _console:
        _console.rule()
        _console.print(
            f"[bold]Total elapsed:[/bold] {total_elapsed:.1f}s\n\n"
            "[bold green]Preload complete.[/bold green]  "
            "Run [bold cyan]uvicorn app.main:app[/bold cyan] to start the server."
        )
    else:
        print(f"\nTotal elapsed: {total_elapsed:.1f}s")
        print("Preload complete. Run 'uvicorn app.main:app' to start the server.")


# ---------------------------------------------------------------------------
# Main async entrypoint
# ---------------------------------------------------------------------------


async def main() -> int:
    """
    Main coroutine. Returns exit code (0 = success, 1 = error).
    """
    args = parse_args()
    _banner()

    # ------------------------------------------------------------------ #
    # Validate environment
    # ------------------------------------------------------------------ #
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        # Try to pull from settings
        try:
            from app.config import settings as _s
            db_url = _s.DATABASE_URL
        except Exception:
            pass

    if not db_url:
        _error(
            "DATABASE_URL not found. Set it in .env or as an environment variable.\n"
            "Example: DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/legalaid_db"
        )
        return 1

    _info(f"Database URL: {db_url[:60]}{'...' if len(db_url) > 60 else ''}")

    # ------------------------------------------------------------------ #
    # DB initialisation
    # ------------------------------------------------------------------ #
    try:
        from app.database import AsyncSessionLocal, init_db
    except Exception as exc:
        _error(f"Failed to import database module: {exc}")
        _error("Make sure you are running from the project root with 'backend' on the path.")
        return 1

    _info("Initialising database (creating tables if needed) ...")
    try:
        await init_db()
        _success("Database initialised.")
    except Exception as exc:
        _error(f"Database initialisation failed: {exc}")
        _error("Is PostgreSQL running? Check DATABASE_URL in your .env file.")
        return 1

    # ------------------------------------------------------------------ #
    # Open a long-lived session for all operations
    # ------------------------------------------------------------------ #
    t_start = time.monotonic()
    law_result: dict | None = None
    forum_result: dict | None = None

    async with AsyncSessionLocal() as db:

        # ---- status mode ----
        if args.status:
            await print_status(db)
            return 0

        # ---- law ingestion ----
        if args.laws or args.all:
            law_codes = args.law_codes if args.law_codes else DEFAULT_PRIORITY_LAWS
            _info(f"Law codes to ingest: {law_codes}")
            try:
                law_result = await run_law_ingestion(
                    db,
                    law_codes=law_codes,
                    force_reload=args.force_reload,
                )
            except Exception as exc:
                _error(f"Law ingestion error: {exc}")
                import traceback
                traceback.print_exc()
                # Continue to forum ingestion even if laws fail

        # ---- forum ingestion ----
        if args.forums or args.all:
            sources = args.sources if args.sources else ALL_FORUM_SOURCES
            _info(f"Forum sources to scrape: {sources}")
            try:
                forum_result = await run_forum_ingestion(
                    db,
                    sources=sources,
                    force_reload=args.force_reload,
                )
            except Exception as exc:
                _error(f"Forum ingestion error: {exc}")
                import traceback
                traceback.print_exc()

    total_elapsed = time.monotonic() - t_start
    print_report(law_result, forum_result, total_elapsed)
    return 0


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
