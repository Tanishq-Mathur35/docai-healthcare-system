from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class OcrRequest(BaseModel):
    storageKey: Optional[str] = None
    documentId: Optional[str] = None
    patientId: Optional[str] = None
    language: str = "en"


class OcrResponse(BaseModel):
    success: bool
    documentId: Optional[str] = None
    extractedText: str
    confidence: float
    pageCount: int = 1


class EmbedRequest(BaseModel):
    texts: List[str]
    documentId: Optional[str] = None
    patientId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class EmbedResponse(BaseModel):
    success: bool
    dimensions: int
    embeddings: List[List[float]]
    count: int


class ImageAnalysisRequest(BaseModel):
    storageKey: str
    documentId: str
    patientId: str
    imageType: str = "OTHER"  # X_RAY, MRI, CT_SCAN, SKIN, FUNDUS, OTHER


class ImageAnalysisResponse(BaseModel):
    success: bool
    documentId: str
    imageType: str
    analysisResult: str
    findings: List[str]
    confidence: float
    modelUsed: str
    isEmergency: bool = False


class PdfProcessRequest(BaseModel):
    storageKey: str
    documentId: str
    patientId: str
    chunkSize: int = 500
    chunkOverlap: int = 50


class PdfProcessResponse(BaseModel):
    success: bool
    documentId: str
    pageCount: int
    chunksCount: int
    extractedText: str
    qdrantPointIds: List[str] = []


class SummarizeReportRequest(BaseModel):
    clinicalText: str
    targetLength: str = "concise"


class SummarizeReportResponse(BaseModel):
    success: bool
    summary: str
    keyFindings: List[str]
    riskIndicators: List[str]
