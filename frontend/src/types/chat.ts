/**
 * Chat message event data from the streaming API
 */
export interface MessageEvent {
  type: string;
  name?: string;
  content?: string;
  tool_calls?: Array<{ name: string }>;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  events?: MessageEvent[];
  final?: boolean;
  error?: boolean;
}

/**
 * Chat state management
 */
export interface ChatState {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
}

/**
 * EventSource hook configuration
 */
export interface EventSourceConfig {
  query: string;
  threadId: string | null;
  apiUrl?: string;
  maxIterations?: number;
}

/**
 * EventSource callbacks
 */
export interface EventSourceCallbacks {
  onThreadId?: (threadId: string) => void;
  onStart?: (data: any) => void;
  onMessage?: (data: MessageEvent) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}
