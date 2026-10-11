from fastapi import APIRouter, HTTPException
from app.models.schemas import OcrResponse, OcrRequest
from app.services.storage_service import download_file_bytes
from app.services.ocr_service import extract_text_from_image

router = APIRouter(prefix="", tags=["OCR"])


@router.post("/ocr", response_model=OcrResponse)
async def process_ocr(request: OcrRequest):
    if not request.storageKey:
        raise HTTPException(status_code=400, detail="storageKey is required")
    try:
        image_bytes = download_file_bytes(request.storageKey)
        text, confidence = extract_text_from_image(image_bytes)
        return OcrResponse(
            success=True,
            documentId=request.documentId,
            extractedText=text,
            confidence=confidence,
            pageCount=1,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")
