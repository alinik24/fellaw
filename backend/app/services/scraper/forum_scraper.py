"""
Async forum scraper for German legal community content.

Scrapes public posts from:
  1. Reddit (r/germany, r/LegalAdviceGerman, r/GermanLaw, r/Mietrecht, r/Finanzen)
     via the public JSON API — no authentication required.
  2. Gutefrage.net legal tag page (public HTML)
  3. Anwalt.de Rechtstipps (public HTML)
  4. Rechtsforum.at (public HTML)
  5. Jura-Forum.de (public HTML)

Rate-limit: 2 seconds between requests per domain to be a good citizen.
All scraping is of publicly accessible, non-authenticated pages only.
"""
from __future__ import annotations

import asyncio
import hashlib
import re
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
import structlog
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.forum_post import ForumPost

log = structlog.get_logger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

_RATE_LIMIT_SECS = 2.0

_HEADERS_REDDIT = {
    "User-Agent": (
        "fellaw/1.0 (academic research thesis; "
        "contact: research@example.de) python-httpx"
    ),
    "Accept": "application/json",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
}

_HEADERS_WEB = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; fellaw/1.0; "
        "+https://example.de/bot; academic research)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
}

# Reddit subreddit + search term pairs
REDDIT_SEARCHES: list[tuple[str, str]] = [
    ("germany", "Mietrecht Kündigung"),
    ("germany", "Strafrecht Anzeige"),
    ("germany", "Ausländerrecht Aufenthaltstitel"),
    ("germany", "Arbeitsrecht Kündigung"),
    ("germany", "Polizei Vernehmung"),
    ("LegalAdviceGerman", "landlord"),
    ("LegalAdviceGerman", "employment"),
    ("LegalAdviceGerman", "criminal"),
    ("germany", "Beratungshilfe"),
    ("germany", "ohne Anwalt"),
    ("germany", "Gericht selbst"),
    ("germany", "Widerspruch Behörde"),
]

# ---------------------------------------------------------------------------
# Case type keyword detector
# ---------------------------------------------------------------------------

_CASE_KEYWORDS: dict[str, list[str]] = {
    "housing": [
        "miet", "wohnung", "kündigung", "vermieter", "mieter", "kaution",
        "nebenkosten", "mängel", "räumung", "wohnungskündigung", "landlord",
        "mietzins", "betriebskosten", "mieterhöhung", "eigenbedarfskündigung",
    ],
    "criminal": [
        "straf", "anzeige", "polizei", "verhör", "vernehmung", "stgb", "stpo",
        "verdächtig", "beschuldigter", "anklag", "verurteil", "gefängnis",
        "haft", "tatvorwurf", "criminal", "ermittlung", "staatsanwalt",
        "durchsuchung", "festnahm",
    ],
    "employment": [
        "arbeit", "kündigung", "abmahnung", "arbeitgeber", "arbeitnehmer",
        "entlassung", "kündigungsschutz", "employment", "job", "arbeitslos",
        "arbeitsvertrag", "überstunden", "lohn", "gehalt", "mobbing",
        "agg", "diskriminierung", "betriebsrat",
    ],
    "immigration": [
        "ausländer", "aufenthalts", "visum", "asyl", "abschiebung", "passport",
        "visa", "niederlassungserlaubnis", "duldung", "aufenthaltserlaubnis",
        "migration", "einbürgerung", "ausreise", "ausländerrecht",
    ],
    "family": [
        "scheidung", "unterhalt", "sorgerecht", "ehe", "divorce", "custody",
        "kind", "familie", "eltern", "adoption", "erbschaft", "erbe",
        "testament", "nachlass", "familienrecht",
    ],
    "traffic": [
        "verkehr", "unfall", "führerschein", "fahrerlaubnis", "bußgeld",
        "strafzettel", "tempoverstoß", "alkohol steuer", "trunkenheit",
        "fahrerflucht", "traffic", "auto", "fahrzeug",
    ],
    "civil": [
        "vertrag", "schadensersatz", "klage", "schulden", "gläubiger",
        "schuldner", "mahnung", "inkasso", "zivilrecht", "anspruch",
        "haftung", "kaufrecht", "gewährleistung", "reklamation",
    ],
}


def detect_case_type(title: str, content: str) -> str:
    """
    Classify a forum post into a legal domain using keyword matching.

    Checks title and content against keyword lists for each domain.
    Returns the domain with the most keyword hits, or 'general' if none match.
    """
    combined = (title + " " + content).lower()
    scores: dict[str, int] = {}

    for case_type, keywords in _CASE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in combined)
        if score > 0:
            scores[case_type] = score

    if not scores:
        return "general"

    return max(scores, key=lambda k: scores[k])


# ---------------------------------------------------------------------------
# HTTP client factories
# ---------------------------------------------------------------------------


def _make_reddit_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers=_HEADERS_REDDIT,
        follow_redirects=True,
        timeout=30.0,
    )


def _make_web_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers=_HEADERS_WEB,
        follow_redirects=True,
        timeout=30.0,
    )


# ---------------------------------------------------------------------------
# Reddit scraper
# ---------------------------------------------------------------------------


async def scrape_reddit_posts(
    subreddit: str,
    search_query: str,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Fetch posts from a subreddit via the public JSON API.

    Uses old.reddit.com search which does not require authentication.
    Returns a list of post dicts:
        {source_id, title, content, url, subreddit, upvotes, comment_count}
    """
    url = (
        f"https://www.reddit.com/r/{subreddit}/search.json"
        f"?q={search_query}&restrict_sr=1&sort=top&limit={limit}&t=year"
    )
    log.info("scrape_reddit.start", subreddit=subreddit, query=search_query, url=url)

    posts: list[dict[str, Any]] = []

    async with _make_reddit_client() as client:
        try:
            await asyncio.sleep(_RATE_LIMIT_SECS)
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as exc:
            log.warning(
                "scrape_reddit.http_error",
                subreddit=subreddit,
                status=exc.response.status_code,
                error=str(exc),
            )
            return []
        except Exception as exc:
            log.warning("scrape_reddit.error", subreddit=subreddit, error=str(exc))
            return []

    children = data.get("data", {}).get("children", [])
    for child in children:
        post = child.get("data", {})

        # Only keep self-posts (text posts), skip link-only posts
        selftext = post.get("selftext", "").strip()
        if not selftext or selftext in ("[deleted]", "[removed]"):
            continue

        title = post.get("title", "").strip()
        if not title:
            continue

        posts.append(
            {
                "source_id": post.get("id", ""),
                "title": title,
                "content": selftext[:8000],
                "url": f"https://www.reddit.com{post.get('permalink', '')}",
                "subreddit_or_category": f"r/{subreddit}",
                "upvotes": int(post.get("ups", 0)),
                "comment_count": int(post.get("num_comments", 0)),
            }
        )

    log.info("scrape_reddit.done", subreddit=subreddit, found=len(posts))
    return posts


# ---------------------------------------------------------------------------
# Gutefrage.net scraper
# ---------------------------------------------------------------------------


async def scrape_gutefrage(limit: int = 100) -> list[dict[str, Any]]:
    """
    Scrape legal questions from gutefrage.net/tag/recht.

    Paginates through results until the limit is reached.
    Returns [{source_id, title, content, url, subreddit_or_category}]
    """
    base_url = "https://www.gutefrage.net/tag/recht"
    posts: list[dict[str, Any]] = []
    page = 1

    async with _make_web_client() as client:
        while len(posts) < limit:
            page_url = f"{base_url}?page={page}" if page > 1 else base_url
            log.info("scrape_gutefrage.page", page=page, url=page_url)

            try:
                await asyncio.sleep(_RATE_LIMIT_SECS)
                resp = await client.get(page_url)
                resp.raise_for_status()
            except Exception as exc:
                log.warning("scrape_gutefrage.error", page=page, error=str(exc))
                break

            soup = BeautifulSoup(resp.text, "lxml")
            items_before = len(posts)

            # Gutefrage question links are in <a> tags with class patterns
            # containing "question" or pointing to /frage/ paths
            for link in soup.find_all("a", href=True):
                href = link["href"]
                if "/frage/" not in href:
                    continue

                full_url = (
                    href if href.startswith("http")
                    else urljoin("https://www.gutefrage.net", href)
                )

                title_text = link.get_text(strip=True)
                if not title_text or len(title_text) < 10:
                    continue

                # Create a stable source_id from the URL path
                path_part = urlparse(full_url).path
                source_id = hashlib.md5(path_part.encode()).hexdigest()[:16]

                # Avoid duplicates in this batch
                if any(p["source_id"] == source_id for p in posts):
                    continue

                posts.append(
                    {
                        "source_id": source_id,
                        "title": title_text[:512],
                        "content": "",   # filled in by detail fetch below
                        "url": full_url,
                        "subreddit_or_category": "Recht",
                        "upvotes": 0,
                        "comment_count": 0,
                        "_detail_url": full_url,
                    }
                )

                if len(posts) >= limit:
                    break

            # If no new items were added this page, we have reached the end
            if len(posts) == items_before:
                log.info("scrape_gutefrage.no_more_pages", final_page=page)
                break

            page += 1

    # Fetch post content for each item (up to limit)
    async with _make_web_client() as client:
        enriched: list[dict[str, Any]] = []
        for post in posts[:limit]:
            detail_url = post.pop("_detail_url", post["url"])
            try:
                await asyncio.sleep(_RATE_LIMIT_SECS)
                resp = await client.get(detail_url)
                resp.raise_for_status()
                detail_soup = BeautifulSoup(resp.text, "lxml")

                # Question body — gutefrage uses various class names
                body_el = (
                    detail_soup.find("div", class_=re.compile(r"question.*body|body.*question", re.I))
                    or detail_soup.find("div", {"itemprop": "text"})
                    or detail_soup.find("p", class_=re.compile(r"question", re.I))
                    or detail_soup.find("main")
                )
                content = body_el.get_text(separator="\n", strip=True)[:5000] if body_el else ""

                # Answer count
                count_el = detail_soup.find(string=re.compile(r"\d+\s*Antwort", re.I))
                if count_el:
                    m = re.search(r"(\d+)", count_el)
                    post["comment_count"] = int(m.group(1)) if m else 0

                post["content"] = content
                if content:
                    enriched.append(post)
            except Exception as exc:
                log.warning("scrape_gutefrage.detail_error", url=detail_url, error=str(exc))
                # Keep even without content if title is meaningful
                if len(post["title"]) > 20:
                    enriched.append(post)

    log.info("scrape_gutefrage.done", total=len(enriched))
    return enriched


# ---------------------------------------------------------------------------
# Anwalt.de scraper
# ---------------------------------------------------------------------------


async def scrape_anwalt_tipps(limit: int = 50) -> list[dict[str, Any]]:
    """
    Scrape legal tip articles from anwalt.de/rechtstipps/.

    These are short articles written by lawyers on common legal topics —
    useful context for RAG even if they are not user forum posts.
    Returns [{source_id, title, content, url, subreddit_or_category}]
    """
    base_url = "https://www.anwalt.de/rechtstipps/"
    posts: list[dict[str, Any]] = []
    page = 1

    async with _make_web_client() as client:
        while len(posts) < limit:
            page_url = f"{base_url}?page={page}" if page > 1 else base_url
            log.info("scrape_anwalt.page", page=page, url=page_url)

            try:
                await asyncio.sleep(_RATE_LIMIT_SECS)
                resp = await client.get(page_url)
                resp.raise_for_status()
            except Exception as exc:
                log.warning("scrape_anwalt.error", page=page, error=str(exc))
                break

            soup = BeautifulSoup(resp.text, "lxml")
            items_before = len(posts)

            # Article links on anwalt.de listing pages
            for article in soup.find_all(["article", "div"], class_=re.compile(r"tipp|article|entry", re.I)):
                link_el = article.find("a", href=True)
                if not link_el:
                    continue

                href = link_el["href"]
                full_url = (
                    href if href.startswith("http")
                    else urljoin("https://www.anwalt.de", href)
                )

                # Only keep rechtstipps URLs
                if "rechtstipps" not in full_url and "anwalt.de" not in full_url:
                    continue

                title_el = (
                    article.find(["h1", "h2", "h3"])
                    or link_el
                )
                title = title_el.get_text(strip=True)[:512]
                if not title or len(title) < 10:
                    continue

                # Detect legal area from nearby text
                area_el = article.find(class_=re.compile(r"categor|rechtsgebiet|area", re.I))
                legal_area = area_el.get_text(strip=True) if area_el else "Rechtstipps"

                source_id = hashlib.md5(full_url.encode()).hexdigest()[:16]
                if any(p["source_id"] == source_id for p in posts):
                    continue

                posts.append(
                    {
                        "source_id": source_id,
                        "title": title,
                        "content": "",
                        "url": full_url,
                        "subreddit_or_category": legal_area,
                        "upvotes": 0,
                        "comment_count": 0,
                        "_detail_url": full_url,
                    }
                )

                if len(posts) >= limit:
                    break

            if len(posts) == items_before:
                break

            page += 1

    # Fetch article content
    async with _make_web_client() as client:
        enriched: list[dict[str, Any]] = []
        for post in posts[:limit]:
            detail_url = post.pop("_detail_url", post["url"])
            try:
                await asyncio.sleep(_RATE_LIMIT_SECS)
                resp = await client.get(detail_url)
                resp.raise_for_status()
                detail_soup = BeautifulSoup(resp.text, "lxml")

                body_el = (
                    detail_soup.find("div", class_=re.compile(r"article.*body|content.*main|tipp.*text", re.I))
                    or detail_soup.find("article")
                    or detail_soup.find("main")
                )
                content = body_el.get_text(separator="\n", strip=True)[:5000] if body_el else ""
                post["content"] = content

                if content:
                    enriched.append(post)
                elif len(post["title"]) > 20:
                    enriched.append(post)
            except Exception as exc:
                log.warning("scrape_anwalt.detail_error", url=detail_url, error=str(exc))
                if len(post["title"]) > 20:
                    enriched.append(post)

    log.info("scrape_anwalt.done", total=len(enriched))
    return enriched


# ---------------------------------------------------------------------------
# Generic forum scrapers (rechtsforum.at, jura-forum.de)
# ---------------------------------------------------------------------------


async def _scrape_generic_forum(
    name: str,
    listing_url: str,
    source_key: str,
    post_link_pattern: str,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Generic HTML forum scraper for rechtsforum.at and jura-forum.de.

    Fetches the listing page, finds post links matching post_link_pattern,
    then fetches each post's detail page to extract title + content.
    """
    posts: list[dict[str, Any]] = []

    async with _make_web_client() as client:
        try:
            await asyncio.sleep(_RATE_LIMIT_SECS)
            resp = await client.get(listing_url)
            resp.raise_for_status()
        except Exception as exc:
            log.warning(f"scrape_{name}.listing_error", url=listing_url, error=str(exc))
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        base = f"{urlparse(listing_url).scheme}://{urlparse(listing_url).netloc}"

        seen_ids: set[str] = set()
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if not re.search(post_link_pattern, href):
                continue

            full_url = href if href.startswith("http") else urljoin(base, href)
            source_id = hashlib.md5(full_url.encode()).hexdigest()[:16]

            if source_id in seen_ids:
                continue
            seen_ids.add(source_id)

            title = link.get_text(strip=True)[:512]
            if not title or len(title) < 8:
                continue

            posts.append(
                {
                    "source_id": source_id,
                    "title": title,
                    "content": "",
                    "url": full_url,
                    "subreddit_or_category": name,
                    "upvotes": 0,
                    "comment_count": 0,
                }
            )

            if len(posts) >= limit:
                break

    # Fetch detail pages
    async with _make_web_client() as client:
        enriched: list[dict[str, Any]] = []
        for post in posts:
            try:
                await asyncio.sleep(_RATE_LIMIT_SECS)
                resp = await client.get(post["url"])
                resp.raise_for_status()
                detail_soup = BeautifulSoup(resp.text, "lxml")

                body_el = (
                    detail_soup.find("div", class_=re.compile(r"post.*text|message.*body|thread.*content", re.I))
                    or detail_soup.find("article")
                    or detail_soup.find("main")
                )
                content = body_el.get_text(separator="\n", strip=True)[:5000] if body_el else ""
                post["content"] = content

                if content or len(post["title"]) > 20:
                    enriched.append(post)
            except Exception as exc:
                log.warning(f"scrape_{name}.detail_error", url=post["url"], error=str(exc))
                if len(post["title"]) > 20:
                    enriched.append(post)

    log.info(f"scrape_{name}.done", total=len(enriched))
    return enriched


async def scrape_rechtsforum() -> list[dict[str, Any]]:
    """Scrape legal questions from rechtsforum.at."""
    return await _scrape_generic_forum(
        name="rechtsforum_at",
        listing_url="https://www.rechtsforum.at/forum/",
        source_key="legal_forum",
        post_link_pattern=r"/thread/|/topic/|viewtopic",
        limit=50,
    )


async def scrape_jura_forum() -> list[dict[str, Any]]:
    """Scrape legal questions from jura-forum.de."""
    return await _scrape_generic_forum(
        name="jura_forum_de",
        listing_url="https://www.jura-forum.de/",
        source_key="jura_forum",
        post_link_pattern=r"/thread/|/thema/|/beitrag/|viewtopic",
        limit=50,
    )


# ---------------------------------------------------------------------------
# Full ingestion pipeline
# ---------------------------------------------------------------------------


async def ingest_forum_posts(
    db: AsyncSession,
    sources: list[str] | None = None,
) -> dict[str, Any]:
    """
    Orchestrate scraping, embedding, and DB insertion for all forum sources.

    Parameters
    ----------
    db:
        Async SQLAlchemy session.
    sources:
        Subset of source names to run. Defaults to all.
        Valid values: 'reddit', 'gutefrage', 'anwalt_de', 'rechtsforum', 'jura_forum'

    Returns
    -------
    dict with keys: total_scraped, new_added, skipped_duplicates, by_source
    """
    from app.services.ai_service import get_embedding  # avoid circular import

    all_sources = sources or ["reddit", "gutefrage", "anwalt_de", "rechtsforum", "jura_forum"]
    log.info("ingest_forum_posts.start", sources=all_sources)

    raw_posts: dict[str, list[dict[str, Any]]] = {}

    # ------------------------------------------------------------------ #
    # 1. Scrape all sources
    # ------------------------------------------------------------------ #

    if "reddit" in all_sources:
        reddit_posts: list[dict[str, Any]] = []
        for subreddit, query in REDDIT_SEARCHES:
            batch = await scrape_reddit_posts(subreddit=subreddit, search_query=query, limit=50)
            for p in batch:
                p["source"] = "reddit"
            reddit_posts.extend(batch)
        raw_posts["reddit"] = reddit_posts

    if "gutefrage" in all_sources:
        gf = await scrape_gutefrage(limit=100)
        for p in gf:
            p["source"] = "gutefrage"
        raw_posts["gutefrage"] = gf

    if "anwalt_de" in all_sources:
        aw = await scrape_anwalt_tipps(limit=50)
        for p in aw:
            p["source"] = "anwalt_de"
        raw_posts["anwalt_de"] = aw

    if "rechtsforum" in all_sources:
        rf = await scrape_rechtsforum()
        for p in rf:
            p["source"] = "legal_forum"
        raw_posts["rechtsforum"] = rf

    if "jura_forum" in all_sources:
        jf = await scrape_jura_forum()
        for p in jf:
            p["source"] = "jura_forum"
        raw_posts["jura_forum"] = jf

    # ------------------------------------------------------------------ #
    # 2. Deduplicate within batch by (source, source_id)
    # ------------------------------------------------------------------ #

    seen_keys: set[tuple[str, str]] = set()
    all_posts: list[dict[str, Any]] = []
    for source_posts in raw_posts.values():
        for post in source_posts:
            key = (post.get("source", ""), post.get("source_id", ""))
            if key in seen_keys or not key[1]:
                continue
            seen_keys.add(key)
            all_posts.append(post)

    total_scraped = len(all_posts)
    log.info("ingest_forum_posts.deduped", total=total_scraped)

    # ------------------------------------------------------------------ #
    # 3. Check DB for existing records, generate embeddings, insert
    # ------------------------------------------------------------------ #

    new_added = 0
    skipped_duplicates = 0
    by_source: dict[str, int] = {}

    EMBED_BATCH = 10

    for i in range(0, len(all_posts), EMBED_BATCH):
        batch = all_posts[i : i + EMBED_BATCH]

        for post in batch:
            source = post.get("source", "")
            source_id = post.get("source_id", "")

            # Check DB for existing record
            stmt = select(ForumPost).where(
                ForumPost.source == source,
                ForumPost.source_id == source_id,
            )
            existing = (await db.execute(stmt)).scalars().first()
            if existing:
                skipped_duplicates += 1
                continue

            # Detect case type
            case_type = detect_case_type(
                post.get("title", ""), post.get("content", "")
            )

            # Generate embedding
            embed_text = (
                f"{post.get('title', '')}\n\n{post.get('content', '')}"
            ).strip()[:32000]

            try:
                embedding = await get_embedding(embed_text)
            except Exception as exc:
                log.warning(
                    "ingest_forum_posts.embed_failed",
                    source=source,
                    source_id=source_id,
                    error=str(exc),
                )
                embedding = None

            forum_post = ForumPost(
                source=source,
                source_id=source_id,
                title=post.get("title", "")[:1024],
                content=post.get("content", ""),
                url=post.get("url"),
                subreddit_or_category=post.get("subreddit_or_category"),
                case_type=case_type,
                upvotes=int(post.get("upvotes", 0)),
                comment_count=int(post.get("comment_count", 0)),
                language="de",
                embedding=embedding,
                tags=[],
            )

            db.add(forum_post)
            try:
                await db.flush()
                new_added += 1
                by_source[source] = by_source.get(source, 0) + 1
            except Exception as exc:
                log.error(
                    "ingest_forum_posts.db_insert_failed",
                    source=source,
                    source_id=source_id,
                    error=str(exc),
                )
                await db.rollback()

            # Small delay to avoid hammering the embedding endpoint
            await asyncio.sleep(0.3)

        # Commit each batch
        try:
            await db.commit()
        except Exception as exc:
            log.error("ingest_forum_posts.batch_commit_failed", error=str(exc))
            await db.rollback()

    result = {
        "total_scraped": total_scraped,
        "new_added": new_added,
        "skipped_duplicates": skipped_duplicates,
        "by_source": by_source,
    }
    log.info("ingest_forum_posts.complete", **result)
    return result
