import io
from PIL import Image
import pytesseract
import easyocr
import logging

logger = logging.getLogger(__name__)

_easyocr_reader = None


def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        _easyocr_reader = easyocr.Reader(["en"], gpu=False)
    return _easyocr_reader


def extract_text_from_image(image_bytes: bytes) -> tuple[str, float]:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")

        reader = get_easyocr_reader()
        results = reader.readtext(image)

        if results:
            texts = [r[1] for r in results]
            confidences = [r[2] for r in results]
            extracted_text = " ".join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.8
            return extracted_text.strip(), float(avg_confidence)
    except Exception as e:
        logger.warning(f"EasyOCR failed: {e}. Falling back to Tesseract.")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip(), 0.75
    except Exception as e:
        logger.error(f"Tesseract OCR failed: {e}")
        return "", 0.0
