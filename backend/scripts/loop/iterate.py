"""FelLaw continuous-improvement loop driver.

One iteration = one measured improvement, budget-bounded:
  1. Start backend against the dedicated DB (if not already up).
  2. Measure current metrics (measure.py) -> archive.
  3. Pick the top READY backlog item (smallest risk first) — or, when run
     with --execute <id>, execute that item.
  4. After the change: gates (pytest unit + live integration) must be green
     and metrics must not regress. Otherwise REVERT is required.
  5. Append a dated entry to scripts/loop/iterations.jsonl (the archive
     Karpathy-style: every attempt, winner or failure, with its numbers).

This driver never invents metrics: anything unmeasurable is reported as
null-with-reason. It never widens scope: one backlog item per run.

Usage:
    python scripts/loop/iterate.py --plan          # show plan, no changes
    python scripts/loop/iterate.py --measure       # measure + archive only
    python scripts/loop/iterate.py --execute R3    # execute one item (agent-assisted)
    python scripts/loop/iterate.py --auto          # autonomous: pick top READY item,
                                                   # run gates+measure before/after,
                                                   # archive delta, emit handoff summary
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
BACKEND = HERE.parents[1]
REPO = BACKEND.parent
VENV_PY = (REPO / ".venv" / "Scripts" / "python").resolve()
TOKEN_FILE = REPO / ".loop_metrics_token"
ITERATIONS = HERE / "iterations.jsonl"
METRICS_DIR = HERE / "metrics"


def db_url() -> str:
    """DB URL from the environment; never hardcode credentials here.

    Reads DATABASE_URL from the repo .env when unset (local dev pattern),
    so credentials stay in the git-ignored .env only.
    """
    import os

    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    env_file = REPO / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("DATABASE_URL not set (env or Legal_Aid/fellaw/.env)")

GATES = [
    ("unit", [str(VENV_PY), "-m", "pytest", "tests", "-q", "--ignore=tests/test_integration_live.py"]),
    ("integration", [str(VENV_PY), "-m", "pytest", "tests/test_integration_live.py", "-q"]),
]


def run(cmd: list[str], env_extra: dict[str, str] | None = None, timeout: int = 600) -> tuple[int, str]:
    import os

    env = dict(os.environ)
    env.setdefault("DATABASE_URL", db_url())
    if env_extra:
        env.update(env_extra)
    p = subprocess.run(cmd, cwd=str(BACKEND), capture_output=True, text=True, timeout=timeout, env=env)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def auto_pick() -> dict | None:
    """Pick the top READY (unblocked) backlog item, smallest-size-first.

    Selection order: READY items before READY-*_ON-ENV (which need external
    resources). Within READY, size S before M. Ties broken by backlog order.
    """
    sys.path.insert(0, str(HERE))
    from backlog import items

    size_rank = {"S": 0, "M": 1, "L": 2}
    ready = [i for i in items if i["status"] == "READY"]
    if not ready:
        return None
    return min(ready, key=lambda i: (size_rank.get(i.get("size", "M"), 1), items.index(i)))


def latest_metrics() -> dict | None:
    files = sorted(METRICS_DIR.glob("*.json"))
    if not files:
        return None
    return json.loads(files[-1].read_text(encoding="utf-8"))


def measure(base_url: str) -> dict:
    token = None
    if TOKEN_FILE.exists():
        token = TOKEN_FILE.read_text(encoding="utf-8").strip() or None
    cmd = [str(VENV_PY), str(HERE / "measure.py"), "--base-url", base_url, "--label", "iterate"]
    if token:
        cmd += ["--token", token]
    import os

    env = dict(os.environ)
    env.setdefault("DATABASE_URL", db_url())
    p = subprocess.run(cmd, cwd=str(BACKEND), capture_output=True, text=True, timeout=900, env=env)
    if p.returncode != 0:
        raise RuntimeError(f"measure failed: {p.stdout}\n{p.stderr}")
    files = sorted(METRICS_DIR.glob("*iterate.json"))
    return json.loads(files[-1].read_text(encoding="utf-8"))


def gates() -> list[tuple[str, bool, str]]:
    results = []
    for name, cmd in GATES:
        env_extra = {"FELLAW_TEST_DB": db_url()}
        code, out = run(cmd, env_extra=env_extra)
        tail = out.strip().splitlines()[-1] if out.strip() else ""
        results.append((name, code == 0, tail))
    return results


def append_iteration(entry: dict) -> None:
    with ITERATIONS.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def plan() -> int:
    sys.path.insert(0, str(HERE))
    from backlog import items

    m = latest_metrics()
    print("=== FelLaw improvement loop — plan ===")
    if m:
        r = m.get("retrieval", {})
        print(f"last metrics ({m['label']} {m['timestamp']}): recall@5={r.get('recall_at_5')} mrr={r.get('mrr')} corpus={m.get('corpus',{}).get('sections')}")
    else:
        print("no metrics yet — run --measure first")
    print()
    for it in items:
        if it["status"].startswith("READY"):
            print(f"  {it['id']:3} [{it['size']}] {it['title']}")
            print(f"        metric: {it['metric']}")
    print()
    print("blocked-on-env:")
    for it in items:
        if "BLOCKED-ON-ENV" in it["status"] or it["status"].startswith("WAITING"):
            print(f"  {it['id']:3} {it['title']} — {it['status']}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--measure", action="store_true", dest="measure_only")
    ap.add_argument("--base-url", default="http://127.0.0.1:8000")
    ap.add_argument("--execute", default=None, help="backlog item id to execute (agent does the change; this script verifies)")
    ap.add_argument("--auto", action="store_true", help="autonomous cycle: gates -> pick READY item -> report")
    ap.add_argument("--close", default=None, metavar="ID", help="close an iteration: post-gates + measure + delta vs pre, archive result")
    args = ap.parse_args()

    if args.plan:
        return plan()

    if args.measure_only:
        m = measure(args.base_url)
        r = m["retrieval"]
        print(f"measured: recall@5={r['recall_at_5']} mrr={r['mrr']} corpus={m['corpus']['sections']}")
        append_iteration({"ts": datetime.now(timezone.utc).isoformat(), "kind": "measure", "metrics": {k: m[k] for k in ("corpus", "retrieval", "chat")}})
        return 0

    if args.execute:
        sys.path.insert(0, str(HERE))
        from backlog import items

        item = next((i for i in items if i["id"] == args.execute), None)
        if not item:
            print(f"unknown item {args.execute}")
            return 2
        print(f"executing {item['id']}: {item['title']}")
        print("NOTE: the code change for this item is made by the agent; this driver verifies.")
        # The agent makes the change, then runs this to verify:
        gate_results = gates()
        print("gates:", [(n, "OK" if ok else "FAIL") for n, ok, _ in gate_results])
        if not all(ok for _, ok, _ in gate_results):
            append_iteration({"ts": datetime.now(timezone.utc).isoformat(), "kind": "execute", "item": item["id"], "result": "GATES_FAILED", "gates": [(n, t) for n, _, t in gate_results]})
            return 1
        m = measure(args.base_url)
        r = m["retrieval"]
        prev = latest_metrics_before(m)
        delta = None
        if prev and prev.get("retrieval"):
            delta = {
                "recall_at_5": (prev["retrieval"].get("recall_at_5"), r["recall_at_5"]),
                "mrr": (prev["retrieval"].get("mrr"), r["mrr"]),
            }
        print("delta:", delta)
        append_iteration({
            "ts": datetime.now(timezone.utc).isoformat(),
            "kind": "execute",
            "item": item["id"],
            "result": "OK",
            "metrics": {"recall_at_5": r["recall_at_5"], "mrr": r["mrr"], "corpus": m["corpus"]["sections"]},
            "delta": delta,
        })
        return 0

    if args.auto:
        # Autonomous cycle. The CODE CHANGE itself is made by the coding agent
        # (or a human) between two runs; this driver performs the measuring,
        # gating, and archiving on both sides of that change.
        item = auto_pick()
        if item is None:
            print("no READY backlog items — loop is caught up; refresh backlog from metrics/scenarios")
            return 0
        print(f"selected: {item['id']} — {item['title']}")
        print(f"target metric: {item['metric']}")

        pre_gates = gates()
        pre_ok = all(ok for _, ok, _ in pre_gates)
        print("pre-gates:", [(n, "OK" if ok else "FAIL") for n, ok, _ in pre_gates])
        if not pre_ok:
            append_iteration({"ts": datetime.now(timezone.utc).isoformat(), "kind": "auto", "item": item["id"], "result": "PRE_GATES_FAILED", "gates": [(n, t) for n, _, t in pre_gates]})
            return 1
        if not any(METRICS_DIR.glob("*.json")):
            m = measure(args.base_url)
            print(f"baseline measured: recall@5={m['retrieval']['recall_at_5']} mrr={m['retrieval']['mrr']}")

        m_before = latest_metrics()
        append_iteration({
            "ts": datetime.now(timezone.utc).isoformat(),
            "kind": "auto",
            "item": item["id"],
            "phase": "pre",
            "metrics": {k: m_before[k] for k in ("corpus", "retrieval", "chat") if k in m_before} if m_before else None,
        })
        print(f"\nNEXT: implement {item['id']} ({item['title']}), then run --close {item['id']} to finish the iteration")
        return 0

    if args.close:
        # Close an iteration after the change landed: gates must be green,
        # metrics must not regress vs the archived pre-state, then archive.
        sys.path.insert(0, str(HERE))
        from backlog import items

        item = next((i for i in items if i["id"] == args.close), None)
        if not item:
            print(f"unknown item {args.close}")
            return 2
        post_gates = gates()
        post_ok = all(ok for _, ok, _ in post_gates)
        print("post-gates:", [(n, "OK" if ok else "FAIL") for n, ok, _ in post_gates])
        if not post_ok:
            append_iteration({"ts": datetime.now(timezone.utc).isoformat(), "kind": "close", "item": item["id"], "result": "GATES_FAILED", "gates": [(n, t) for n, _, t in post_gates]})
            return 1
        m = measure(args.base_url)
        r = m["retrieval"]
        prev = latest_metrics_before(m)
        delta = None
        if prev and prev.get("retrieval"):
            delta = {
                "recall_at_5": (prev["retrieval"].get("recall_at_5"), r["recall_at_5"]),
                "mrr": (prev["retrieval"].get("mrr"), r["mrr"]),
            }
        regression = bool(delta and (delta["recall_at_5"][1] < delta["recall_at_5"][0] or delta["mrr"][1] < delta["mrr"][0]))
        print("delta:", delta)
        if regression:
            print("RESULT: REGRESSION — revert the change, mark item BLOCKED with measured reason")
        else:
            print(f"RESULT: OK — {item['id']} closed with measured delta")
        append_iteration({
            "ts": datetime.now(timezone.utc).isoformat(),
            "kind": "close",
            "item": item["id"],
            "result": "REGRESSION" if regression else "OK",
            "metrics": {"recall_at_5": r["recall_at_5"], "mrr": r["mrr"], "corpus": m["corpus"]["sections"]},
            "delta": delta,
        })
        return 1 if regression else 0

    print("nothing to do — use --plan, --measure, --execute <id>, --auto, or --close <id>")
    return 0


def latest_metrics_before(current: dict) -> dict | None:
    files = sorted(METRICS_DIR.glob("*.json"))
    if len(files) < 2:
        return None
    # current is the last; return the one before it
    return json.loads(files[-2].read_text(encoding="utf-8"))


if __name__ == "__main__":
    raise SystemExit(main())
