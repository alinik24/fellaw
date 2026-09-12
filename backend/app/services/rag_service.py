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
from app.services.ai_service import create_embedding as _create_embedding

log = structlog.get_logger(__name__)

# Retrieval mode: "vector" when a working embedding provider is configured,
# "lexical" as the honest fallback using pg_trgm similarity on real statute
# text. Never pretend a semantic search happened when it did not.
RETRIEVAL_MODE_FALLBACK = "lexical"


def _embedding_available() -> bool:
    """True when the configured embedding provider plausibly works.

    Deliberately cheap: checks provider selection only, so that a missing
    OpenAI key does not make every /laws/search request fail. The actual
    embedding call still surfaces provider errors as empty results.
    """
    from app.config import settings

    provider = settings.EMBEDDING_PROVIDER or settings.AI_PROVIDER
    if provider == "kit":
        # KIT Toolbox key must be present and non-placeholder.
        return bool(getattr(settings, "KIT_API_KEY", ""))
    if provider in ("openai",):
        key = getattr(settings, "OPENAI_API_KEY", "") or ""
        # A real key is "sk-" + >=40 chars; placeholder values ("your-key…")
        # must not send the vector path into a doomed request per query.
        return key.startswith("sk-") and len(key) >= 40
    if provider == "azure":
        return bool(getattr(settings, "AZURE_EMBEDDING_API_KEY", ""))
    if provider == "cohere":
        return bool(getattr(settings, "COHERE_API_KEY", ""))
    if provider == "google":
        return bool(getattr(settings, "GOOGLE_API_KEY", ""))
    if provider == "local":
        # Local embedding (Ollama) is only real when the configured embedding
        # model is actually installed; otherwise every query pays a failed
        # HTTP round-trip. Cheap probe via the tags endpoint, cached on the
        # settings object.
        cached = getattr(settings, "_local_embed_ok", None)
        if cached is None:
            import httpx

            try:
                r = httpx.get(f"{settings.LOCAL_MODEL_URL}/api/tags", timeout=2.0)
                names = {m.get("name", "") for m in r.json().get("models", [])}
                model = settings.LOCAL_EMBEDDING_MODEL
                cached = any(n == model or n.split(":")[0] == model for n in names)
            except Exception:
                cached = False
            settings._local_embed_ok = cached  # type: ignore[attr-defined]
        return bool(cached)
    return False


async def get_embedding(text: str) -> list[float]:
    """Public embedding helper kept for backwards compatibility.

    Delegates to ai_service.create_embedding. RAG call sites use this so the
    single defect surface (missing function) stays fixed in one place.
    """
    return await _create_embedding(text)


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
    Search over the law_documents table.

    1. If a usable embedding provider is configured: embed the query and run
       a cosine-similarity search via pgvector's <=> operator.
    2. Otherwise: fall back to pg_trgm lexical similarity over the real
       statute text. The result dict records which mode produced it.

    Returns a list of dicts:
        {id, title, law_code, section, content, url, relevance_score, mode}
    """
    log.info("search_laws.start", query=query[:80], law_codes=law_codes, limit=limit)

    law_code_filter = ""
    params: dict = {"limit": limit}

    if law_codes:
        placeholders = ", ".join(f":lc{i}" for i in range(len(law_codes)))
        law_code_filter = f"AND law_code IN ({placeholders})"
        for i, lc in enumerate(law_codes):
            params[f"lc{i}"] = lc

    if _embedding_available():
        try:
            embedding = await get_embedding(query)
            embedding_str = "[" + ",".join(str(v) for v in embedding) + "]"
            params["embedding"] = embedding_str
            sql = text(
                f"""
                SELECT
                    id::text,
                    title,
                    law_code,
                    section,
                    content,
                    url,
                    1 - (embedding <=> CAST(:embedding AS vector)) AS relevance_score,
                    'vector' AS mode
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
            if rows:
                return _rows_to_docs(rows)
            # Empty vector index (no embeddings yet) -> lexical below.
        except Exception as exc:
            log.warning("search_laws.vector_failed_falling_back", error=str(exc))

    # Lexical fallback: three-stage hybrid over real statute text.
    #   1. German FTS AND  (websearch syntax, stemmed, high precision)
    #   2. German FTS OR   (any stemmed token matches — recall for queries
    #                       whose wording differs from statute wording)
    #   3. pg_trgm word_similarity (fuzzy/typo/natural-language ranking)
    # Scores are normalized per stage; stage order is the primary rank.
    # 'mode' records which stage produced each result — never pretend a
    # semantic/vector search happened.
    import re as _re

    section_hint = _re.search(r"(§\s*\d+\w*)", query)
    sec_pat = section_hint.group(1).replace(" ", "") if section_hint else None
    known_codes = ("BGB", "StGB", "StPO", "ZPO", "VwGO", "AGG", "KSchG", "AufenthG", "AsylG", "WoGG", "MiLoG", "BetrVG", "SGB")
    code_hints = [c for c in known_codes if c.casefold() in query.casefold()]

    boost = ""
    if sec_pat:
        params["sec_pat"] = f"%{sec_pat}%"
        boost += " OR section ILIKE :sec_pat"
    for i, code in enumerate(code_hints):
        params[f"hint{i}"] = code
        boost += f" OR law_code = :hint{i}"

    # R3: when the user names an explicit section (e.g. "§535 BGB"), that
    # exact statute outranks everything else. The hint is deterministic
    # (regex on the query, ILIKE on the section column) — not a guess.
    # A document matching BOTH the section pattern and a named code gets
    # the strongest lift; section-only matches still outrank generic hits.
    exact_boost = ""
    if sec_pat:
        exact_boost = " + CASE WHEN section ILIKE :sec_pat THEN 0.5 ELSE 0 END"
        if code_hints:
            code_match = " OR ".join(f"law_code = :hint{i}" for i in range(len(code_hints)))
            exact_boost += f" + CASE WHEN section ILIKE :sec_pat AND ({code_match}) THEN 0.5 ELSE 0 END"

    await db.execute(text("SELECT set_config('pg_trgm.word_similarity_threshold', '0.2', true)"))
    await db.execute(text("SELECT set_config('pg_trgm.similarity_threshold', '0.1', true)"))

    hybrid_sql = text(
        f"""
        WITH q AS (SELECT :query AS query),
        fts_and AS (
            SELECT id, ts_rank(to_tsvector('german', content),
                    websearch_to_tsquery('german', query)) AS s
            FROM law_documents, q
            WHERE is_active AND to_tsvector('german', content) @@ websearch_to_tsquery('german', query)
              AND (1=1 {law_code_filter.replace('AND', 'AND').replace('law_code IN', 'law_code IN')} or true)
        ),
        fts_or AS (
            SELECT d.id,
                   -- coverage of DISTINCT query lexemes first, then ts_rank
                   (SELECT count(*) FROM unnest(q.lex_arr) AS lx
                     WHERE d.tsv @@ plainto_tsquery('german', lx)) AS cov,
                   ts_rank(d.tsv, q.terms) AS s
            FROM (SELECT id, to_tsvector('german', content) AS tsv FROM law_documents WHERE is_active) d
            CROSS JOIN (SELECT to_tsquery('german', :fts_or_expr) AS terms,
                                string_to_array(:fts_or_expr, ' | ') AS lex_arr) q
            WHERE d.tsv @@ q.terms
        ),
        trgm AS (
            SELECT id, word_similarity(:query, content) AS s
            FROM law_documents
            WHERE is_active AND (:query <% content OR :query <% title{boost})
        )
        SELECT d.id::text, d.title, d.law_code, d.section, d.content, d.url,
            CASE
                WHEN fa.id IS NOT NULL THEN 1.0 + LEAST(fa.s, 1.0)
                WHEN fo.id IS NOT NULL THEN 0.7 + LEAST(fo.cov * 0.1 + fo.s, 0.3)
                ELSE t.s
            END{exact_boost} AS relevance_score,
            CASE
                WHEN fa.id IS NOT NULL THEN 'fts_and'
                WHEN fo.id IS NOT NULL THEN 'fts_or'
                ELSE 'lexical'
            END AS mode
        FROM law_documents d
        LEFT JOIN fts_and fa ON fa.id = d.id
        LEFT JOIN fts_or fo ON fo.id = d.id
        LEFT JOIN trgm t ON t.id = d.id
        WHERE d.is_active AND (fa.id IS NOT NULL OR fo.id IS NOT NULL OR t.id IS NOT NULL)
        ORDER BY relevance_score DESC, d.title
        LIMIT :limit
        """
    )

    # FTS-OR expression: stemmed lexemes of the query joined with '|',
    # computed in Python so no dynamic ts_stat SQL is needed.
    params["query"] = query
    lex_row = await db.execute(text("SELECT to_tsvector('german', :t)::text"), {"t": query})
    vec_text = lex_row.scalar() or ""
    lexemes = [tok.split(":")[0].strip("'") for tok in vec_text.split() if ":" in tok]
    lexemes = _expand_lexemes(lexemes)
    fts_or_expr = " | ".join(lexemes) if lexemes else "fellaw_none"
    params["fts_or_expr"] = fts_or_expr
    result = await db.execute(hybrid_sql, params)
    rows = result.fetchall()
    return _rows_to_docs(rows)


# German legal-language stem bridges. The German stemmer produces different
# lexemes for related word forms ("mindern"→mind vs "Minderung"→minder;
# "benachteiligt"→benachteiligt vs "Benachteiligungen"→benachteiligung).
# Real users query in verbs; statutes are written in nouns. These bridges
# add the statutory noun form to the FTS-OR pool. Documented, deterministic,
# and honest: they are lexical, not semantic.
_STEM_BRIDGES: dict[str, tuple[str, ...]] = {
    "mind": ("minder", "minderung", "herabsetzung"),
    "benachteiligt": ("benachteiligung", "benachteiligungen"),
    "künd": ("kündigung", "kündigungs"),
    "kauf": ("kaufvertrag",),
    "zahlungsverzug": ("zahlungsverzug", "rückstand", "rückstände"),
    "instand": ("instandsetzung", "instandhaltung", "instandzuhalten"),
    "strafbefreit": ("rechtfertigung", "notwehr", "schuld"),
    "kaution": ("sicherheit", "sicherheitsleistung"),
}


def _expand_lexemes(lexemes: list[str]) -> list[str]:
    expanded: list[str] = []
    for lex in lexemes:
        expanded.append(lex)
        for key, extras in _STEM_BRIDGES.items():
            if lex == key or lex.startswith(key) or key.startswith(lex):
                expanded.extend(e for e in extras if e not in expanded)
    seen: set[str] = set()
    out = []
    for lex in expanded:
        if lex not in seen:
            seen.add(lex)
            out.append(lex)
    return out


def _rows_to_docs(rows) -> list[dict]:
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
                "mode": getattr(row, "mode", "lexical"),
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
