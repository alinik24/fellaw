"""Populate a bounded golden law corpus from gesetze-im-internet.de.

Real statutes only — no synthetic legal text. Rate-limited (2s per request)
and idempotent (skips sections already present by law_code+section).

Usage:
    python scripts/seed_law_corpus.py [--dry-run]
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.database import AsyncSessionLocal  # noqa: E402
from app.models.law_document import LawDocument  # noqa: E402
from app.services.scraper.gesetze_scraper import scrape_law_section  # noqa: E402

# Golden sections per FelLaw scenarios: tenancy (S2/S3), criminal defense
# (S1), procedure, discrimination, residence. Bounded to keep runtime and
# source load small; expand via the backlog, not ad hoc.
GOLDEN: list[tuple[str, str]] = [
    # BGB tenancy
    ("BGB", "§535"), ("BGB", "§536"), ("BGB", "§569"), ("BGB", "§573"),
    ("BGB", "§546"), ("BGB", "§556"), ("BGB", "§578a"), ("BGB", "§280"),
    ("BGB", "§823"), ("BGB", "§194"), ("BGB", "§195"),
    # StGB core defense
    ("StGB", "§32"), ("StGB", "§153"), ("StGB", "§211"), ("StGB", "§242"),
    ("StGB", "§246"), ("StGB", "§263"),
    # StPO procedure
    ("StPO", "§136"), ("StPO", "§141"), ("StPO", "§163a"), ("StPO", "§168c"),
    # AGG discrimination
    ("AGG", "§1"), ("AGG", "§7"), ("AGG", "§15"),
    # AufenthG residence
    ("AufenthG", "§5"), ("AufenthG", "§25"), ("AufenthG", "§58a"),
    # KSchG dismissal protection
    ("KSchG", "§1"), ("KSchG", "§4"), ("KSchG", "§23"),
    # Round 2 corpus gaps found by golden-set misses
    ("BGB", "§551"),   # Kaution / deposit
    ("BGB", "§858"),   # verbotene Eigenmacht
    ("StGB", "§212"),  # Totschlag (paired with §211 Mord)
]


async def main(dry_run: bool = False) -> int:
    added, skipped, failed = 0, 0, 0
    async with AsyncSessionLocal() as db:
        for law_code, section in GOLDEN:
            existing = await db.execute(
                __import__("sqlalchemy").select(LawDocument.id).where(
                    LawDocument.law_code == law_code,
                    LawDocument.section == section,
                )
            )
            if existing.scalars().first() is not None:
                skipped += 1
                continue
            if dry_run:
                print(f"WOULD_FETCH {law_code} {section}")
                continue
            data = await scrape_law_section(law_code, section)
            if not data or not data.get("content"):
                print(f"MISS {law_code} {section}")
                failed += 1
                continue
            db.add(
                LawDocument(
                    title=data["title"][:1024],
                    law_code=law_code,
                    section=section,
                    subsection=None,
                    content=data["content"],
                    url=data.get("url"),
                    is_active=True,
                    metadata_={"source": "gesetze-im-internet.de", "golden": True},
                )
            )
            added += 1
            print(f"ADDED {law_code} {section} ({len(data['content'])} chars)")
            await db.commit()
        await db.commit()
    print(f"SUMMARY added={added} skipped={skipped} failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main(dry_run="--dry-run" in sys.argv)))
