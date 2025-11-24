"""
Main FastAPI application for Agentic RAG.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from config.settings import settings
from utils.logger import logger
import uvicorn


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("=" * 60)
    logger.info("Starting Agentic RAG Multi-Agent System")
    logger.info("=" * 60)
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"LLM Model: {settings.llm_model}")
    logger.info(f"API Prefix: {settings.api_v1_prefix}")

    # Initialize the agent graph
    try:
        from graph.agent_graph import get_agent_graph
        logger.info("Initializing multi-agent graph...")
        get_agent_graph()
        logger.info("✓ Multi-agent graph initialized successfully")
    except Exception as e:
        logger.error(f"✗ Failed to initialize agent graph: {e}")
        import traceback
        traceback.print_exc()

    # Initialize vector store
    try:
        from tools.vector_search import vector_search_manager
        logger.info("Initializing vector store...")
        vector_search_manager.initialize()
        logger.info("✓ Vector store initialized successfully")
    except Exception as e:
        logger.error(f"✗ Failed to initialize vector store: {e}")
        import traceback
        traceback.print_exc()

    logger.info("=" * 60)
    logger.info("System Ready!")
    logger.info("=" * 60)
    logger.info(f"API Documentation: http://localhost:8000/docs")
    logger.info(f"Query Endpoint: http://localhost:8000{settings.api_v1_prefix}/query")
    logger.info("=" * 60)

    yield  # Server runs here

    # Shutdown
    logger.info("Shutting down Agentic RAG system...")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Agentic RAG Multi-Agent System",
    version="1.0.0",
    description=(
        "A sophisticated multi-agent RAG system using LangGraph and Google Gemini. "
        "Features a supervisor agent that coordinates specialized agents for "
        "local knowledge, web search, and cloud resources."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan  # Use modern lifespan pattern
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Agentic RAG Multi-Agent System",
        "version": "1.0.0",
        "status": "running",
        "description": "Multi-agent supervisor system with LangGraph & Gemini",
        "endpoints": {
            "docs": "/docs",
            "api": settings.api_v1_prefix,
            "query": f"{settings.api_v1_prefix}/query",
            "health": f"{settings.api_v1_prefix}/health"
        }
    }


# Include API router
app.include_router(router)


if __name__ == "__main__":
    """Run the application."""
    import sys
    import os
    from pathlib import Path
    
    # Determine if we should use reload (development only)
    # On Windows, disable reload by default due to multiprocessing spawn issues
    use_reload = settings.app_env == "development" and sys.platform != "win32"
    
    # Get the backend directory for reload_dirs
    backend_dir = Path(__file__).parent.resolve()
    
    # Configure reload settings for Windows compatibility
    reload_config = {}
    
    if use_reload:
        reload_config = {
            "reload": True,
            "reload_delay": 1.0,  # Increased delay to avoid rapid reloads
            "reload_dirs": [str(backend_dir)],  # Only watch backend directory
        }
        
        # On Windows, try to use watchfiles if available for better reload support
        if sys.platform == "win32":
            try:
                import watchfiles
                reload_config["reload_includes"] = ["*.py"]
                reload_config["reload_excludes"] = ["*.pyc", "__pycache__", "*.db", "*.faiss", "*.pkl"]
                use_reload = True  # Enable reload if watchfiles is available
            except ImportError:
                # Disable reload on Windows if watchfiles is not available
                use_reload = False
                reload_config = {}
                print("Warning: Reload disabled on Windows. Install 'watchfiles' for better reload support: pip install watchfiles")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level=settings.log_level.lower(),
        **reload_config
    )
