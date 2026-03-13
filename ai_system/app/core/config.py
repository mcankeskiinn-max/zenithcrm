from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ZenithCRM AI System"
    environment: str = Field(default="dev")
    database_url: str = Field(..., env="DATABASE_URL")
    gcs_bucket: str = Field(..., env="GCS_BUCKET")
    gcs_signed_url_ttl_seconds: int = Field(default=900, env="GCS_SIGNED_URL_TTL_SECONDS")
    gemini_api_base: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta",
        env="GEMINI_API_BASE",
    )
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    gemini_embedding_model: str = Field(default="text-embedding-004", env="GEMINI_EMBEDDING_MODEL")
    gemini_flash_model: str = Field(default="gemini-1.5-flash", env="GEMINI_FLASH_MODEL")
    embedding_dimension: int = Field(default=768, env="EMBEDDING_DIMENSION")
    max_chunk_chars: int = Field(default=2000, env="MAX_CHUNK_CHARS")
    max_context_chunks: int = Field(default=6, env="MAX_CONTEXT_CHUNKS")

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
