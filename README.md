# Agentic RAG Multi-Agent System

A sophisticated multi-agent RAG (Retrieval-Augmented Generation) system built with **LangGraph**, **FastAPI**, and **Google Gemini**. Features a supervisor agent that coordinates specialized agents for local knowledge retrieval, web search, and cloud resources.

## 🏗️ Architecture

```
agentic-rag/
├── backend/                 # FastAPI backend
│   ├── agents/             # Agent implementations
│   ├── api/                # API routes and endpoints
│   ├── config/             # Configuration and settings
│   ├── graph/              # LangGraph orchestration
│   ├── models/             # Pydantic schemas
│   ├── tools/              # Agent tools
│   ├── utils/              # Utility functions
│   └── main.py            # Application entry point
├── frontend/               # React frontend
│   ├── src/               # React components
│   └── public/            # Static assets
├── data/                  # Data directory
│   ├── documents/         # Documents for RAG
│   └── vector_store/      # FAISS vector store
├── .env                   # Environment variables
└── README.md              # This file
```

## ✨ Features

- 🤖 **Multi-Agent Orchestration** - Hierarchical agent coordination with LangGraph
- 🧠 **RAG Capabilities** - Vector search with FAISS and OpenAI embeddings
- 🌐 **Web Search Integration** - Real-time web search via Tavily API
- 💬 **Streaming Chat** - Server-Sent Events (SSE) for real-time responses
- 🔄 **Conversation Persistence** - Thread-based conversation memory
- 📊 **Agent Visualization** - Graph structure visualization
- 🎯 **ReAct Pattern** - Reasoning and Acting for intelligent task delegation

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 16+** and npm
- **API Keys**:
  - [Google API Key](https://makersuite.google.com/app/apikey) (for Gemini)
  - [Tavily API Key](https://tavily.com/) (for web search)
  - [OpenAI API Key](https://platform.openai.com/) (for embeddings)

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd agentic-rag

# Create .env file
cp backend/.env.example .env
```

Edit `.env` with your API keys:
```env
GOOGLE_API_KEY=your_google_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional settings
APP_ENV=development
LOG_LEVEL=INFO
LLM_MODEL=gemini-2.0-flash-exp
```

### 2. Backend Setup

```bash
cd backend

# Option 1: Using Poetry (recommended)
poetry install
poetry run python main.py

# Option 2: Using pip
pip install -r requirements.txt
python main.py
```

Backend will start on **http://localhost:8000**

- 📚 API Docs: http://localhost:8000/docs
- ❤️ Health Check: http://localhost:8000/api/v1/health

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at **http://localhost:3000**

## 📖 Usage

### Example Queries

**Local Knowledge (from indexed documents):**
- "What is a binary search tree?"
- "Explain the quicksort algorithm"
- "What is dynamic programming?"

**Web Search:**
- "What are the latest AI trends in 2024?"
- "What happened in tech news today?"

**Multi-Source Queries:**
- "Explain merge sort from the textbook and find recent innovations in sorting algorithms"

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/query` | Submit query (batch) |
| GET | `/api/v1/chat/stream` | Stream chat responses (SSE) |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/graph/visualization` | Get graph visualization |
| POST | `/api/v1/threads/create` | Create conversation thread |
| GET | `/api/v1/threads/{thread_id}/messages` | Get thread messages |
| DELETE | `/api/v1/threads/{thread_id}` | Delete thread |

## 🧩 Multi-Agent System

### Agent Architecture

```
┌─────────────────────────────────────┐
│      Supervisor Agent               │
│  (ReAct + Chain-of-Thought)        │
│  - Analyzes queries                │
│  - Delegates to specialists        │
│  - Synthesizes responses           │
└─────┬────────┬──────────┬──────────┘
      │        │          │
      ▼        ▼          ▼
┌───────┐ ┌─────────┐ ┌────────┐
│ Local │ │   Web   │ │ Cloud  │
│Knowledge│ │ Search  │ │ Agent  │
└───────┘ └─────────┘ └────────┘
```

### Agents

1. **Supervisor Agent**
   - Coordinates task delegation
   - Uses ReAct (Reasoning + Acting) pattern
   - Implements Chain-of-Thought reasoning
   - Synthesizes responses from multiple agents

2. **Local Knowledge Agent**
   - Searches internal document knowledge base
   - Uses FAISS vector similarity search
   - Specialized for algorithms and company policies

3. **Web Search Agent**
   - Performs real-time web searches
   - Powered by Tavily API
   - Retrieves current events and online information

4. **Cloud Agent**
   - Accesses cloud resources (placeholder)
   - Future: AWS, Azure, GCP integrations

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern async web framework
- **LangGraph** - Multi-agent orchestration
- **LangChain** - Agent framework and tools
- **Google Gemini** - LLM (gemini-2.0-flash-exp)
- **FAISS** - Vector similarity search
- **OpenAI Embeddings** - Document embeddings (text-embedding-3-small)
- **Tavily** - Web search API
- **Pydantic** - Data validation
- **SQLite** - Conversation persistence

### Frontend
- **React 18** - UI framework
- **EventSource API** - SSE streaming
- **CSS3** - Styling with animations

## 📁 Adding Documents

To add documents to the knowledge base:

1. Place PDF or TXT files in `data/documents/`
2. Run the document loader:
```bash
cd backend
python utils/document_loader.py
```

This will:
- Load all documents from `data/documents/`
- Split them into chunks (1000 chars, 200 overlap)
- Generate embeddings using OpenAI
- Store in FAISS vector database at `data/vector_store/`

## 🧪 Development

### Running with Hot Reload

**Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm start
```

### Running Tests

```bash
# Backend tests
cd backend
poetry run pytest

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Services will be available at:
# - Backend: http://localhost:8000
# - Frontend: http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

See `backend/.env.example` for all available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google Gemini API key | Required |
| `TAVILY_API_KEY` | Tavily search API key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `LLM_MODEL` | Gemini model name | gemini-2.0-flash-exp |
| `LLM_TEMPERATURE` | Temperature (0-1) | 0.3 |
| `EMBEDDING_MODEL` | OpenAI embedding model | text-embedding-3-small |
| `MAX_ITERATIONS` | Max agent iterations | 5 |
| `TOP_K_RESULTS` | Vector search results | 3 |
| `LOG_LEVEL` | Logging level | INFO |

## 🐛 Troubleshooting

### Backend Issues

**Import Errors:**
```bash
# Make sure you're in the backend directory
cd backend
python main.py
```

**Vector Store Errors:**
- Ensure OpenAI API key is set
- Check write permissions in `data/` directory
- Documents will be in `data/documents/`

**Port Already in Use:**
```bash
# Use a different port
uvicorn main:app --port 8001
```

### Frontend Issues

**Cannot Connect to Backend:**
1. Verify backend is running: `curl http://localhost:8000/api/v1/health`
2. Check CORS settings in `backend/config/settings.py`
3. Verify `REACT_APP_API_URL` in frontend `.env`

**SSE Connection Failed:**
- Check browser console for errors
- Verify `/api/v1/chat/stream` is accessible
- Ensure backend is running

## 📚 Documentation

- **Backend**: See `backend/README.md`
- **Frontend**: See `frontend/README.md`
- **API Docs**: http://localhost:8000/docs (when running)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [LangGraph](https://github.com/langchain-ai/langgraph) - Multi-agent orchestration
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) - LLM
- [Tavily](https://tavily.com/) - Web search API
- [FAISS](https://github.com/facebookresearch/faiss) - Vector similarity search

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using LangGraph + FastAPI + React**
