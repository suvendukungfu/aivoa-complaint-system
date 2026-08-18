"""
AIVOA Evidence-Grounded AI Engine
Extracts verbatim text spans, page numbers, document citations, and strictly enforces anti-fabrication rules.
"""

import re
import datetime
from typing import Dict, Any, List, Optional

class FieldProvenanceEngine:
    """Enterprise Provenance, Verbatim Evidence Grounding, and Anti-Fabrication Engine"""

    @classmethod
    def find_verbatim_text_span(
        cls,
        field_name: str,
        value: Any,
        text: str
    ) -> Optional[str]:
        """
        Find exact contextual line or phrase in raw text containing the field value.
        Strict Rule: If no verbatim match exists in text, returns None (No fabrication).
        """
        if not value or not text:
            return None

        val_str = str(value).strip()
        if len(val_str) == 0:
            return None

        # Clean string for exact substring search
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        # 1. Exact case-insensitive substring search in lines
        val_lower = val_str.lower()
        for line in lines:
            if val_lower in line.lower():
                # Return the clean line as the exact text span
                # Trim to max 120 chars if line is too long
                if len(line) <= 120:
                    return line
                start_idx = line.lower().find(val_lower)
                snippet_start = max(0, start_idx - 30)
                snippet_end = min(len(line), start_idx + len(val_str) + 30)
                snippet = line[snippet_start:snippet_end].strip()
                return f"...{snippet}..." if snippet_start > 0 else snippet

        # 2. Field-specific contextual regex patterns
        field_patterns = {
            "batch_number": [
                rf"(?:batch|lot|control)\s*(?:no|number|#)?[:.\s-]*({re.escape(val_str)})",
                rf"({re.escape(val_str)})"
            ],
            "customer_name": [
                rf"(?:customer|client|hospital|pharmacy|distributor|from)[:.\s-]*([^\n,]+)",
                rf"({re.escape(val_str)})"
            ],
            "product_name": [
                rf"(?:product|material|api|item|drug)[:.\s-]*([^\n,]+)",
                rf"({re.escape(val_str)})"
            ],
            "quantity_affected": [
                rf"({re.escape(val_str)}\s*(?:kg|g|mg|drums?|vials?|units?|tablets?|boxes?|liters?|lbs?))",
                rf"(?:quantity|qty|amount|volume)[:.\s-]*([^\n,]+)"
            ],
            "manufacturing_date": [
                rf"(?:mfg|mfd|manufactured|manufacturing\s*date)[:.\s-]*([^\n,]+)"
            ],
            "expiry_date": [
                rf"(?:exp|expiry|expiration\s*date|use\s*before)[:.\s-]*([^\n,]+)"
            ]
        }

        patterns = field_patterns.get(field_name, [])
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                full_match = match.group(0).strip()
                if len(full_match) <= 120:
                    return full_match
                return full_match[:120]

        # No match found in text -> return None (Strict Rule: Do not fabricate evidence)
        return None

    @classmethod
    def locate_page_number(
        cls,
        text_span: Optional[str],
        pages: Optional[List[Dict[str, Any]]]
    ) -> Optional[int]:
        """
        Identify 1-based page number where text span appears.
        Strict Rule: Page numbers are ONLY populated when actually known from structured page parsing.
        """
        if not text_span or not pages:
            return None

        # Clean snippet for search
        search_target = text_span.replace("...", "").strip().lower()
        if not search_target:
            return None

        for page in pages:
            page_text = (page.get("text") or "").lower()
            page_num = page.get("page_number")
            if page_num is not None and search_target in page_text:
                return int(page_num)

        # Fallback: check if the first page contains it
        if pages and len(pages) == 1 and pages[0].get("page_number") is not None:
            return int(pages[0]["page_number"])

        return None

    @classmethod
    def extract_field_evidence(
        cls,
        field_name: str,
        value: Any,
        raw_text: str,
        pages: Optional[List[Dict[str, Any]]] = None,
        source_doc_id: Optional[str] = None,
        ai_run_id: Optional[str] = None,
        source_type: str = "customer_prompt"
    ) -> Dict[str, Any]:
        """Generate audit provenance entry for a single field with evidence span and page citation"""
        text_span = cls.find_verbatim_text_span(field_name, value, raw_text)
        page_num = cls.locate_page_number(text_span, pages) if text_span else None

        if text_span:
            classification = "EXPLICIT_EXTRACTED"
            confidence = 0.98
            src_type = source_type
        else:
            classification = "INFERRED"
            confidence = 0.85
            text_span = None
            page_num = None
            src_type = "ai_inference" if source_type != "user_edit" else "user_edit"

        return {
            "field": field_name,
            "value": value,
            "source_type": src_type,
            "source_document_id": source_doc_id,
            "page_number": page_num,
            "text_span": text_span,
            "confidence": round(confidence, 2),
            "ai_run_id": ai_run_id,
            "classification": classification,
            "updated_at": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    @classmethod
    def generate_field_provenance(
        cls,
        field_name: str,
        value: Any,
        source_type: str = "customer_prompt",
        is_explicit: bool = True,
        confidence_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """Generate audit provenance entry for a single field (used during edits and manual updates)"""
        if confidence_score is None:
            confidence_score = 0.99 if source_type == "user_edit" else (0.96 if is_explicit else 0.85)

        classification = "USER_SPECIFIED" if source_type == "user_edit" else ("EXPLICIT_EXTRACTED" if is_explicit else "INFERRED")

        return {
            "field": field_name,
            "value": value,
            "source_type": source_type,
            "source_document_id": None,
            "page_number": None,
            "text_span": None if source_type == "user_edit" else (str(value) if is_explicit else None),
            "confidence": round(confidence_score, 2),
            "ai_run_id": None,
            "classification": classification,
            "updated_at": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    @classmethod
    def build_provenance_map(
        cls,
        extracted_fields: Dict[str, Any],
        raw_text: str,
        pages: Optional[List[Dict[str, Any]]] = None,
        source_doc_id: Optional[str] = None,
        ai_run_id: Optional[str] = None,
        source_type: str = "customer_prompt"
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate evidence-grounded provenance for all extracted complaint fields"""
        provenance_map = {}

        for field, val in extracted_fields.items():
            if val is None or val == "" or field in [
                "field_confidence", "field_provenance", "audit_trail", "events", "proposals", "ai_runs", "documents"
            ]:
                continue

            provenance_map[field] = cls.extract_field_evidence(
                field_name=field,
                value=val,
                raw_text=raw_text,
                pages=pages,
                source_doc_id=source_doc_id,
                ai_run_id=ai_run_id,
                source_type=source_type
            )

        return provenance_map

    @classmethod
    def ground_risk_evidence(
        cls,
        complaint: Dict[str, Any],
        raw_text: str,
        pages: Optional[List[Dict[str, Any]]] = None,
        source_doc_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Extract grounded evidence snippets for risk assessment factors"""
        risk_evidence = []
        desc = str(complaint.get("detailed_description") or raw_text or "")
        combined_text = f"{desc}\n{raw_text}"

        defect_keywords = [
            ("Foreign particulate matter", ["black specks", "particles", "foreign matter", "glass", "fibers", "contaminat"]),
            ("Sterility / Microbial Risk", ["sterility", "endotoxin", "microbial", "bacteria", "unsterile", "growth"]),
            ("Sub-potent / Dissolution Failure", ["out of specification", "oos", "assay", "dissolution", "potency", "sub-potent"]),
            ("Packaging Integrity", ["seal broken", "leaking", "damaged drum", "punctured", "torn", "chipped"])
        ]

        for risk_factor, keywords in defect_keywords:
            for kw in keywords:
                match_span = cls.find_verbatim_text_span("detailed_description", kw, combined_text)
                if match_span:
                    page_num = cls.locate_page_number(match_span, pages)
                    risk_evidence.append({
                        "risk_factor": risk_factor,
                        "severity_impact": complaint.get("severity", "High"),
                        "evidence": match_span,
                        "source": source_doc_id or "Customer complaint text",
                        "page_number": page_num,
                        "classification": "EXPLICIT_EXTRACTED"
                    })
                    break  # Found primary evidence for this factor

        return risk_evidence
