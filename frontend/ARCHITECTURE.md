# Frontend Architecture Documentation

## Overview
This document describes the well-architected structure of the Teaching Assistant chat frontend application, built with React, TypeScript, and modern best practices.

## Architecture Principles
- **Separation of Concerns**: Business logic, UI components, and utilities are cleanly separated
- **Modularity**: Reusable components and hooks for easy maintenance
- **Type Safety**: Full TypeScript coverage with comprehensive type definitions
- **React Best Practices**: Custom hooks, memoization, and proper state management

## Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── AvatarSection.tsx       # Character avatar display (desktop & mobile)
│   ├── ChatHeader.tsx          # Chat header with "New Chat" button
│   ├── ChatInput.tsx           # Message input with send button
│   ├── ErrorDisplay.tsx        # Error notification display
│   ├── LoadingIndicator.tsx    # Loading/thinking indicator
│   ├── Message.tsx             # Individual message bubble with markdown
│   ├── MessageList.tsx         # Scrollable message container
│   ├── SuggestedPrompts.tsx    # Quick starter prompts
│   └── index.ts                # Component exports
├── hooks/               # Custom React hooks
│   ├── useChat.ts              # Chat state management hook
│   ├── useEventSource.ts       # Server-Sent Events streaming hook
│   └── index.ts                # Hook exports
├── types/               # TypeScript type definitions
│   ├── chat.ts                 # Chat-related interfaces
│   └── index.ts                # Type exports
├── utils/               # Utility functions and constants
│   ├── constants.ts            # Application constants
│   ├── textUtils.ts            # Text processing utilities
│   └── index.ts                # Utility exports
├── App.tsx              # Main application component (clean & modular)
├── App.css              # Application styles
├── index.js             # Application entry point
└── index.css            # Global styles
```

## Component Architecture

### Core Components

#### App.tsx (Main Component)
- **Responsibility**: Orchestrates the entire chat interface
- **Key Features**:
  - Uses `useChat` hook for state management
  - Composes all UI components
  - Handles user interactions (send, input change, prompt selection)
- **Lines of Code**: ~88 lines (down from 476!)
- **Dependencies**: Components, hooks

#### Message.tsx
- **Responsibility**: Renders individual chat messages
- **Key Features**:
  - Supports markdown rendering with ReactMarkdown
  - Displays agent activity details
  - Shows timestamps
  - Applies different styles for user vs assistant messages

#### ChatInput.tsx
- **Responsibility**: Message input field and send button
- **Key Features**:
  - Keyboard shortcuts (Enter to send)
  - Disabled state handling
  - Customizable placeholder

#### AvatarSection.tsx
- **Responsibility**: Displays the AI character avatar
- **Key Features**:
  - Responsive design (desktop & mobile variants)
  - Online status indicator
  - Conversation continuity indicator

#### MessageList.tsx
- **Responsibility**: Container for all messages
- **Key Features**:
  - Auto-scrolling to latest message
  - Loading indicator integration
  - Proper ARIA labels for accessibility

## Custom Hooks

### useChat
**Purpose**: Manages all chat state and operations

**Returns**:
- `chatState`: Current chat state (messages, input, loading, error)
- `threadId`: Current conversation thread ID
- `sendMessage(content)`: Send a message
- `setInput(value)`: Update input field
- `clearChat()`: Reset conversation
- `clearError()`: Clear error state

**Features**:
- Integrates with `useEventSource` for streaming
- Maintains message history
- Handles loading and error states
- Thread ID persistence

### useEventSource
**Purpose**: Manages Server-Sent Events streaming connection

**Returns**:
- `startStream(config, callbacks)`: Start streaming
- `closeStream()`: Close connection

**Features**:
- Automatic reconnection handling
- Event type handling (thread_id, start, message, done, error)
- Clean callback interface
- Proper resource cleanup

## Type System

### Key Types

```typescript
interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  events?: MessageEvent[];
  final?: boolean;
  error?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
}

interface EventSourceConfig {
  query: string;
  threadId: string | null;
  apiUrl?: string;
  maxIterations?: number;
}
```

## Utilities

### textUtils.ts
- `filterRefusalText(content)`: Cleans AI response content
- `formatTime(timestamp)`: Formats message timestamps

### constants.ts
- Application-wide constants
- AI character configuration
- API defaults
- Suggested prompts

## Data Flow

```
User Input
    ↓
ChatInput Component
    ↓
App.tsx (handleSend)
    ↓
useChat hook (sendMessage)
    ↓
useEventSource hook (startStream)
    ↓
Backend API (Server-Sent Events)
    ↓
Event Callbacks (onMessage, onDone, etc.)
    ↓
State Updates (setChatState)
    ↓
MessageList Component
    ↓
Message Components (re-render)
```

## Benefits of This Architecture

### 1. **Maintainability**
- Each component has a single responsibility
- Easy to locate and fix bugs
- Clear file organization

### 2. **Reusability**
- Components can be used independently
- Hooks can be shared across different parts of the app
- Utilities are pure functions

### 3. **Testability**
- Components can be tested in isolation
- Hooks can be tested with React Testing Library
- Clear input/output contracts

### 4. **Scalability**
- Easy to add new features
- Can add new components without touching existing code
- Hook composition for complex logic

### 5. **Type Safety**
- Compile-time error checking
- IntelliSense support
- Self-documenting code

### 6. **Performance**
- Optimized with useCallback and memoization
- Minimal re-renders
- Efficient event handling

## Comparison: Before vs After

### Before (Monolithic App.tsx)
- **Lines**: 476 lines in single file
- **Structure**: All logic in one component
- **Reusability**: None
- **Testability**: Difficult
- **Maintainability**: Hard to navigate

### After (Modular Architecture)
- **Lines**: 88 lines in main component
- **Structure**: 8 components + 2 hooks + types + utils
- **Reusability**: High
- **Testability**: Easy
- **Maintainability**: Clear and organized

## Development Guidelines

### Adding a New Component
1. Create component file in `components/`
2. Define prop interface
3. Implement component with TypeScript
4. Export from `components/index.ts`
5. Use in parent component

### Adding a New Hook
1. Create hook file in `hooks/`
2. Define return type interface
3. Implement with proper memoization
4. Export from `hooks/index.ts`
5. Document usage

### Adding a New Feature
1. Identify affected components
2. Update types if needed
3. Create new components/hooks as needed
4. Update existing components minimally
5. Test integration

## Future Improvements

### Potential Enhancements
- [ ] Add unit tests for components
- [ ] Add integration tests for hooks
- [ ] Implement message persistence (localStorage)
- [ ] Add user preferences (theme, font size)
- [ ] Implement message search
- [ ] Add file upload support
- [ ] Implement typing indicators
- [ ] Add message reactions

### Performance Optimizations
- [ ] Virtualize long message lists
- [ ] Implement message batching
- [ ] Add service worker for offline support
- [ ] Optimize bundle size with code splitting

## Conclusion

This architecture follows React best practices and modern frontend patterns, making the codebase:
- **Clean**: Well-organized and easy to read
- **Maintainable**: Easy to update and extend
- **Scalable**: Ready for future growth
- **Professional**: Production-ready code quality

The modular structure ensures that the application can grow and evolve without becoming unwieldy, while maintaining excellent developer experience and code quality.
