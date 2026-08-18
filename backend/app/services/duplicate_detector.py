from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.complaint import Complaint
from backend.app.schemas.complaint import DuplicateMatch

def calculate_jaccard_similarity(str1: str, str2: str) -> float:
    """Calculate token-based Jaccard similarity between two text descriptions"""
    if not str1 or not str2:
        return 0.0
    set1 = set(str1.lower().split())
    set2 = set(str2.lower().split())
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return float(intersection) / float(union) if union > 0 else 0.0

def find_duplicate_complaint(complaint_data: Dict[str, Any], db: Session) -> Optional[DuplicateMatch]:
    """Scan database for potential duplicate or recurring complaints"""
    batch = complaint_data.get("batch_number")
    product = complaint_data.get("product_name")
    ctype = complaint_data.get("complaint_type")
    desc = complaint_data.get("detailed_description") or ""

    if not batch and not product:
        return None

    # Fetch recent complaints (up to 50)
    existing_records = db.query(Complaint).order_by(Complaint.created_at.desc()).limit(50).all()

    best_match = None
    highest_score = 0.0
    reason_msg = ""

    for rec in existing_records:
        score = 0.0
        reasons = []

        # Same batch number is a strong signal (50 points)
        if batch and rec.batch_number and batch.strip().upper() == rec.batch_number.strip().upper():
            score += 0.50
            reasons.append(f"identical batch '{batch}'")

        # Same product name (25 points)
        if product and rec.product_name and product.strip().lower() in rec.product_name.strip().lower():
            score += 0.25
            reasons.append(f"same product '{rec.product_name}'")

        # Same complaint type (15 points)
        if ctype and rec.complaint_type and ctype.strip().lower() == rec.complaint_type.strip().lower():
            score += 0.15
            reasons.append(f"matching classification '{ctype}'")

        # Description text similarity (up to 10 points)
        text_sim = calculate_jaccard_similarity(desc, rec.detailed_description or "")
        score += (text_sim * 0.10)

        if score > 0.60 and score > highest_score:
            highest_score = score
            best_match = rec
            reason_msg = f"Found prior complaint with {', '.join(reasons)}."

    if best_match and highest_score >= 0.65:
        return DuplicateMatch(
            complaint_number=best_match.complaint_number,
            similarity=round(highest_score, 2),
            reason=reason_msg,
            product_name=best_match.product_name,
            batch_number=best_match.batch_number,
            severity=best_match.severity,
            created_at=best_match.created_at.strftime("%d %B %Y") if best_match.created_at else None
        )

    return None
