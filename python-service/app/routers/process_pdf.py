from fastapi import APIRouter, HTTPException
from app.models.schemas import PdfProcessRequest, PdfProcessResponse
from app.services.storage_service import download_file_bytes
from app.services.pdf_service import extract_text_from_pdf, chunk_text
from app.services.embedding_service import generate_embeddings
from app.services.qdrant_service import upsert_chunks

router = APIRouter(prefix="", tags=["PDF Processing"])


@router.post("/process-pdf", response_model=PdfProcessResponse)
async def process_pdf_endpoint(request: PdfProcessRequest):
    try:
        pdf_bytes = download_file_bytes(request.storageKey)
        full_text, page_count = extract_text_from_pdf(pdf_bytes)

        if not full_text.strip():
            return PdfProcessResponse(
                success=True,
                documentId=request.documentId,
                pageCount=page_count,
                chunksCount=0,
                extractedText="",
                qdrantPointIds=[],
            )

        chunks = chunk_text(full_text, chunk_size=request.chunkSize, overlap=request.chunkOverlap)
        embeddings = generate_embeddings(chunks)

        point_ids = upsert_chunks(
            texts=chunks,
            embeddings=embeddings,
            patient_id=request.patientId,
            document_id=request.documentId,
            metadata_extra={"documentType": "PDF_REPORT"},
        )

        return PdfProcessResponse(
            success=True,
            documentId=request.documentId,
            pageCount=page_count,
            chunksCount=len(chunks),
            extractedText=full_text[:3000],
            qdrantPointIds=point_ids,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")
