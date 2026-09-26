"""App-level smoke: the full app imports and its OpenAPI schema builds without a DB.

Regression guard for the `/api/openapi.json` 500 caused by a bad
`Annotated[Any, Depends(...)] = None` default in chat.py.
"""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://x:y@127.0.0.1:1/none")


def test_app_openapi_schema_builds():
    from app.main import app

    schema = app.openapi()
    paths = schema["paths"]
    assert "/api/v1/platform/capabilities" in paths
    assert "/api/v1/platform/overview" in paths
    assert "/api/v1/chat/stream" in paths
    assert len(paths) > 50


def test_platform_routes_registered_once():
    from app.main import app

    platform = [r.path for r in app.routes if r.path.startswith("/api/v1/platform")]
    assert sorted(platform) == [
        "/api/v1/platform/bot/turn",
        "/api/v1/platform/capabilities",
        "/api/v1/platform/overview",
        "/api/v1/platform/overview/text",
    ]
