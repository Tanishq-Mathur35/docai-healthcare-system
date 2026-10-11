from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from app.config import settings
from app.services.embedding_service import get_embedding_dimension
import uuid
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

qdrant_client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)


def ensure_collection_exists(collection_name: str = None):
    coll = collection_name or settings.QDRANT_COLLECTION_NAME
    try:
        collections = qdrant_client.get_collections().collections
        exists = any(c.name == coll for c in collections)
        if not exists:
            dim = get_embedding_dimension()
            qdrant_client.create_collection(
                collection_name=coll,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )
            logger.info(f"Created Qdrant collection: {coll} (dim={dim})")
    except Exception as e:
        logger.error(f"Error ensuring Qdrant collection: {e}")


def upsert_chunks(
    texts: List[str],
    embeddings: List[List[float]],
    patient_id: str,
    document_id: str,
    metadata_extra: Dict[str, Any] = None,
) -> List[str]:
    ensure_collection_exists()
    points = []
    point_ids = []

    for i, (text, vector) in enumerate(zip(texts, embeddings)):
        point_id = str(uuid.uuid4())
        point_ids.append(point_id)
        payload = {
            "patientId": patient_id,
            "documentId": document_id,
            "chunkIndex": i,
            "text": text,
            **(metadata_extra or {}),
        }
        points.append(PointStruct(id=point_id, vector=vector, payload=payload))

    qdrant_client.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points=points,
    )
    return point_ids


def search_similar(
    query_vector: List[float],
    patient_id: str,
    limit: int = 5,
    document_type: str = None,
) -> List[Dict[str, Any]]:
    ensure_collection_exists()

    must_conditions = [
        FieldCondition(key="patientId", match=MatchValue(value=patient_id))
    ]
    if document_type:
        must_conditions.append(
            FieldCondition(key="documentType", match=MatchValue(value=document_type))
        )

    search_filter = Filter(must=must_conditions)

    results = qdrant_client.search(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=search_filter,
        limit=limit,
    )

    return [
        {
            "id": r.id,
            "score": r.score,
            "text": r.payload.get("text", ""),
            "metadata": r.payload,
        }
        for r in results
    ]
