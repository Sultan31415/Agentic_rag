# Agentic RAG Backend

Multi-agent RAG system backend built with FastAPI, LangGraph, and Google Gemini.

## Architecture

```
backend/
├── agents/              # Agent implementations
│   ├── supervisor_agent.py       # Main coordinator agent
│   ├── local_knowledge_agent.py  # Local KB search agent
│   ├── web_search_agent.py       # Web search agent
│   └── cloud_agent.py            # Cloud resources agent
├── api/                 # FastAPI routes
│   └── routes.py        # All API endpoints
├── config/              # Configuration
│   └── settings.py      # Pydantic settings
├── graph/               # LangGraph orchestration
│   ├── agent_graph.py   # Graph builder
│   └── handoffs.py      # Agent handoff tools
├── models/              # Pydantic models
│   ├── requests.py      # Request schemas
│   └── responses.py     # Response schemas
├── tools/               # Agent tools
│   ├── vector_search.py # Vector store search
│   ├── web_search.py    # Tavily web search
│   └── cloud_tools.py   # Cloud operations
├── utils/               # Utilities
│   ├── document_loader.py  # Document processing
│   └── logger.py           # Logging setup
└── main.py             # FastAPI application

```

## Setup

### 1. Install Dependencies

Using Poetry (recommended):
```bash
cd backend
poetry install
```

Using pip:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file in the project root (one level up from backend):
```bash
cp .env.example ../.env
```

Edit `../.env` with your API keys:
```env
GOOGLE_API_KEY=your_google_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Server

From the backend directory:

Using Poetry:
```bash
poetry run python main.py
```

Using Python directly:
```bash
python main.py
```

Or using uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Query Endpoints
- `POST /api/v1/query` - Submit a query to the multi-agent system
- `GET /api/v1/chat/stream` - Stream chat responses (SSE)

### Thread Management
- `POST /api/v1/threads/create` - Create a new conversation thread
- `GET /api/v1/threads/{thread_id}/messages` - Get thread messages
- `DELETE /api/v1/threads/{thread_id}` - Delete a thread

### System
- `GET /api/v1/health` - Health check
- `GET /api/v1/graph/visualization` - Graph visualization (PNG)
- `GET /` - Root endpoint with API info

## Key Features

### Multi-Agent Orchestration
- **Supervisor Agent**: Coordinates task delegation using ReAct + Chain-of-Thought
- **Local Knowledge Agent**: Searches vector store (FAISS + OpenAI embeddings)
- **Web Search Agent**: Performs web searches using Tavily API
- **Cloud Agent**: Accesses cloud resources (placeholder)

### Technologies
- **FastAPI**: Modern, fast web framework
- **LangGraph**: Multi-agent orchestration
- **Google Gemini**: LLM for agents (gemini-2.0-flash-exp)
- **LangChain**: Agent framework and tools
- **FAISS**: Vector similarity search
- **OpenAI Embeddings**: Document embeddings (text-embedding-3-small)
- **Tavily**: Web search API

### Conversation Features
- Thread-based conversations with persistence
- Memory checkpointing for multi-turn dialogues
- Server-Sent Events (SSE) for streaming responses
- Real-time agent execution tracking

## Development

### Running Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black .
poetry run isort .
```

### Type Checking
```bash
poetry run mypy .
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | Required |
| `TAVILY_API_KEY` | Tavily search API key | Required |
| `OPENAI_API_KEY` | OpenAI API key (for embeddings) | Required |
| `APP_ENV` | Environment (development/production) | development |
| `LOG_LEVEL` | Logging level | INFO |
| `LLM_MODEL` | Gemini model to use | gemini-2.0-flash-exp |
| `LLM_TEMPERATURE` | Temperature for LLM | 0.3 |
| `EMBEDDING_MODEL` | OpenAI embedding model | text-embedding-3-small |
| `DATABASE_URL` | Database connection string | sqlite:///./hacknu_rag.db |
| `VECTOR_STORE_PATH` | Path for vector store | data/vector_store |
| `TOP_K_RESULTS` | Number of vector search results | 3 |
| `MAX_ITERATIONS` | Max agent iterations | 5 |
| `API_V1_PREFIX` | API version prefix | /api/v1 |
| `CORS_ORIGINS` | CORS allowed origins | ["*"] |

## Troubleshooting

### Import Errors
Make sure you're running from the `backend` directory so Python can find the modules.

### Vector Store Errors
The vector store is created automatically on first run. Ensure:
- OpenAI API key is set
- Write permissions in `../data/` directory
- Documents are in `../data/documents/` for indexing

### Agent Not Responding
Check:
- API keys are valid
- Internet connection (for Gemini and Tavily)
- Logs for specific error messages

## Adding Documents

To add documents to the local knowledge base:

1. Place PDF or TXT files in `../data/documents/`
2. Run the document loader:
```bash
python utils/document_loader.py
```

This will create/update the vector store in `../data/vector_store/`.
