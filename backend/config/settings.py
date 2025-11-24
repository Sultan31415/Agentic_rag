"""
Configuration settings for the Agentic RAG system.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Get the project root directory (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # API Keys
    google_api_key: str
    tavily_api_key: str
    openai_api_key: str  # Required for embeddings
    anthropic_api_key: Optional[str] = None
    
    # Database
    database_url: str = "sqlite:///./hacknu_rag.db"
    
    # Application
    app_env: str = "development"
    log_level: str = "INFO"
    max_iterations: int = 5
    
    # LLM Settings
    llm_model: str = "gemini-2.0-flash-exp"
    llm_temperature: float = 0.3
    embedding_model: str = "text-embedding-3-small"  # OpenAI embedding model
    
    # Vector Search Settings
    vector_store_path: str = "data/vector_store"
    top_k_results: int = 3
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["*"]


# Global settings instance
settings = Settings()
