"""
Vector search tool for querying local knowledge base.
"""

from langchain_core.tools import tool
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from config.settings import settings
import os


class VectorSearchManager:
    """Manages the vector store for local knowledge search."""
    
    _instance = None
    _vector_store = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorSearchManager, cls).__new__(cls)
        return cls._instance
    
    def initialize(self):
        """Initialize or load the vector store."""
        if self._vector_store is not None:
            return self._vector_store
        
        try:
            # Initialize embeddings
            embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.embedding_model,
                google_api_key=settings.google_api_key
            )
            
            # Try to load existing vector store
            vector_store_path = settings.vector_store_path
            if os.path.exists(vector_store_path) and os.path.exists(f"{vector_store_path}/index.faiss"):
                print(f"Loading existing vector store from {vector_store_path}")
                self._vector_store = FAISS.load_local(
                    vector_store_path,
                    embeddings,
                    allow_dangerous_deserialization=True
                )
                return self._vector_store
            else:
                # Don't create empty vector store - wait until documents are added
                # This avoids quota issues with free tier
                print("No existing vector store found. Vector store will be created when documents are added.")
                self._embeddings = embeddings
                self._vector_store = None  # Will be created lazily when needed
                return None
            
        except Exception as e:
            error_msg = str(e)
            # Check if it's a quota/API error
            if "quota" in error_msg.lower() or "429" in error_msg or "SERVICE_DISABLED" in error_msg:
                print(f"Embeddings API unavailable (quota/API issue): {error_msg[:200]}")
                print("Vector store will be created when documents are added and API is available.")
            else:
                print(f"Error initializing vector store: {error_msg[:200]}")
            
            # Store embeddings for later use, but don't create vector store yet
            try:
                self._embeddings = GoogleGenerativeAIEmbeddings(
                    model=settings.embedding_model,
                    google_api_key=settings.google_api_key
                )
            except:
                self._embeddings = None
            
            self._vector_store = None
            return None
    
    def get_vector_store(self):
        """Get the vector store, initializing if needed."""
        if self._vector_store is None:
            result = self.initialize()
            # If initialization returns None, we need to create it
            if result is None and self._vector_store is None:
                # Try to create a minimal vector store if embeddings are available
                if hasattr(self, '_embeddings') and self._embeddings is not None:
                    try:
                        self._vector_store = FAISS.from_documents(
                            [Document(page_content="Knowledge base initialized. Add documents to get started.")],
                            self._embeddings
                        )
                    except Exception as e:
                        # If we still can't create it, return None
                        print(f"Could not create vector store: {str(e)[:200]}")
                        return None
                else:
                    return None
        return self._vector_store
    
    def _ensure_vector_store(self):
        """Ensure vector store exists, creating it if needed."""
        if self._vector_store is None:
            if not hasattr(self, '_embeddings') or self._embeddings is None:
                try:
                    self._embeddings = GoogleGenerativeAIEmbeddings(
                        model=settings.embedding_model,
                        google_api_key=settings.google_api_key
                    )
                except Exception as e:
                    raise Exception(f"Cannot create embeddings: {str(e)}")
            
            # Create minimal vector store
            self._vector_store = FAISS.from_documents(
                [Document(page_content="Knowledge base initialized.")],
                self._embeddings
            )


# Global vector search manager
vector_search_manager = VectorSearchManager()


@tool
def search_local_knowledge(query: str, top_k: int = 3) -> str:
    """
    Search the local knowledge base using semantic similarity.
    
    Use this tool to find information from internal documents, company policies,
    procedures, or any content that has been indexed in the local knowledge base.
    
    Args:
        query: The search query
        top_k: Number of results to return (default: 3)
        
    Returns:
        Formatted string with search results including content and sources
    """
    try:
        vector_store = vector_search_manager.get_vector_store()
        
        if vector_store is None:
            return "Knowledge base is not initialized. Please add documents first."
        
        # Perform similarity search
        results = vector_store.similarity_search(query, k=top_k)
        
        if not results:
            return "No relevant information found in the local knowledge base."
        
        # Format results
        formatted_results = []
        for i, doc in enumerate(results, 1):
            source = doc.metadata.get('source', 'unknown')
            formatted_results.append(
                f"--- Result {i} ---\n"
                f"Content: {doc.page_content}\n"
                f"Source: {source}\n"
            )
        
        return "\n".join(formatted_results)
        
    except Exception as e:
        return f"Error searching local knowledge base: {str(e)}"


@tool
def add_documents_to_knowledge_base(documents: list[str], sources: list[str] = None) -> str:
    """
    Add new documents to the local knowledge base.
    
    Args:
        documents: List of document texts to add
        sources: Optional list of source identifiers for the documents
        
    Returns:
        Confirmation message
    """
    try:
        # Ensure vector store exists
        vector_store = vector_search_manager.get_vector_store()
        
        if vector_store is None:
            # Try to create it now
            vector_search_manager._ensure_vector_store()
            vector_store = vector_search_manager.get_vector_store()
            
            if vector_store is None:
                return "Error: Cannot create vector store. Please check your API quota and settings."
        
        # Create Document objects
        docs = []
        for i, doc_text in enumerate(documents):
            source = sources[i] if sources and i < len(sources) else f"document_{i}"
            docs.append(Document(
                page_content=doc_text,
                metadata={"source": source}
            ))
        
        # Add to vector store
        vector_store.add_documents(docs)
        
        # Save the updated vector store
        os.makedirs(settings.vector_store_path, exist_ok=True)
        vector_store.save_local(settings.vector_store_path)
        
        return f"Successfully added {len(documents)} document(s) to the knowledge base."
        
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower() or "429" in error_msg:
            return f"Error: API quota exceeded. Please check your Google API quota and billing settings. Details: {error_msg[:200]}"
        return f"Error adding documents to knowledge base: {error_msg[:200]}"
