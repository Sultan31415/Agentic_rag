"""
Main FastAPI application for Agentic RAG.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from config.settings import settings
from utils.logger import logger
import uvicorn
import time


# Create FastAPI app
app = FastAPI(
    title="Agentic RAG Multi-Agent System",
    version="1.0.0",
    description=(
        "A sophisticated multi-agent RAG system using LangGraph and Google Gemini. "
        "Features a supervisor agent that coordinates specialized agents for "
        "local knowledge, web search, and cloud resources."
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for debugging."""
    start_time = time.time()
    
    # Log request details
    logger.info(f"→ {request.method} {request.url.path}")
    logger.info(f"  Query params: {dict(request.query_params)}")
    logger.info(f"  Headers: {dict(request.headers)}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"← {response.status_code} {request.method} {request.url.path} ({process_time:.3f}s)")
    
    return response


# Include API router BEFORE startup event
logger.info(f"Including router with prefix: {router.prefix}")
app.include_router(router)
logger.info(f"Router included. Total routes: {len(app.routes)}")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("=" * 60)
    logger.info("Starting Agentic RAG Multi-Agent System")
    logger.info("=" * 60)
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"LLM Model: {settings.llm_model}")
    logger.info(f"API Prefix: {settings.api_v1_prefix}")
    
    # Log all registered routes
    logger.info("=" * 60)
    logger.info("Registered API Routes:")
    logger.info("=" * 60)
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            methods = ', '.join(sorted(route.methods))
            logger.info(f"  {methods:20} {route.path}")
        elif hasattr(route, 'path'):
            logger.info(f"  {'*':20} {route.path}")
    logger.info("=" * 60)
    
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
    
    # Initialize vector store (non-blocking - will be created when documents are added)
    try:
        from tools.vector_search import vector_search_manager
        logger.info("Initializing vector store...")
        result = vector_search_manager.initialize()
        if result is None:
            logger.warning("⚠ Vector store not created (will be created when documents are added)")
            logger.warning("  This is normal if no documents exist yet or if API quota is limited")
        else:
            logger.info("✓ Vector store initialized successfully")
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg or "SERVICE_DISABLED" in error_msg:
            logger.warning("⚠ Vector store initialization skipped due to API quota/availability")
            logger.warning("  Vector store will be created when documents are added")
        else:
            logger.error(f"✗ Failed to initialize vector store: {error_msg[:200]}")
            import traceback
            traceback.print_exc()
    
    logger.info("=" * 60)
    logger.info("System Ready!")
    logger.info("=" * 60)
    logger.info(f"API Documentation: http://localhost:8000/docs")
    logger.info(f"Query Endpoint: http://localhost:8000{settings.api_v1_prefix}/query")
    logger.info(f"Documents Endpoint: http://localhost:8000{settings.api_v1_prefix}/documents")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down Agentic RAG system...")


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




if __name__ == "__main__":
    """Run the application."""
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )
