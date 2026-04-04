"""
OpenRouter Vision Service
Handles image analysis and document OCR using OpenRouter API
"""

import os
import base64
import logging
from typing import Dict, Any, Optional
import httpx
from pathlib import Path

logger = logging.getLogger(__name__)


class OpenRouterVisionService:
    """Service for analyzing images using OpenRouter vision models"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.api_base = "https://openrouter.ai/api/v1"

        # Best vision model available on OpenRouter as of 2026
        self.vision_model = os.getenv("OPENROUTER_VISION_MODEL", "anthropic/claude-3.5-sonnet")

        if not self.api_key:
            logger.warning(
                "OpenRouter API key not configured. "
                "Set OPENROUTER_API_KEY environment variable."
            )
            self.client = None
        else:
            self.client = httpx.AsyncClient(
                base_url=self.api_base,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://fellaw.com",
                    "X-Title": "fellaw - Legal Aid Platform"
                },
                timeout=60.0
            )

    async def analyze_image(
        self,
        image_path: str,
        prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze an image using OpenRouter vision model

        Args:
            image_path: Path to the image file
            prompt: Optional custom prompt for analysis

        Returns:
            Analysis results including extracted text and description
        """
        if not self.client:
            raise ValueError("OpenRouter service not configured")

        try:
            # Read and encode image
            with open(image_path, "rb") as f:
                image_data = f.read()

            # Get file extension for MIME type
            ext = Path(image_path).suffix.lower()
            mime_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }
            mime_type = mime_types.get(ext, 'image/jpeg')

            # Encode to base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            image_url = f"data:{mime_type};base64,{base64_image}"

            # Default prompt for legal document analysis
            if not prompt:
                prompt = """Analyze this image and extract all text content.
                If this is a legal document, identify:
                1. Document type (contract, notice, receipt, etc.)
                2. All visible text (perform OCR)
                3. Key information like dates, amounts, names, addresses
                4. Any important legal terms or clauses

                Provide the response in structured format."""

            # Make API request
            response = await self.client.post(
                "/chat/completions",
                json={
                    "model": self.vision_model,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_url
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 2000,
                    "temperature": 0.1
                }
            )

            if response.status_code != 200:
                error_text = response.text
                logger.error(f"OpenRouter API error: {response.status_code} - {error_text}")
                raise Exception(f"OpenRouter API error: {response.status_code}")

            result = response.json()
            extracted_text = result["choices"][0]["message"]["content"]

            return {
                "text": extracted_text,
                "extracted_text": extracted_text,
                "model_used": self.vision_model,
                "confidence": 0.95,  # OpenRouter doesn't provide confidence scores
                "metadata": {
                    "provider": "openrouter",
                    "image_size": len(image_data),
                    "mime_type": mime_type
                }
            }

        except Exception as e:
            logger.error(f"Error analyzing image with OpenRouter: {str(e)}")
            raise

    async def analyze_document_image(
        self,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Analyze a document image and extract structured data

        Args:
            image_path: Path to the document image

        Returns:
            Structured document data
        """
        prompt = """Analyze this legal document image and extract:

1. **Document Type**: What kind of document is this?
2. **Full Text**: Perform OCR and extract all visible text
3. **Key Dates**: Extract any dates mentioned
4. **Monetary Amounts**: Extract any amounts mentioned (with currency)
5. **Party Names**: Extract names of people or organizations
6. **Important Clauses**: Identify any important legal terms or clauses
7. **Document Number**: Any reference numbers, case numbers, or IDs

Format the response as JSON with these fields:
{
  "document_type": "...",
  "full_text": "...",
  "dates": [...],
  "amounts": [...],
  "parties": [...],
  "clauses": [...],
  "reference_numbers": [...]
}"""

        result = await self.analyze_image(image_path, prompt)

        # Try to parse JSON from response
        import json
        try:
            # Extract JSON from markdown code blocks if present
            text = result["extracted_text"]
            if "```json" in text:
                json_start = text.find("```json") + 7
                json_end = text.find("```", json_start)
                json_str = text[json_start:json_end].strip()
            elif "```" in text:
                json_start = text.find("```") + 3
                json_end = text.find("```", json_start)
                json_str = text[json_start:json_end].strip()
            else:
                json_str = text

            structured_data = json.loads(json_str)
            result["structured_data"] = structured_data
        except Exception as e:
            logger.warning(f"Could not parse structured data: {e}")
            result["structured_data"] = {}

        return result

    async def analyze_invoice(
        self,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Analyze an invoice image

        Args:
            image_path: Path to the invoice image

        Returns:
            Structured invoice data
        """
        prompt = """Analyze this invoice/receipt image and extract:

1. **Vendor/Seller Name**
2. **Invoice Number**
3. **Date**
4. **Total Amount** (with currency)
5. **Line Items** (description and amount for each)
6. **Tax Amount**
7. **Payment Terms**
8. **Vendor Address**

Provide structured JSON format."""

        return await self.analyze_image(image_path, prompt)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()


# Singleton instance
_openrouter_vision_service = None


def get_openrouter_vision_service() -> OpenRouterVisionService:
    """Get or create the OpenRouterVisionService singleton"""
    global _openrouter_vision_service
    if _openrouter_vision_service is None:
        _openrouter_vision_service = OpenRouterVisionService()
    return _openrouter_vision_service
