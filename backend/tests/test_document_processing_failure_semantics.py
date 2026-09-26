"""Narrow document-processing failure semantics (blocker 7).

Real unit coverage (no DB) over process_uploaded_document's error branches:
optional provider unavailable + extracted text -> bounded completed state;
extraction failure -> failed; non-provider exception -> NOT provider unavailable.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch

import pytest

import app.services.document_service as ds
from app.services.ai_service import AIProviderUnavailable


class _Doc:
    def __init__(self):
        self.id = "00000000-0000-0000-0000-000000000001"
        self.case_id = "00000000-0000-0000-0000-000000000002"
        self.mime_type = "text/plain"
        self.file_path = "notice.txt"
        self.document_category = "correspondence"
        self.extracted_text = None
        self.ai_analysis = None
        self.processing_status = "pending"


class _DB:
    async def flush(self):
        pass

    async def refresh(self, obj):
        pass

    async def scalar(self, stmt):
        # 0 = no existing facts -> extraction seeds candidates in this test.
        return 0


def test_provider_unavailable_with_text_degrades_bounded():
    doc = _Doc()
    async def fake_extract(p):
        return "Kündigung zum 31.03.2026"
    async def fake_analysis(*a, **k):
        raise AIProviderUnavailable("provider down")
    with patch.object(ds, "extract_text_from_pdf", fake_extract), \
         patch.object(ds, "aiofiles", SimpleNamespace(open=None)), \
         patch.object(ds, "analyze_document_extraction", fake_analysis):
        doc.mime_type = "application/pdf"
        import asyncio
        asyncio.run(ds.process_uploaded_document(doc, _DB()))
    assert doc.processing_status == "completed"
    payload = json.loads(doc.ai_analysis)
    assert payload["provider_status"] == "unavailable"
    assert doc.extracted_text == "Kündigung zum 31.03.2026"


def test_extraction_failure_yields_failed():
    doc = _Doc()
    async def boom(p):
        raise RuntimeError("corrupt stream")
    with patch.object(ds, "extract_text_from_pdf", boom):
        doc.mime_type = "application/pdf"
        import asyncio
        asyncio.run(ds.process_uploaded_document(doc, _DB()))
    assert doc.processing_status == "failed"
    assert doc.ai_analysis is None


def test_non_provider_exception_not_mislabeled():
    doc = _Doc()
    async def fake_extract(p):
        return "Kündigung zum 31.03.2026"
    async def boom(*a, **k):
        raise ValueError("serialization bug")
    with patch.object(ds, "extract_text_from_pdf", fake_extract), \
         patch.object(ds, "analyze_document_extraction", boom):
        doc.mime_type = "application/pdf"
        import asyncio
        asyncio.run(ds.process_uploaded_document(doc, _DB()))
    assert doc.processing_status == "failed"
    assert doc.ai_analysis is None
