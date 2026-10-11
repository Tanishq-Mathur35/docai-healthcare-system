from fastapi import APIRouter, HTTPException
from app.models.schemas import ImageAnalysisRequest, ImageAnalysisResponse
from app.services.storage_service import download_file_bytes
from app.services.image_service import analyze_medical_image

router = APIRouter(prefix="", tags=["Image Analysis"])


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image_endpoint(request: ImageAnalysisRequest):
    try:
        img_bytes = download_file_bytes(request.storageKey)
        result = analyze_medical_image(img_bytes, request.imageType)
        return ImageAnalysisResponse(
            success=True,
            documentId=request.documentId,
            imageType=request.imageType,
            analysisResult=result["analysisResult"],
            findings=result["findings"],
            confidence=result["confidence"],
            modelUsed=result["modelUsed"],
            isEmergency=result["isEmergency"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")
