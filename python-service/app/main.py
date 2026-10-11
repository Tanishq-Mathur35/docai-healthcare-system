from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import ocr, embed, analyze_image, process_pdf, summarize_report
from app.services.qdrant_service import ensure_collection_exists
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("docai-fastapi")

app = FastAPI(
    title="DocAI Medical Intelligence Microservice",
    description="OCR, Sentence Transformers Embedding, Biomedical Image Analysis & Document Ingestion",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != settings.PYTHON_SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid service authorization token")
    return credentials.credentials


app.include_router(ocr.router, dependencies=[Depends(verify_token)])
app.include_router(embed.router, dependencies=[Depends(verify_token)])
app.include_router(analyze_image.router, dependencies=[Depends(verify_token)])
app.include_router(process_pdf.router, dependencies=[Depends(verify_token)])
app.include_router(summarize_report.router, dependencies=[Depends(verify_token)])


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing DocAI Python microservice...")
    try:
        ensure_collection_exists()
    except Exception as e:
        logger.warning(f"Could not connect to Qdrant at startup: {e}")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "docai-python-microservice"}
