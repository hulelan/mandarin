from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from app.services.pdf_service import extract_text_from_pdf

router = APIRouter()


class PDFExtractResponse(BaseModel):
    text: str
    char_count: int


@router.post("/extract-pdf", response_model=PDFExtractResponse)
async def extract_pdf(
    file: UploadFile = File(...),
    start_page: int = Form(1),
    end_page: int | None = Form(None),
):
    """Extract Chinese text from a PDF with optional page range."""
    pdf_bytes = await file.read()
    text = extract_text_from_pdf(pdf_bytes, start_page, end_page)

    chinese_count = sum(1 for ch in text if 0x4E00 <= ord(ch) <= 0x9FFF)
    return PDFExtractResponse(text=text, char_count=chinese_count)
