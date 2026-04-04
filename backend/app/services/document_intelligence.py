"""
Azure Document Intelligence Service
Handles OCR, document analysis, and data extraction from images and PDFs
"""

import os
import logging
from typing import Dict, List, Any, Optional
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.ai.formrecognizer import AnalyzeResult

logger = logging.getLogger(__name__)


class DocumentIntelligenceService:
    """Service for analyzing documents using Azure Document Intelligence"""

    def __init__(self):
        endpoint = os.getenv("DOCINTEL_ENDPOINT")
        api_key = os.getenv("DOCINTEL_API_KEY")

        if not endpoint or not api_key:
            logger.warning(
                "Azure Document Intelligence not configured. "
                "Set DOCINTEL_ENDPOINT and DOCINTEL_API_KEY environment variables."
            )
            self.client = None
        else:
            self.client = DocumentAnalysisClient(
                endpoint=endpoint,
                credential=AzureKeyCredential(api_key)
            )

    async def analyze_document(
        self,
        document_path: str,
        model_id: str = "prebuilt-document"
    ) -> Dict[str, Any]:
        """
        Analyze a document using Azure Document Intelligence

        Args:
            document_path: Path to the document file
            model_id: Model to use (prebuilt-document, prebuilt-invoice, prebuilt-receipt, etc.)

        Returns:
            Extracted document data including text, key-value pairs, tables
        """
        if not self.client:
            raise ValueError("Document Intelligence service not configured")

        try:
            with open(document_path, "rb") as f:
                poller = self.client.begin_analyze_document(
                    model_id=model_id,
                    document=f
                )
                result: AnalyzeResult = poller.result()

            # Extract structured data
            extracted_data = {
                "text": self._extract_text(result),
                "key_value_pairs": self._extract_key_value_pairs(result),
                "tables": self._extract_tables(result),
                "entities": self._extract_entities(result),
                "pages": len(result.pages),
                "languages": [lang.locale for lang in result.languages] if result.languages else []
            }

            logger.info(f"Successfully analyzed document: {document_path}")
            return extracted_data

        except Exception as e:
            logger.error(f"Error analyzing document {document_path}: {str(e)}")
            raise

    async def analyze_legal_document(
        self,
        document_path: str
    ) -> Dict[str, Any]:
        """
        Analyze a legal document and extract relevant information

        Args:
            document_path: Path to the legal document

        Returns:
            Structured legal document data
        """
        # Use general document model for legal documents
        result = await self.analyze_document(document_path, model_id="prebuilt-document")

        # Extract legal-specific information
        legal_data = {
            "full_text": result["text"],
            "key_fields": result["key_value_pairs"],
            "tables": result["tables"],
            "entities": result["entities"],
            "metadata": {
                "pages": result["pages"],
                "languages": result["languages"]
            },
            # Add legal-specific extraction
            "extracted_dates": self._extract_dates_from_text(result["text"]),
            "extracted_amounts": self._extract_amounts_from_text(result["text"]),
            "parties_mentioned": self._extract_party_names(result["text"])
        }

        return legal_data

    async def analyze_image(
        self,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Analyze an image and extract text (OCR)

        Args:
            image_path: Path to the image file

        Returns:
            Extracted text and layout information
        """
        return await self.analyze_document(image_path, model_id="prebuilt-read")

    async def analyze_invoice(
        self,
        invoice_path: str
    ) -> Dict[str, Any]:
        """
        Analyze an invoice document

        Args:
            invoice_path: Path to the invoice file

        Returns:
            Structured invoice data
        """
        result = await self.analyze_document(invoice_path, model_id="prebuilt-invoice")
        return result

    async def analyze_receipt(
        self,
        receipt_path: str
    ) -> Dict[str, Any]:
        """
        Analyze a receipt document

        Args:
            receipt_path: Path to the receipt file

        Returns:
            Structured receipt data
        """
        result = await self.analyze_document(receipt_path, model_id="prebuilt-receipt")
        return result

    def _extract_text(self, result: AnalyzeResult) -> str:
        """Extract all text content from the document"""
        if not result.content:
            return ""
        return result.content

    def _extract_key_value_pairs(self, result: AnalyzeResult) -> List[Dict[str, str]]:
        """Extract key-value pairs from the document"""
        pairs = []
        if result.key_value_pairs:
            for kv_pair in result.key_value_pairs:
                key = kv_pair.key.content if kv_pair.key else ""
                value = kv_pair.value.content if kv_pair.value else ""
                if key or value:
                    pairs.append({"key": key, "value": value})
        return pairs

    def _extract_tables(self, result: AnalyzeResult) -> List[Dict[str, Any]]:
        """Extract tables from the document"""
        tables = []
        if result.tables:
            for table_idx, table in enumerate(result.tables):
                table_data = {
                    "index": table_idx,
                    "row_count": table.row_count,
                    "column_count": table.column_count,
                    "cells": []
                }

                for cell in table.cells:
                    table_data["cells"].append({
                        "row_index": cell.row_index,
                        "column_index": cell.column_index,
                        "content": cell.content,
                        "kind": cell.kind if hasattr(cell, "kind") else "content"
                    })

                tables.append(table_data)
        return tables

    def _extract_entities(self, result: AnalyzeResult) -> List[Dict[str, str]]:
        """Extract named entities from the document"""
        entities = []
        if hasattr(result, "entities") and result.entities:
            for entity in result.entities:
                entities.append({
                    "category": entity.category,
                    "content": entity.content,
                    "confidence": entity.confidence
                })
        return entities

    def _extract_dates_from_text(self, text: str) -> List[str]:
        """Extract potential dates from text using regex"""
        import re
        # Simple date extraction - can be enhanced
        date_patterns = [
            r'\d{1,2}\.\d{1,2}\.\d{2,4}',  # DD.MM.YYYY
            r'\d{1,2}/\d{1,2}/\d{2,4}',    # DD/MM/YYYY
            r'\d{4}-\d{1,2}-\d{1,2}'       # YYYY-MM-DD
        ]

        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text))
        return list(set(dates))  # Remove duplicates

    def _extract_amounts_from_text(self, text: str) -> List[str]:
        """Extract monetary amounts from text"""
        import re
        # Extract amounts like €150, 150€, EUR 150, etc.
        amount_patterns = [
            r'€\s?\d+[.,]?\d*',
            r'\d+[.,]?\d*\s?€',
            r'EUR\s?\d+[.,]?\d*',
            r'\d+[.,]?\d*\s?EUR'
        ]

        amounts = []
        for pattern in amount_patterns:
            amounts.extend(re.findall(pattern, text))
        return list(set(amounts))

    def _extract_party_names(self, text: str) -> List[str]:
        """
        Extract potential party names from legal documents
        This is a simplified version - can be enhanced with NER
        """
        # This would typically use Named Entity Recognition (NER)
        # For now, return empty list - can be enhanced
        return []


# Singleton instance
_document_intelligence_service = None


def get_document_intelligence_service() -> DocumentIntelligenceService:
    """Get or create the DocumentIntelligenceService singleton"""
    global _document_intelligence_service
    if _document_intelligence_service is None:
        _document_intelligence_service = DocumentIntelligenceService()
    return _document_intelligence_service
