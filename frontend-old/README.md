# Agentic RAG Frontend

A minimal React chat interface to test the Agentic RAG multi-agent system.

## Features

- Real-time streaming chat using Server-Sent Events (SSE)
- Session persistence with thread IDs
- Agent activity tracking
- Clean, modern UI with dark theme
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Prerequisites

Make sure the backend API is running on `http://localhost:8000`:

```bash
cd ..
python main.py
```

## Usage

1. Type your question in the input field
2. Press "Send" or hit Enter
3. Watch the agents work in real-time
4. Expand "Agent Activity" to see which agents were used
5. Click "New Chat" to start a fresh conversation

## API Endpoints Used

- `GET /api/v1/chat/stream` - Streaming chat with SSE
- Automatic session management with thread IDs

## Tech Stack

- React 18
- Server-Sent Events (EventSource API)
- CSS3 with gradients and animations
