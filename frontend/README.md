# Agentic RAG Frontend

React-based chat interface for the Agentic RAG multi-agent system.

## Features

- Real-time streaming chat with Server-Sent Events (SSE)
- Multi-turn conversations with thread persistence
- Agent activity tracking and visualization
- Responsive chat interface
- Auto-scroll to latest messages
- Clean, modern UI with dark theme

## Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Run Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Prerequisites

Make sure the backend API is running on `http://localhost:8000`:

```bash
cd ../backend
python main.py
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build production bundle
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## Project Structure

```
frontend/
├── public/          # Static files
├── src/
│   ├── App.jsx      # Main application component
│   ├── App.css      # Application styles
│   ├── index.js     # Entry point
│   └── index.css    # Global styles
└── package.json     # Dependencies
```

## Usage

1. Ensure the backend is running on `http://localhost:8000`
2. Start the frontend with `npm start`
3. Open browser to `http://localhost:3000`
4. Start chatting!

### Example Queries

**Local Knowledge (Algorithms Textbook):**
- "What is a binary search tree?"
- "Explain the quicksort algorithm"
- "What is dynamic programming?"

**Web Search:**
- "What are the latest AI trends?"
- "What happened in tech news today?"

**Combined:**
- "Explain merge sort and find the latest innovations in sorting algorithms"

## Architecture

### Components

Currently a single-component app (`App.jsx`), but planned to be modularized into:
- `ChatContainer` - Main chat interface
- `ChatHeader` - Header with controls
- `MessageList` - List of messages
- `Message` - Individual message component
- `InputForm` - Chat input form
- `AgentActivity` - Agent execution details

### State Management

Uses React hooks:
- `useState` for component state
- `useEffect` for side effects (auto-scroll)
- `useRef` for DOM references

### API Communication

- **EventSource API** for Server-Sent Events (SSE) streaming
- Real-time message updates as agents process queries

### Message Flow

1. User submits query
2. Frontend connects to `/api/v1/chat/stream` via EventSource
3. Backend streams events: `thread_id`, `start`, `message`, `done`
4. Frontend updates UI in real-time with each event
5. Agent activity displayed in expandable details

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | http://localhost:8000 |
| `REACT_APP_ENV` | Environment | development |

## Customization

### Styling

Edit `App.css` to customize:
- Colors and theme
- Message bubbles
- Layout and spacing
- Animations

### API Endpoint

Change the backend URL in:
- `.env` file (recommended)
- Or directly in `App.jsx` (line 30)

## Troubleshooting

### Cannot Connect to Backend

**Error**: "Connection failed. Make sure the backend is running"

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/api/v1/health`
2. Check CORS settings in backend `config/settings.py`
3. Verify `REACT_APP_API_URL` in `.env`

### Messages Not Streaming

**Issue**: Messages appear all at once instead of streaming

**Cause**: EventSource not properly connected

**Solution**:
1. Check browser console for errors
2. Verify `/api/v1/chat/stream` endpoint is accessible
3. Check network tab for SSE connection

### Old Thread Persists

**Issue**: Previous conversation shows up on page reload

**Solution**: Click "New Chat" button to clear thread

## Tech Stack

- React 18
- Server-Sent Events (EventSource API)
- CSS3 with gradients and animations

## Future Enhancements

### Planned Features
- [ ] TypeScript migration
- [ ] Component modularization
- [ ] React Router for multiple pages
- [ ] User authentication
- [ ] Message history persistence
- [ ] Export conversation
- [ ] Dark mode toggle
- [ ] Message markdown rendering
- [ ] Code syntax highlighting
- [ ] File upload support

### Planned Architecture
- State management with Zustand or Redux
- React Query for data fetching
- Component library (Material-UI or Chakra UI)
- E2E testing with Cypress
- Unit testing with Jest and React Testing Library

## Contributing

When adding features:
1. Keep components small and focused
2. Extract reusable logic into custom hooks
3. Use TypeScript for type safety (when migrated)
4. Write tests for new components
5. Follow existing code style

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Note: EventSource API required for SSE streaming.
