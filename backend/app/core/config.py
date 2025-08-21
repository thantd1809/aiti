from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    DATABASE_URL: str
    COLLECTION_NAME: str
    # Minio Settings
    MINIO_URL: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    MINIO_BUCKET: str
    MINIO_URL_ACCESS: str
    ####
    OPENAI_API_KEY: str
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str
    # Email
    SENDER_EMAIL: str
    SENDER_PASSWORD: str

    # API
    PRODUCT_BASE_URL: str

    # Log configuration
    LOG_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
    LOG_FILE: str = "backend.log"
    LOG_FORMAT: str = "%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
    LOG_RETENTION: int = 14  # Number of days to keep logs

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

