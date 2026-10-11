from fastapi import APIRouter, HTTPException
from app.models.schemas import EmbedRequest, EmbedResponse
from app.services.embedding_service import generate_embeddings, get_embedding_dimension

router = APIRouter(prefix="", tags=["Embedding"])


@router.post("/embed", response_model=EmbedResponse)
async def create_embeddings(request: EmbedRequest):
    if not request.texts:
        raise HTTPException(status_code=400, detail="texts array cannot be empty")
    try:
        embeddings = generate_embeddings(request.texts)
        dim = get_embedding_dimension()
        return EmbedResponse(
            success=True,
            dimensions=dim,
            embeddings=embeddings,
            count=len(embeddings),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding creation failed: {str(e)}")
