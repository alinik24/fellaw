"""FelLaw continuous-improvement loop: metrics engine (measurement only).

Karpathy-style discipline: no change without a measurement; no measurement
without a dated archive; every run must leave metrics.json comparable to the
previous run (same keys, monotonic timestamps).

Measures (all computed from real HTTP responses of a running backend):
  retrieval.recall_at_5  – golden law_code+section found in top-5 retrieval
  retrieval.mrr          – mean reciprocal rank over the golden set
  chat.citation_rate     – fraction of answers whose citations non-empty
  chat.grounding_rate    – answers whose citations include a golden doc
  chat.disclaimer_rate   – answers ending with the RDG disclaimer
  corpus.sections        – statute sections present in the database
  smoke.*                – route-level status codes

No metrics are invented: anything that cannot be measured is reported as
null with a "reason", never as a number.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import sys
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND))

from app.database import AsyncSessionLocal  # noqa: E402
from app.models.law_document import LawDocument  # noqa: E402
from sqlalchemy import func, select  # noqa: E402

METRICS_DIR = Path(__file__).resolve().parents[1] / "loop" / "metrics"
GOLDEN_SET = Path(__file__).resolve().parents[1] / "loop" / "golden_set.json"

# (query, law_code, section) — queries written as a real user would ask (S3).
GOLDEN_DEFAULT: list[dict] = [
    {"query": "Muss mein Vermieter die Wohnung instand halten?", "law_code": "BGB", "section": "§535"},
    {"query": "Darf der Vermieter wegen Zahlungsverzug fristlos kündigen?", "law_code": "BGB", "section": "§569"},
    {"query": "Welche Frist gilt für die ordentliche Kündigung durch den Vermieter?", "law_code": "BGB", "section": "§573"},
    {"query": "Was kann ich bei Mängeln der Mietsache tun?", "law_code": "BGB", "section": "§536"},
    {"query": "Ich wurde wegen meiner Herkunft benachteiligt, was gilt?", "law_code": "AGG", "section": "§1"},
    {"query": "Welcher Anspruch besteht bei Benachteiligung?", "law_code": "AGG", "section": "§15"},
    {"query": "Ich wurde bei der Polizei beschuldigt, welche Rechte habe ich bei der Vernehmung?", "law_code": "StPO", "section": "§136"},
    {"query": "Wann bekomme ich einen Pflichtverteidiger?", "law_code": "StPO", "section": "§141"},
    {"query": "Wann endet mein Arbeitsverhältnis durch Kündigungsschutz?", "law_code": "KSchG", "section": "§1"},
    {"query": "Wann gilt eine Kündigung als zugegangen?", "law_code": "KSchG", "section": "§4"},
    {"query": "Kann ich nach einer Tat strafbefreit werden?", "law_code": "StGB", "section": "§32"},
    {"query": "Was ist der Unterschied zwischen Mord und Totschlag?", "law_code": "StGB", "section": "§211"},
    {"query": "Darf ich als Mieter die Kaution vom Konto abziehen bei Mängeln?", "law_code": "BGB", "section": "§551"},
    {"query": "Was ist bei verbotener Eigenmacht des Vermieters zu beachten?", "law_code": "BGB", "section": "§858"},
    {"query": "Kann ich ohne Zustimmung des Vermieters die Miete mindern?", "law_code": "BGB", "section": "§536"},
]
def http_json(base: str, path: str, method: str = "GET", token: str | None = None, body: dict | None = None, timeout: int = 120):
    url = base.rstrip("/") + path
    data = None
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"raw": raw}
    except Exception as exc:  # network
        return 0, {"error": str(exc)}


async def corpus_sections() -> int:
    async with AsyncSessionLocal() as db:
        n = await db.scalar(select(func.count()).select_from(LawDocument).where(LawDocument.is_active == True))  # noqa: E712
        return int(n or 0)


def measure_retrieval(base: str, token: str | None, golden: list[dict]) -> dict:
    hits, ranks = [], []
    per_query = []
    for g in golden:
        qs = urllib.parse.quote(g["query"])
        status, data = http_json(base, f"/api/v1/laws/search?q={qs}&limit=5", token=token)
        if status != 200 or not isinstance(data, list):
            per_query.append({"query": g["query"], "ok": False, "status": status})
            if status == 0:
                # Backend unreachable: not a quality signal. Skip the query
                # entirely (null-with-reason) instead of scoring it as 0.
                continue
            hits.append(0)
            ranks.append(0.0)
            continue
        rank = 0
        found = False
        for i, doc in enumerate(data, start=1):
            if doc.get("law_code") == g["law_code"] and (doc.get("section") or "").replace(" ", "") == g["section"]:
                rank = i
                found = True
                break
        hits.append(1 if found else 0)
        ranks.append(1.0 / rank if rank else 0.0)
        per_query.append({"query": g["query"], "ok": True, "found": found, "rank": rank or None, "mode": data[0].get("mode") if data else None})
    recall = sum(hits) / len(hits) if hits else None
    mrr = statistics.fmean(ranks) if ranks else None
    return {"recall_at_5": recall, "mrr": round(mrr, 4) if mrr is not None else None, "per_query": per_query}


def measure_chat(base: str, token: str | None, golden: list[dict]) -> dict:
    """Chat metrics are only computed when a working model provider answers;
    otherwise reported as null with reason (never invented)."""
    if not token:
        return {"citation_rate": None, "grounding_rate": None, "disclaimer_rate": None, "reason": "no authenticated user token available"}
    answered, cited, grounded, disclaimed = 0, 0, 0, 0
    per_q = []
    for g in golden[:5]:
        status, data = http_json(base, "/api/v1/chat/message", method="POST", token=token, body={"message": g["query"], "conversation_type": "general"}, timeout=180)
        if status != 200 or not isinstance(data, dict) or not data.get("content"):
            per_q.append({"query": g["query"], "ok": False, "status": status})
            continue
        answered += 1
        cits = data.get("citations") or []
        if cits:
            cited += 1
            if any(c.get("law_code") == g["law_code"] and (c.get("section") or "").replace(" ", "") == g["section"] for c in cits):
                grounded += 1
        content = data.get("content") or ""
        if "Rechtsberatung" in content or "keine Rechtsberatung" in content or "legal advice" in content.lower():
            disclaimed += 1
        per_q.append({"query": g["query"], "ok": True, "citations": len(cits), "disclaimer": ("Rechtsberatung" in content or "legal advice" in content.lower())})
    if not answered:
        return {"citation_rate": None, "grounding_rate": None, "disclaimer_rate": None, "reason": "no successful chat response (provider/model unavailable)", "per_query": per_q}
    return {
        "citation_rate": cited / answered,
        "grounding_rate": grounded / answered,
        "disclaimer_rate": disclaimed / answered,
        "per_query": per_q,
    }


def measure_smoke(base: str) -> dict:
    out = {}
    for name, path, token in (
        ("health", "/health", None),
        ("capabilities", "/api/v1/platform/capabilities", None),
        ("openapi", "/api/openapi.json", None),
    ):
        status, _ = http_json(base, path, token=token, timeout=30)
        out[name] = status
    return out


async def run(base_url: str, token: str | None, label: str) -> dict:
    if not GOLDEN_SET.exists():
        GOLDEN_SET.parent.mkdir(parents=True, exist_ok=True)
        GOLDEN_SET.write_text(json.dumps(GOLDEN_DEFAULT, ensure_ascii=False, indent=2), encoding="utf-8")
    golden = json.loads(GOLDEN_SET.read_text(encoding="utf-8"))
    report = {
        "label": label,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "base_url": base_url,
        "corpus": {"sections": await corpus_sections()},
        "smoke": measure_smoke(base_url),
        "retrieval": measure_retrieval(base_url, token, golden),
        "chat": measure_chat(base_url, token, golden),
        "golden_set_size": len(golden),
    }
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:8000")
    ap.add_argument("--token", default=None)
    ap.add_argument("--label", default="adhoc")
    args = ap.parse_args()
    report = asyncio.run(run(args.base_url, args.token, args.label))
    METRICS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = METRICS_DIR / f"{stamp}_{args.label}.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k not in ("retrieval", "chat")}, ensure_ascii=False))
    r = report["retrieval"]
    c = report["chat"]
    print(f"retrieval recall@5={r['recall_at_5']} mrr={r['mrr']}")
    print(f"chat citation_rate={c.get('citation_rate')} grounding_rate={c.get('grounding_rate')} disclaimer_rate={c.get('disclaimer_rate')} reason={c.get('reason','-')}")
    print(f"report={out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
