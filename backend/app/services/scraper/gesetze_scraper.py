"""
Scraper for gesetze-im-internet.de (official German federal law database).
Falls back to dejure.org for additional coverage.

Respects robots.txt spirit: 1 request per 2 seconds, proper User-Agent.
"""
from __future__ import annotations

import asyncio
import re
from typing import Any

import httpx
import structlog
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.law_document import LawDocument

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

BASE_URL_GESETZE = "https://www.gesetze-im-internet.de"
BASE_URL_DEJURE = "https://dejure.org"

PRIORITY_LAWS: list[str] = [
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

# Map our law_code to the path segment used by gesetze-im-internet.de
_LAW_CODE_TO_PATH: dict[str, str] = {
    "StGB": "stgb",
    "BGB": "bgb",
    "StPO": "stpo",
    "ZPO": "zpo",
    "VwGO": "vwgo",
    "AGG": "agg",
    "SGB2": "sgb_2",
    "AufenthG": "aufenthg_2004",
    "AsylG": "asylg",
    "WoGG": "wogg",
    "BtMG": "btmg",
    "GG": "gg",
    "KSchG": "kschg",
    "BetrVG": "betrvg",
    "MiLoG": "milog",
    "SGB5": "sgb_5",
    "SGB3": "sgb_3",
}

_HEADERS = {
    "User-Agent": (
        "fellaw/1.0 (academic research; contact: research@example.de)"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "de-DE,de;q=0.9",
}

_RATE_LIMIT_SECS = 2.0  # seconds between requests


# ---------------------------------------------------------------------------
# HTTP client factory
# ---------------------------------------------------------------------------


def _make_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers=_HEADERS,
        follow_redirects=True,
        timeout=30.0,
    )


# ---------------------------------------------------------------------------
# Table of contents fetcher
# ---------------------------------------------------------------------------


async def fetch_law_toc(law_code: str) -> list[dict[str, str]]:
    """
    Fetch the table of contents for a law from gesetze-im-internet.de.

    Returns a list of {section, title, url} dicts.
    """
    path = _LAW_CODE_TO_PATH.get(law_code, law_code.lower())
    toc_url = f"{BASE_URL_GESETZE}/{path}/BJNR*.html"

    # The actual index page pattern varies; try the canonical URL
    index_url = f"{BASE_URL_GESETZE}/{path}/"

    log.info("fetch_law_toc.start", law_code=law_code, url=index_url)

    async with _make_client() as client:
        try:
            resp = await client.get(index_url)
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            log.warning("fetch_law_toc.http_error", law_code=law_code, error=str(exc))
            return []

    soup = BeautifulSoup(resp.text, "lxml")
    toc_items: list[dict[str, str]] = []

    # gesetze-im-internet uses <a> links in a TOC table
    for link in soup.find_all("a", href=True):
        href = link["href"]
        text = link.get_text(strip=True)

        # Filter for paragraph links (§ 1, § 2a, etc.)
        if not text or not href:
            continue

        # Look for patterns like "§ 123" or "Art. 5"
        section_match = re.match(r"(§\s*\d+\w*|Art\.\s*\d+\w*)", text)
        if section_match:
            section = section_match.group(0).replace(" ", "")
            full_url = (
                href if href.startswith("http") else f"{BASE_URL_GESETZE}/{path}/{href}"
            )
            toc_items.append(
                {
                    "section": section,
                    "title": text,
                    "url": full_url,
                }
            )

    log.info("fetch_law_toc.done", law_code=law_code, sections=len(toc_items))
    return toc_items


# ---------------------------------------------------------------------------
# Single section scraper
# ---------------------------------------------------------------------------


async def scrape_law_section(
    law_code: str,
    section: str,
) -> dict[str, Any] | None:
    """
    Scrape a single law section from gesetze-im-internet.de.
    Falls back to dejure.org on failure.

    Returns {title, law_code, section, content, url} or None.
    """
    path = _LAW_CODE_TO_PATH.get(law_code, law_code.lower())
    # Normalise section: "§123" → "__123"
    norm_section = section.replace("§", "").replace(" ", "").replace(".", "_")
    url = f"{BASE_URL_GESETZE}/{path}/__{ norm_section}.html"

    log.debug("scrape_law_section.start", law_code=law_code, section=section)

    async with _make_client() as client:
        result = await _try_gesetze(client, law_code, section, path, norm_section)
        if result:
            return result

        await asyncio.sleep(_RATE_LIMIT_SECS)
        result = await _try_dejure(client, law_code, section)
        return result


async def _try_gesetze(
    client: httpx.AsyncClient,
    law_code: str,
    section: str,
    path: str,
    norm_section: str,
) -> dict[str, Any] | None:
    url = f"{BASE_URL_GESETZE}/{path}/__{norm_section}.html"
    try:
        resp = await client.get(url)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    except httpx.HTTPError:
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Extract title from <h2> or <h3>
    heading = soup.find("h2") or soup.find("h3") or soup.find("h1")
    title = heading.get_text(strip=True) if heading else f"{law_code} {section}"

    # Extract content from the main div
    content_div = (
        soup.find("div", class_="jnhtml")
        or soup.find("div", {"id": "lawtext"})
        or soup.find("article")
        or soup.find("main")
    )
    if content_div:
        # Remove navigation elements
        for nav in content_div.find_all(["nav", "footer", "header"]):
            nav.decompose()
        content = content_div.get_text(separator="\n", strip=True)
    else:
        content = soup.get_text(separator="\n", strip=True)[:3000]

    if not content.strip():
        return None

    return {
        "title": title,
        "law_code": law_code,
        "section": section,
        "content": content[:5000],
        "url": url,
    }


async def _try_dejure(
    client: httpx.AsyncClient,
    law_code: str,
    section: str,
) -> dict[str, Any] | None:
    norm_section = section.replace("§", "").replace(" ", "")
    url = f"{BASE_URL_DEJURE}/gesetze/{law_code}/{norm_section}.html"

    try:
        resp = await client.get(url)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    except httpx.HTTPError:
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    heading = soup.find("h1") or soup.find("h2")
    title = heading.get_text(strip=True) if heading else f"{law_code} {section}"

    content_div = soup.find("div", {"id": "norm_text"}) or soup.find("div", class_="norm")
    if content_div:
        content = content_div.get_text(separator="\n", strip=True)
    else:
        content = ""

    if not content.strip():
        return None

    return {
        "title": title,
        "law_code": law_code,
        "section": section,
        "content": content[:5000],
        "url": url,
    }


# ---------------------------------------------------------------------------
# Full law scraper
# ---------------------------------------------------------------------------


async def scrape_full_law(law_code: str) -> list[dict[str, Any]]:
    """
    Scrape all sections of a law (e.g. all of StGB).

    Returns a list of section dicts.
    """
    log.info("scrape_full_law.start", law_code=law_code)

    toc = await fetch_law_toc(law_code)
    if not toc:
        log.warning("scrape_full_law.empty_toc", law_code=law_code)
        return []

    results: list[dict[str, Any]] = []
    for i, item in enumerate(toc):
        section = item.get("section", "")
        if not section:
            continue

        await asyncio.sleep(_RATE_LIMIT_SECS)
        doc = await scrape_law_section(law_code, section)
        if doc:
            results.append(doc)
            log.debug(
                "scrape_full_law.section_done",
                law_code=law_code,
                section=section,
                total_so_far=len(results),
            )

        # Progress log every 20 sections
        if (i + 1) % 20 == 0:
            log.info(
                "scrape_full_law.progress",
                law_code=law_code,
                done=i + 1,
                total=len(toc),
            )

    log.info("scrape_full_law.done", law_code=law_code, sections=len(results))
    return results


# ---------------------------------------------------------------------------
# DB ingestion pipeline
# ---------------------------------------------------------------------------


async def ingest_laws_to_db(
    db: AsyncSession,
    law_codes: list[str] | None = None,
) -> None:
    """
    Full ingestion pipeline:

    For each law code in law_codes (defaults to PRIORITY_LAWS):
    1. Scrape all sections
    2. Generate embedding for each section
    3. Store in law_documents table (skip if section already exists)
    """
    from app.services.rag_service import add_law_document  # avoid circular import

    codes = law_codes or PRIORITY_LAWS
    log.info("ingest_laws_to_db.start", law_codes=codes)

    for law_code in codes:
        log.info("ingest_laws_to_db.law_start", law_code=law_code)
        sections = await scrape_full_law(law_code)

        ingested = 0
        skipped = 0

        for section_data in sections:
            # Check for existing record
            stmt = select(LawDocument).where(
                LawDocument.law_code == section_data["law_code"],
                LawDocument.section == section_data.get("section"),
            )
            existing = (await db.execute(stmt)).scalars().first()

            if existing:
                skipped += 1
                continue

            try:
                await add_law_document(
                    title=section_data["title"],
                    law_code=section_data["law_code"],
                    section=section_data.get("section"),
                    content=section_data["content"],
                    url=section_data.get("url"),
                    db=db,
                )
                await db.flush()
                ingested += 1
            except Exception as exc:
                log.error(
                    "ingest_laws_to_db.section_failed",
                    law_code=law_code,
                    section=section_data.get("section"),
                    error=str(exc),
                )

            # Rate-limit embedding calls too
            await asyncio.sleep(0.5)

        await db.commit()
        log.info(
            "ingest_laws_to_db.law_done",
            law_code=law_code,
            ingested=ingested,
            skipped=skipped,
        )

    log.info("ingest_laws_to_db.complete", total_laws=len(codes))
