"""
API routes for the Agentic RAG system.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from sse_starlette.sse import EventSourceResponse
from models.requests import QueryRequest
from models.responses import QueryResponse, AgentResult, HealthResponse
from graph.agent_graph import get_agent_graph
from langchain_core.messages import HumanMessage
from config.settings import settings
from utils.document_loader import load_documents_from_directory, split_documents, create_vector_store
from tools.vector_search import vector_search_manager
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
import uuid
import time
import json
from datetime import datetime
from typing import Optional, List
import asyncio
import os
import shutil
from pathlib import Path


router = APIRouter(prefix=settings.api_v1_prefix, tags=["Agentic RAG"])

# Initialize checkpointer on module load
_checkpointer_initialized = False

async def ensure_checkpointer_initialized():
    """Ensure checkpointer tables are initialized (PostgreSQL only)."""
    global _checkpointer_initialized
    if not _checkpointer_initialized:
        # For SQLite, the checkpointer is automatically initialized
        # when the graph is created, so no additional initialization needed
        _checkpointer_initialized = True


@router.post("/query", response_model=QueryResponse)
async def query_agents(request: QueryRequest):
    """
    Submit a query to the multi-agent RAG system.
    
    The supervisor will analyze the query and delegate to appropriate
    specialized agents (local knowledge, web search, cloud).
    
    Args:
        request: Query request with user question and options
        
    Returns:
        Comprehensive response with final answer and agent details
    """
    start_time = time.time()
    
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get the agent graph
        agent_graph = get_agent_graph()
        
        # Prepare initial state
        initial_state = {
            "messages": [HumanMessage(content=request.query)]
        }
        
        # Configure graph execution
        config = {
            "configurable": {
                "thread_id": session_id
            },
            "recursion_limit": request.max_iterations + 10  # Allow for agent loops
        }
        
        print(f"Processing query: {request.query[:100]}...")
        
        # Invoke the graph
        result = await agent_graph.ainvoke(initial_state, config)
        
        # Extract messages from result
        messages = result.get("messages", [])
        
        # Get final answer - look for last AI message with actual content
        final_answer = "No response generated"
        reasoning_plan = None
        
        # Extract information from all messages
        agents_used = []
        agent_results = []
        
        for msg in messages:
            # Track tool calls (these represent agent delegations)
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    tool_name = tool_call.get('name', '')
                    if tool_name and tool_name not in agents_used:
                        agents_used.append(tool_name)
            
            # Track agent responses
            if hasattr(msg, 'name') and msg.name:
                agent_name = msg.name
                
                # Skip supervisor for agent list but capture reasoning
                if agent_name == "supervisor":
                    if hasattr(msg, 'content') and msg.content:
                        # Check if this has reasoning indicators
                        content = str(msg.content)
                        if any(keyword in content for keyword in ["ANALYZE", "PLAN", "DELEGATE", "SYNTHESIZE"]):
                            reasoning_plan = content
                    continue
                
                # Record unique agent usage
                if agent_name not in agents_used:
                    agents_used.append(agent_name)
                    
                # Get agent result
                if hasattr(msg, 'content') and msg.content and hasattr(msg, 'type') and msg.type == "ai":
                    agent_results.append(
                            AgentResult(
                                agent_name=agent_name,
                                result=msg.content[:500] + "..." if len(msg.content) > 500 else msg.content,
                                execution_time_ms=None  # Could be calculated with timestamps
                            )
                        )
        
        # Extract final answer - get the last substantial AI message
        # This could be from supervisor after synthesis or from an agent
        for msg in reversed(messages):
            if hasattr(msg, 'content') and msg.content:
                content = str(msg.content).strip()
                # Skip empty messages and tool messages
                if content and hasattr(msg, 'type') and msg.type == "ai":
                    # Skip messages that are just tool calls without content
                    if not (hasattr(msg, 'tool_calls') and msg.tool_calls and not content):
                        final_answer = content
                        break
        
        # If still no answer, try to get from agent results
        if final_answer == "No response generated" and agent_results:
            # Use the last agent's result as the answer
            final_answer = agent_results[-1].result
        
        # Calculate total time
        total_time_ms = int((time.time() - start_time) * 1000)
        
        # Build response
        response = QueryResponse(
            query=request.query,
            final_answer=final_answer,
            agents_used=agents_used,
            agent_results=agent_results,
            session_id=session_id,
            reasoning_plan=reasoning_plan,
            total_time_ms=total_time_ms,
            timestamp=datetime.now()
        )
        
        print(f"Query processed in {total_time_ms}ms using agents: {agents_used}")
        
        return response
        
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Check for quota/rate limit errors
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
            raise HTTPException(
                status_code=429,
                detail=(
                    "API quota or rate limit exceeded. "
                    "Please check your API plan and billing details. "
                    "If using the free tier, ensure you're using a supported model (e.g., gemini-1.5-flash). "
                    f"Original error: {error_str[:200]}"
                )
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )


@router.get("/chat/stream")
async def stream_chat(query: str, session_id: Optional[str] = None, max_iterations: int = 10):
    """
    Stream chat responses using Server-Sent Events (SSE).
    
    This endpoint enables real-time streaming of agent responses,
    providing a ChatGPT-like conversational experience.
    
    Args:
        query: User question
        session_id: Thread ID for conversation persistence
        max_iterations: Maximum iterations for agent loops
        
    Returns:
        SSE stream of agent responses and updates
    """
    try:
        # Ensure checkpointer is initialized (for PostgreSQL)
        await ensure_checkpointer_initialized()
        
        # Generate thread ID if not provided
        thread_id = session_id or str(uuid.uuid4())
        
        # Get the agent graph
        agent_graph = get_agent_graph()
        
        # Prepare initial state
        initial_state = {
            "messages": [HumanMessage(content=query)]
        }
        
        # Configure graph execution with thread_id for persistence
        config = {
            "configurable": {
                "thread_id": thread_id
            },
            "recursion_limit": max_iterations + 10
        }
        
        async def event_generator():
            """Generate SSE events from graph stream."""
            try:
                # Send thread_id first
                yield {
                    "event": "thread_id",
                    "data": json.dumps({"thread_id": thread_id})
                }
                
                # Send start event
                yield {
                    "event": "start",
                    "data": json.dumps({"query": query, "timestamp": datetime.now().isoformat()})
                }
                
                print(f"\n🚀 Starting graph stream for query: {query[:100]}")
                
                # Stream graph updates
                chunk_count = 0
                async for chunk in agent_graph.astream(initial_state, config, stream_mode="values"):
                    chunk_count += 1
                    print(f"📦 Chunk {chunk_count}: {type(chunk)}")
                    
                    messages = chunk.get("messages", [])
                    print(f"   Messages count: {len(messages)}")
                    
                    if messages:
                        last_message = messages[-1]
                        print(f"   Last message type: {getattr(last_message, 'type', 'unknown')}")
                        print(f"   Last message name: {getattr(last_message, 'name', None)}")
                        print(f"   Content length: {len(str(getattr(last_message, 'content', '')))}")
                        
                        # Normalize message type for frontend compatibility
                        msg_type = getattr(last_message, "type", "unknown")
                        if "ai" in msg_type.lower():
                            msg_type = "ai"
                        elif "human" in msg_type.lower():
                            msg_type = "human"
                        elif "tool" in msg_type.lower():
                            msg_type = "tool"
                        
                        # Extract message info
                        msg_data = {
                            "type": msg_type,  # Normalized type
                            "content": getattr(last_message, "content", ""),
                            "name": getattr(last_message, "name", None),
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        # Check for tool calls (agent delegation)
                        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                            msg_data["tool_calls"] = [
                                {
                                    "name": tc.get('name', ''),
                                    "args": tc.get('args', {})
                                }
                                for tc in last_message.tool_calls
                            ]
                            print(f"   🤖 Tool calls: {[tc['name'] for tc in msg_data['tool_calls']]}")
                        
                        print(f"   ✅ Yielding message event")
                        yield {
                            "event": "message",
                            "data": json.dumps(msg_data)
                        }
                
                print(f"✨ Stream complete! Total chunks: {chunk_count}")
                
                # Send completion event
                yield {
                    "event": "done",
                    "data": json.dumps({"status": "completed", "thread_id": thread_id})
                }
                
            except Exception as e:
                print(f"❌ Error in stream generator: {str(e)}")
                import traceback
                traceback.print_exc()
                yield {
                    "event": "error",
                    "data": json.dumps({"error": str(e)})
                }
        
        return EventSourceResponse(event_generator())
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error streaming chat: {str(e)}"
        )


@router.post("/threads/create")
async def create_thread():
    """
    Create a new conversation thread.
    
    Returns:
        New thread ID and metadata
    """
    thread_id = str(uuid.uuid4())
    return {
        "thread_id": thread_id,
        "created_at": datetime.now().isoformat(),
        "status": "active"
    }


@router.get("/threads/{thread_id}/messages")
async def get_thread_messages(thread_id: str):
    """
    Get all messages in a conversation thread.
    
    Args:
        thread_id: The thread/conversation ID
        
    Returns:
        List of messages in the thread
    """
    try:
        agent_graph = get_agent_graph()
        
        # Get state for this thread
        config = {"configurable": {"thread_id": thread_id}}
        state = agent_graph.get_state(config)
        
        if not state or not state.values:
            return {
                "thread_id": thread_id,
                "messages": [],
                "message_count": 0
            }
        
        messages = state.values.get("messages", [])
        
        # Format messages for response
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "type": getattr(msg, "type", "unknown"),
                "content": getattr(msg, "content", ""),
                "name": getattr(msg, "name", None),
                "role": "user" if getattr(msg, "type", "") == "human" else "assistant"
            })
        
        return {
            "thread_id": thread_id,
            "messages": formatted_messages,
            "message_count": len(formatted_messages)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving thread messages: {str(e)}"
        )


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str):
    """
    Delete a conversation thread.
    
    Note: With SqliteSaver, threads are stored in the database.
    This endpoint would need additional implementation to actually
    remove thread data from the checkpointer.
    
    Args:
        thread_id: The thread/conversation ID to delete
        
    Returns:
        Deletion confirmation
    """
    # Note: SqliteSaver doesn't have a built-in delete method
    # For now, we just return success. In production, you'd need to
    # implement actual deletion from the database
    return {
        "thread_id": thread_id,
        "status": "deleted",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status and available agents
    """
    try:
        # Try to get the graph to verify initialization
        graph = get_agent_graph()
        
        return HealthResponse(
            status="healthy",
            service="Agentic RAG Multi-Agent System",
            version="1.0.0",
            agents_available=[
                "supervisor",
                "local_knowledge_agent",
                "web_search_agent",
                "cloud_agent"
            ]
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            service="Agentic RAG Multi-Agent System",
            version="1.0.0",
            agents_available=[]
        )


@router.get("/graph/visualization")
async def get_graph_visualization():
    """
    Get a visual representation of the agent graph.
    
    Returns:
        PNG image of the graph structure
    """
    try:
        from graph.agent_graph import graph_manager
        
        png_bytes = graph_manager.visualize()
        
        if png_bytes:
            return Response(content=png_bytes, media_type="image/png")
        else:
            raise HTTPException(
                status_code=500,
                detail="Could not generate graph visualization"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating visualization: {str(e)}"
        )


@router.get("/documents/test")
async def test_documents_endpoint():
    """Test endpoint to verify documents routes are accessible."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info("TEST ENDPOINT CALLED: /documents/test")
    return {
        "status": "success",
        "message": "Documents endpoint is accessible",
        "router_prefix": router.prefix,
        "full_path": f"{router.prefix}/documents/test"
    }


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document to the knowledge base.
    
    Supports PDF and text files. The document will be processed,
    chunked, and added to the vector store.
    
    Args:
        file: The file to upload
        
    Returns:
        Upload confirmation with document info
    """
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.txt'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Create uploads directory if it doesn't exist
        upload_dir = Path("data/documents")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file temporarily
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Load and process the document
        try:
            if file_ext == '.pdf':
                loader = PyPDFLoader(str(file_path))
            else:
                loader = TextLoader(str(file_path))
            
            documents = loader.load()
            
            # Split documents
            splits = split_documents(documents, chunk_size=1000, chunk_overlap=200)
            
            # Get vector store and add documents
            vector_store = vector_search_manager.get_vector_store()
            
            # If vector store doesn't exist, try to create it
            if vector_store is None:
                try:
                    vector_search_manager._ensure_vector_store()
                    vector_store = vector_search_manager.get_vector_store()
                except Exception as e:
                    # Clean up file on error
                    if file_path.exists():
                        file_path.unlink()
                    error_msg = str(e)
                    if "quota" in error_msg.lower() or "429" in error_msg:
                        raise HTTPException(
                            status_code=429,
                            detail=f"API quota exceeded. Please check your Google API quota and billing settings. {error_msg[:200]}"
                        )
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error creating vector store: {error_msg[:200]}"
                    )
            
            if vector_store is None:
                # Clean up file on error
                if file_path.exists():
                    file_path.unlink()
                raise HTTPException(
                    status_code=500,
                    detail="Cannot create vector store. Please check your API settings and quota."
                )
            
            vector_store.add_documents(splits)
            
            # Save updated vector store
            os.makedirs(settings.vector_store_path, exist_ok=True)
            vector_store.save_local(settings.vector_store_path)
            
            return {
                "status": "success",
                "filename": file.filename,
                "chunks_added": len(splits),
                "message": f"Successfully added {file.filename} to knowledge base"
            }
            
        except Exception as e:
            # Clean up file on error
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=500,
                detail=f"Error processing document: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading document: {str(e)}"
        )


@router.get("/documents")
async def list_documents():
    """
    List all documents in the knowledge base.
    
    Returns:
        List of document files in the documents directory
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("=" * 60)
    logger.info("GET /documents endpoint called")
    logger.info(f"Router prefix: {router.prefix}")
    logger.info(f"Full path should be: {router.prefix}/documents")
    logger.info("=" * 60)
    
    try:
        documents_dir = Path("data/documents")
        logger.info(f"Looking for documents in: {documents_dir.absolute()}")
        logger.info(f"Directory exists: {documents_dir.exists()}")
        
        documents = []
        
        if documents_dir.exists():
            logger.info(f"Directory exists, listing files...")
            for file_path in documents_dir.iterdir():
                logger.info(f"Found file: {file_path.name}, is_file: {file_path.is_file()}, suffix: {file_path.suffix.lower()}")
                if file_path.is_file() and file_path.suffix.lower() in {'.pdf', '.txt'}:
                    stat = file_path.stat()
                    documents.append({
                        "filename": file_path.name,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                    })
                    logger.info(f"Added document: {file_path.name}")
        else:
            logger.warning(f"Documents directory does not exist: {documents_dir.absolute()}")
        
        logger.info(f"Returning {len(documents)} documents")
        return {
            "documents": documents,
            "count": len(documents)
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error listing documents: {str(e)}"
        )


@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    """
    Delete a document from the knowledge base.
    
    Note: This removes the file but doesn't remove its chunks from
    the vector store. For production, you'd want to rebuild the vector
    store after deletion.
    
    Args:
        filename: Name of the file to delete
        
    Returns:
        Deletion confirmation
    """
    try:
        file_path = Path("data/documents") / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Document {filename} not found"
            )
        
        # Security check: ensure file is in documents directory
        if not str(file_path.resolve()).startswith(str(Path("data/documents").resolve())):
            raise HTTPException(
                status_code=403,
                detail="Invalid file path"
            )
        
        file_path.unlink()
        
        return {
            "status": "success",
            "filename": filename,
            "message": f"Document {filename} deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting document: {str(e)}"
        )


@router.post("/documents/reindex")
async def reindex_knowledge_base():
    """
    Rebuild the entire knowledge base from documents directory.
    
    This will reload all documents, re-split them, and recreate
    the vector store. Useful after deleting documents or when
    you want to refresh the index.
    
    Returns:
        Reindexing confirmation
    """
    try:
        from utils.document_loader import prepare_knowledge_base
        
        # Rebuild knowledge base
        vector_store = prepare_knowledge_base(
            documents_dir="data/documents",
            vector_store_path=settings.vector_store_path
        )
        
        # Update the manager's vector store
        vector_search_manager._vector_store = vector_store
        
        return {
            "status": "success",
            "message": "Knowledge base reindexed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reindexing knowledge base: {str(e)}"
        )


@router.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Agentic RAG Multi-Agent System",
        "version": "1.0.0",
        "endpoints": {
            "query": f"{settings.api_v1_prefix}/query",
            "health": f"{settings.api_v1_prefix}/health",
            "visualization": f"{settings.api_v1_prefix}/graph/visualization",
            "docs": "/docs"
        },
        "agents": [
            "local_knowledge_agent",
            "web_search_agent",
            "cloud_agent"
        ]
    }
