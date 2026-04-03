"""
RAG (Retrieval-Augmented Generation) service for German law documents and forum posts.

Performs cosine-similarity vector search against the law_documents and forum_posts
tables using pgvector, then formats results for injection into chat system prompts.
"""
from __future__ import annotations

import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.law_document import LawDocument
from app.models.forum_post import ForumPost
from app.services.ai_service import get_embedding

log = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Core search
# ---------------------------------------------------------------------------


async def search_laws(
    query: str,
    law_codes: list[str] | None = None,
    limit: int = 5,
    db: AsyncSession = None,  # type: ignore[assignment]
) -> list[dict]:
    """
    Semantic search over the law_documents table.

    1. Embeds the query with text-embedding-3-large.
    2. Runs a cosine-similarity search via pgvector's <=> operator.
    3. Optionally filters by law_code.

    Returns a list of dicts:
        {id, title, law_code, section, content, url, relevance_score}
    """
    log.info("search_laws.start", query=query[:80], law_codes=law_codes, limit=limit)

    embedding = await get_embedding(query)
    embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"

    # Build the raw SQL for pgvector cosine similarity
    law_code_filter = ""
    params: dict = {"embedding": embedding_str, "limit": limit}

    if law_codes:
        placeholders = ", ".join(f":lc{i}" for i in range(len(law_codes)))
        law_code_filter = f"AND law_code IN ({placeholders})"
        for i, lc in enumerate(law_codes):
            params[f"lc{i}"] = lc

    sql = text(
        f"""
        SELECT
            id::text,
            title,
            law_code,
            section,
            content,
            url,
            1 - (embedding <=> CAST(:embedding AS vector)) AS relevance_score
        FROM law_documents
        WHERE is_active = true
            AND embedding IS NOT NULL
            {law_code_filter}
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """
    )

    result = await db.execute(sql, params)
    rows = result.fetchall()

    docs = []
    for row in rows:
        docs.append(
            {
                "id": row.id,
                "title": row.title,
                "law_code": row.law_code,
                "section": row.section,
                "content": row.content,
                "url": row.url,
                "relevance_score": float(row.relevance_score) if row.relevance_score is not None else 0.0,
            }
        )

    log.info("search_laws.done", result_count=len(docs))
    return docs


# ---------------------------------------------------------------------------
# Context builder for chat
# ---------------------------------------------------------------------------


async def get_context_for_chat(
    query: str,
    case_context: str | None = None,
    db: AsyncSession = None,  # type: ignore[assignment]
) -> str:
    """
    Build a formatted string of relevant law snippets to inject as system context.

    Combines the user's query with optional case context to retrieve the most
    relevant legal articles.
    """
    search_query = query
    if case_context:
        search_query = f"{query}\n\nFallkontext: {case_context}"

    docs = await search_laws(query=search_query, limit=5, db=db)

    if not docs:
        return "Keine spezifischen Gesetzesstellen gefunden."

    lines = ["**Relevante Rechtsgrundlagen:**\n"]
    for doc in docs:
        section_str = f"§ {doc['section']}" if doc["section"] else ""
        lines.append(
            f"**{doc['law_code']} {section_str} – {doc['title']}**\n"
            f"{doc['content'][:800]}\n"
            f"Quelle: {doc['url'] or 'gesetze-im-internet.de'}\n"
        )

    return "\n---\n".join(lines)


# ---------------------------------------------------------------------------
# Document ingestion
# ---------------------------------------------------------------------------


async def add_law_document(
    title: str,
    law_code: str,
    section: str | None,
    content: str,
    url: str | None,
    db: AsyncSession,
) -> LawDocument:
    """
    Generate an embedding for the provided content and persist a new LawDocument.
    """
    log.info("add_law_document.start", law_code=law_code, section=section)

    embedding = await get_embedding(f"{law_code} § {section or ''} {title}\n\n{content}")

    doc = LawDocument(
        title=title,
        law_code=law_code,
        section=section,
        content=content,
        url=url,
        embedding=embedding,
        is_active=True,
        metadata_={},
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)

    log.info("add_law_document.done", doc_id=str(doc.id))
    return doc


# ---------------------------------------------------------------------------
# Citation formatter
# ---------------------------------------------------------------------------


def format_citations(law_docs: list[dict]) -> list[dict]:
    """
    Convert raw search results into compact citation objects for API responses.

    Returns:
        [{law_code, section, title, snippet, url}]
    """
    citations = []
    for doc in law_docs:
        snippet = doc.get("content", "")[:300]
        if len(doc.get("content", "")) > 300:
            snippet += "…"
        citations.append(
            {
                "law_code": doc.get("law_code", ""),
                "section": doc.get("section"),
                "title": doc.get("title", ""),
                "snippet": snippet,
                "url": doc.get("url"),
                "relevance_score": doc.get("relevance_score", 0.0),
            }
        )
    return citations


# ---------------------------------------------------------------------------
# Forum post search
# ---------------------------------------------------------------------------


async def search_forum_posts(
    query: str,
    case_type: str | None = None,
    limit: int = 5,
    db: AsyncSession = None,  # type: ignore[assignment]
) -> list[dict]:
    """
    Semantic similarity search over the forum_posts table.

    1. Embeds the query with text-embedding-3-large.
    2. Runs a cosine-similarity search via pgvector's <=> operator.
    3. Optionally filters by case_type.

    Returns a list of dicts:
        {id, title, content_snippet, source, url, case_type, upvotes, relevance_score}
    """
    log.info("search_forum_posts.start", query=query[:80], case_type=case_type, limit=limit)

    embedding = await get_embedding(query)
    embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"

    case_type_filter = ""
    params: dict = {"embedding": embedding_str, "limit": limit}

    if case_type:
        case_type_filter = "AND case_type = :case_type"
        params["case_type"] = case_type

    sql = text(
        f"""
        SELECT
            id::text,
            title,
            content,
            source,
            url,
            case_type,
            upvotes,
            1 - (embedding <=> CAST(:embedding AS vector)) AS relevance_score
        FROM forum_posts
        WHERE embedding IS NOT NULL
            {case_type_filter}
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """
    )

    result = await db.execute(sql, params)
    rows = result.fetchall()

    posts = []
    for row in rows:
        content = row.content or ""
        posts.append(
            {
                "id": row.id,
                "title": row.title,
                "content_snippet": content[:400] + ("…" if len(content) > 400 else ""),
                "source": row.source,
                "url": row.url,
                "case_type": row.case_type,
                "upvotes": row.upvotes,
                "relevance_score": float(row.relevance_score) if row.relevance_score is not None else 0.0,
            }
        )

    log.info("search_forum_posts.done", result_count=len(posts))
    return posts


# ---------------------------------------------------------------------------
# Enriched context builder (laws + forums combined)
# ---------------------------------------------------------------------------


async def get_enriched_context(
    query: str,
    case_context: str | None = None,
    include_forums: bool = True,
    db: AsyncSession = None,  # type: ignore[assignment]
) -> dict:
    """
    Retrieve both law and forum context for an AI chat turn.

    Combines the user query with an optional case description, then searches
    both the law_documents and forum_posts tables.

    Parameters
    ----------
    query:
        The user's question or message.
    case_context:
        Optional case description to enrich the search vector.
    include_forums:
        Whether to include forum post results alongside law citations.
    db:
        Async SQLAlchemy session.

    Returns
    -------
    dict with keys:
        law_context   – formatted string of law snippets (for system prompt)
        forum_context – formatted string of forum snippets (for system prompt)
        citations     – list of law citation dicts (for API response)
        forum_refs    – list of forum reference dicts (for API response)
    """
    search_query = query
    if case_context:
        search_query = f"{query}\n\nFallkontext: {case_context}"

    # ---- Law search ----
    law_docs = await search_laws(query=search_query, limit=5, db=db)

    law_lines = ["**Relevante Rechtsgrundlagen:**\n"]
    for doc in law_docs:
        section_str = f"§ {doc['section']}" if doc.get("section") else ""
        law_lines.append(
            f"**{doc['law_code']} {section_str} – {doc['title']}**\n"
            f"{doc['content'][:600]}\n"
            f"Quelle: {doc.get('url') or 'gesetze-im-internet.de'}\n"
        )

    law_context = (
        "\n---\n".join(law_lines) if law_docs else "Keine spezifischen Gesetzesstellen gefunden."
    )
    citations = format_citations(law_docs)

    # ---- Forum search ----
    forum_context = ""
    forum_refs: list[dict] = []

    if include_forums:
        forum_posts = await search_forum_posts(query=search_query, limit=5, db=db)

        if forum_posts:
            forum_lines = ["**Erfahrungen aus der Community:**\n"]
            for post in forum_posts:
                source_label = {
                    "reddit": "Reddit",
                    "gutefrage": "Gutefrage.net",
                    "anwalt_de": "Anwalt.de",
                    "legal_forum": "Rechtsforum",
                    "jura_forum": "Jura-Forum.de",
                }.get(post["source"], post["source"])
                forum_lines.append(
                    f"**[{source_label}] {post['title']}**\n"
                    f"{post['content_snippet']}\n"
                    f"({post.get('case_type', 'general')}, {post['upvotes']} Upvotes)\n"
                )
                forum_refs.append(
                    {
                        "title": post["title"],
                        "source": post["source"],
                        "url": post.get("url"),
                        "case_type": post.get("case_type"),
                        "relevance_score": post["relevance_score"],
                    }
                )
            forum_context = "\n---\n".join(forum_lines)
        else:
            forum_context = "Keine relevanten Community-Beiträge gefunden."

    return {
        "law_context": law_context,
        "forum_context": forum_context,
        "citations": citations,
        "forum_refs": forum_refs,
    }
