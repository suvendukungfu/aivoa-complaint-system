import os
import re
import hashlib
import logging
from typing import Tuple, List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.services.document_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    extract_text_from_eml,
    extract_document_pages
)
from backend.app.models.complaint import ComplaintDocument
from backend.app.repositories.document_repository import DocumentRepository

logger = logging.getLogger(__name__)

def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filename to prevent directory traversal and injection"""
    norm = (filename or "document").replace("\\", "/").split("/")[-1]
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', norm)
    clean = re.sub(r'\.{2,}', '_', clean)
    clean = clean.strip("._ ")
    return clean or "uploaded_document"

class DocumentService:
    """Enterprise Document Processing Service with sanitization, pagination metadata, and persistence"""

    def __init__(self, db: Session):
        self.db = db
        self.doc_repo = DocumentRepository(db)

    async def process_and_extract_document(
        self,
        file: UploadFile
    ) -> Tuple[str, str, int, str, List[Dict[str, Any]], str]:
        """
        Validate, sanitize, and parse document text with structured page metadata.
        Returns:
            Tuple of (sanitized_filename, full_text, file_size_bytes, content_type, pages, sha256_hash)
        """
        raw_filename = file.filename or "uploaded_file"
        filename = sanitize_filename(raw_filename)
        
        ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File size ({file_size / (1024*1024):.1f}MB) exceeds limit of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f}MB"
            )

        # Compute cryptographic SHA-256 for document integrity verification
        file_hash = hashlib.sha256(content).hexdigest()

        # Extract structured pages
        pages = extract_document_pages(content, ext)
        full_text = "\n\n".join(p["text"] for p in pages if p.get("text"))

        content_type = file.content_type or "application/octet-stream"
        logger.info(f"Successfully processed document '{filename}' ({file_size} bytes, {len(pages)} pages, text: {len(full_text)} chars)")
        return filename, full_text, file_size, content_type, pages, file_hash

    def attach_document_to_complaint(
        self,
        complaint_id: int,
        filename: str,
        content_type: str,
        file_size: int,
        extracted_text: str,
        file_hash: Optional[str] = None,
        evidence_spans: Optional[List[Dict[str, Any]]] = None
    ) -> ComplaintDocument:
        """Persist document attachment metadata linked to a complaint record"""
        doc = ComplaintDocument(
            complaint_id=complaint_id,
            filename=filename,
            file_hash=file_hash,
            content_type=content_type,
            file_size=file_size,
            extracted_text=extracted_text[:10000] if extracted_text else None,
            evidence_spans=evidence_spans or []
        )
        return self.doc_repo.create(doc)
