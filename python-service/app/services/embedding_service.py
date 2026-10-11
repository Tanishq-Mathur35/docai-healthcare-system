from sentence_transformers import SentenceTransformer
from app.config import settings
from typing import List
import logging

logger = logging.getLogger(__name__)

_model_instance = None


def get_embedding_model() -> SentenceTransformer:
    global _model_instance
    if _model_instance is None:
        logger.info(f"Loading SentenceTransformer: {settings.EMBEDDING_MODEL}")
        _model_instance = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _model_instance


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.tolist()


def get_embedding_dimension() -> int:
    model = get_embedding_model()
    return model.get_sentence_embedding_dimension()
