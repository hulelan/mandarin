import re

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from app.services.pdf_service import extract_text_from_pdf

router = APIRouter()


class PDFExtractResponse(BaseModel):
    text: str
    char_count: int


def clean_ocr_text(text: str) -> str:
    """Strip stray symbols that Tesseract commonly injects in Chinese OCR."""
    # Remove isolated symbols that aren't Chinese punctuation or meaningful
    # Keep: Chinese chars, Chinese punctuation (，。！？、；：""''《》), letters, digits, spaces, newlines
    text = re.sub(r'[~`\-_=+|\\<>^*#@$%&]', '', text)
    # Collapse multiple spaces/dots into single space
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\.{2,}', '', text)
    # Remove lone dots not part of ellipsis
    text = re.sub(r'(?<!\.)\.(?!\.)', '', text)
    # Strip leading/trailing whitespace per line
    text = '\n'.join(line.strip() for line in text.split('\n'))
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


@router.post("/extract-pdf", response_model=PDFExtractResponse)
async def extract_pdf(
    file: UploadFile = File(...),
    start_page: int = Form(1),
    end_page: int | None = Form(None),
    cleanup: bool = Form(True),
):
    """Extract Chinese text from a PDF with optional page range."""
    pdf_bytes = await file.read()
    text = extract_text_from_pdf(pdf_bytes, start_page, end_page)

    if cleanup:
        text = clean_ocr_text(text)

    chinese_count = sum(1 for ch in text if 0x4E00 <= ord(ch) <= 0x9FFF)
    return PDFExtractResponse(text=text, char_count=chinese_count)
