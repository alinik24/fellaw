"""Test bootstrap: make `app` importable and keep tests DB-free by default."""
from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Never let unit tests pick up real provider credentials.
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("AI_PROVIDER", "local")
