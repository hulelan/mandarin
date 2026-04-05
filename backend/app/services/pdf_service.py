import base64
import os

import httpx
import pymupdf


def extract_text_from_pdf(
    pdf_bytes: bytes,
    start_page: int = 1,
    end_page: int | None = None,
) -> str:
    """Extract Chinese text from a PDF. Falls back to cloud OCR if text extraction yields little content."""
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)

    start_idx = max(0, start_page - 1)
    end_idx = min(total_pages, (end_page or start_page)) - 1

    # First try: direct text extraction
    text_parts = []
    for page_num in range(start_idx, end_idx + 1):
        page = doc[page_num]
        text_parts.append(page.get_text())

    text = "\n".join(text_parts).strip()

    chinese_char_count = sum(1 for ch in text if _is_chinese(ch))
    if chinese_char_count >= 5:
        doc.close()
        return text

    # Fallback: Google Cloud Vision OCR (runs on Google's servers, not ours)
    ocr_dpi = int(os.environ.get("OCR_DPI", "150"))
    ocr_parts = []
    for page_num in range(start_idx, end_idx + 1):
        page = doc[page_num]
        pix = page.get_pixmap(dpi=ocr_dpi)
        img_bytes = pix.tobytes("png")
        del pix

        ocr_text = _ocr_google_vision(img_bytes)
        del img_bytes
        if ocr_text:
            ocr_parts.append(ocr_text)

    doc.close()
    return "\n".join(ocr_parts).strip()


def _ocr_google_vision(png_bytes: bytes) -> str:
    """OCR via Google Cloud Vision API. Needs GOOGLE_CLOUD_API_KEY env var."""
    api_key = os.environ.get("GOOGLE_CLOUD_API_KEY", "")
    if not api_key:
        return ""

    b64_image = base64.b64encode(png_bytes).decode("utf-8")

    payload = {
        "requests": [{
            "image": {"content": b64_image},
            "features": [{"type": "TEXT_DETECTION"}],
            "imageContext": {"languageHints": ["zh-Hans", "zh-Hant"]},
        }]
    }

    try:
        resp = httpx.post(
            f"https://vision.googleapis.com/v1/images:annotate?key={api_key}",
            json=payload,
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

        annotations = data.get("responses", [{}])[0].get("textAnnotations", [])
        if annotations:
            return annotations[0].get("description", "").strip()
        return ""
    except Exception as e:
        return f"OCR error: {e}"


def _is_chinese(ch: str) -> bool:
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF) or (0x3400 <= cp <= 0x4DBF)
