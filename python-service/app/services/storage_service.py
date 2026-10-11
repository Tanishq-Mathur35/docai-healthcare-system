from minio import Minio
from app.config import settings
import io
import logging

logger = logging.getLogger(__name__)

endpoint = settings.STORAGE_ENDPOINT.replace("http://", "").replace("https://", "")

minio_client = Minio(
    endpoint=endpoint,
    access_key=settings.STORAGE_ACCESS_KEY,
    secret_key=settings.STORAGE_SECRET_KEY,
    secure=settings.STORAGE_USE_SSL,
)


def download_file_bytes(storage_key: str, bucket_name: str = None) -> bytes:
    bucket = bucket_name or settings.STORAGE_BUCKET
    response = minio_client.get_object(bucket, storage_key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def upload_bytes(file_bytes: bytes, storage_key: str, content_type: str = "application/octet-stream", bucket_name: str = None) -> str:
    bucket = bucket_name or settings.STORAGE_BUCKET
    if not minio_client.bucket_exists(bucket):
        minio_client.make_bucket(bucket)
    minio_client.put_object(
        bucket,
        storage_key,
        io.BytesIO(file_bytes),
        len(file_bytes),
        content_type=content_type,
    )
    return storage_key
