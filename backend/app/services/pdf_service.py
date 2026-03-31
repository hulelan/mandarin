import io
import subprocess
import tempfile

import pymupdf


def extract_text_from_pdf(
    pdf_bytes: bytes,
    start_page: int = 1,
    end_page: int | None = None,
) -> str:
    """Extract Chinese text from a PDF. Falls back to OCR if text extraction yields little content.

    Args:
        pdf_bytes: Raw PDF file bytes.
        start_page: First page to extract (1-indexed).
        end_page: Last page to extract (1-indexed, inclusive). None = same as start_page.
    """
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)

    # Clamp page range
    start_idx = max(0, start_page - 1)
    end_idx = min(total_pages, (end_page or start_page)) - 1

    # First try: direct text extraction
    text_parts = []
    for page_num in range(start_idx, end_idx + 1):
        page = doc[page_num]
        text_parts.append(page.get_text())

    text = "\n".join(text_parts).strip()

    # Check if we got meaningful Chinese content
    chinese_char_count = sum(1 for ch in text if _is_chinese(ch))
    if chinese_char_count >= 5:
        doc.close()
        return text

    # Fallback: OCR via tesseract on rendered page images
    ocr_parts = []
    for page_num in range(start_idx, end_idx + 1):
        page = doc[page_num]
        # Render at 300 DPI for good OCR quality
        pix = page.get_pixmap(dpi=300)
        img_bytes = pix.tobytes("png")

        ocr_text = _ocr_image(img_bytes)
        if ocr_text:
            ocr_parts.append(ocr_text)

    doc.close()
    return "\n".join(ocr_parts).strip()


def _ocr_image(png_bytes: bytes) -> str:
    """Run Tesseract OCR on a PNG image, targeting Chinese simplified + traditional."""
    with tempfile.NamedTemporaryFile(suffix=".png", delete=True) as f:
        f.write(png_bytes)
        f.flush()

        try:
            result = subprocess.run(
                ["tesseract", f.name, "stdout", "-l", "chi_sim+chi_tra"],
                capture_output=True,
                text=True,
                timeout=30,
            )
            return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return ""


def _is_chinese(ch: str) -> bool:
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF) or (0x3400 <= cp <= 0x4DBF)
