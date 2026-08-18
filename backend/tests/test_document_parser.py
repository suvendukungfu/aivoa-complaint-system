import os
import pytest
from backend.app.services.document_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    extract_text_from_eml
)

def test_parse_sample_pdf():
    pdf_path = "sample_data/Sample_1_Foreign_Particles_Paracetamol.pdf"
    assert os.path.exists(pdf_path)
    with open(pdf_path, "rb") as f:
        content = f.read()
    text = extract_text_from_pdf(content)
    assert "Paracetamol" in text
    assert "PA240812" in text
    assert "particles" in text.lower()

def test_parse_sample_txt():
    txt_path = "sample_data/Sample_2_Packaging_Defect_Amoxicillin.txt"
    assert os.path.exists(txt_path)
    with open(txt_path, "rb") as f:
        content = f.read()
    text = extract_text_from_txt(content)
    assert "Amoxicillin" in text
    assert "AMX-2026-884" in text

def test_parse_sample_docx():
    docx_path = "sample_data/Sample_3_Incorrect_Strength_Ibuprofen.docx"
    assert os.path.exists(docx_path)
    with open(docx_path, "rb") as f:
        content = f.read()
    text = extract_text_from_docx(content)
    assert "Ibuprofen" in text
    assert "IBU-DC-9011" in text

def test_parse_sample_eml():
    eml_path = "sample_data/Sample_4_Email_Complaint_Metformin.eml"
    assert os.path.exists(eml_path)
    with open(eml_path, "rb") as f:
        content = f.read()
    text = extract_text_from_eml(content)
    assert "Metformin" in text
    assert "MET-26-04" in text
