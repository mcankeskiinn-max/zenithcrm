from google.cloud import storage

from app.core.config import settings


class GcsService:
    def __init__(self) -> None:
        self._client = storage.Client()

    def download_bytes(self, object_path: str) -> bytes:
        bucket = self._client.bucket(settings.gcs_bucket)
        blob = bucket.blob(object_path)
        return blob.download_as_bytes()

    def generate_signed_url(self, object_path: str) -> str:
        bucket = self._client.bucket(settings.gcs_bucket)
        blob = bucket.blob(object_path)
        return blob.generate_signed_url(expiration=settings.gcs_signed_url_ttl_seconds, method="GET")
