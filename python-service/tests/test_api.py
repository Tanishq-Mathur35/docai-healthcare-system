import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    """Verify service health endpoint returns 200 and correct status metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "service" in data

def test_embed_authentication_guard():
    """Verify unauthorized requests are rejected with 401."""
    response = client.post("/embed", json={"texts": ["High fever and cough"]})
    assert response.status_code == 401

def test_embed_generation():
    """Verify dense vector embedding dimension equals 384 for all-MiniLM-L6-v2."""
    headers = {"Authorization": "Bearer supersecretinternaltoken123"}
    response = client.post(
        "/embed",
        json={"texts": ["Type 2 Diabetes Mellitus with elevated HbA1c", "Normal sinus rhythm"]},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "embeddings" in data
    assert len(data["embeddings"]) == 2
    # Verify exact 384 dimensions
    assert len(data["embeddings"][0]) == 384
    assert len(data["embeddings"][1]) == 384

def test_analyze_image_input_validation():
    """Verify image analysis rejects invalid requests."""
    headers = {"Authorization": "Bearer supersecretinternaltoken123"}
    # Missing required fields
    response = client.post("/analyze-image", json={}, headers=headers)
    assert response.status_code == 422
