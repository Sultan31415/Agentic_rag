import { useState, useCallback, useRef } from 'react';
import { ChatState, ChatMessage } from '../types/chat';
import { useEventSource } from './useEventSource';
import { WELCOME_MESSAGE } from '../utils/constants';

/**
 * Custom hook for managing chat state and operations
 */
export function useChat() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [{
      id: 0,
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString()
    }],
    input: '',
    loading: false,
    error: null
  });

  const currentAssistantMessageRef = useRef<ChatMessage | null>(null);
  const { startStream, closeStream } = useEventSource();

  /**
   * Send a message to the chat
   */
  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || chatState.loading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      input: '',
      loading: true,
      error: null
    }));

    // Initialize assistant message
    currentAssistantMessageRef.current = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      events: []
    };

    // Start streaming
    startStream(
      {
        query: content.trim(),
        threadId
      },
      {
        onThreadId: (newThreadId) => {
          setThreadId(newThreadId);
        },
        onMessage: (data) => {
          const currentMsg = currentAssistantMessageRef.current;
          if (!currentMsg) return;

          currentMsg.events?.push(data);

          if (data.content) {
            currentMsg.content = data.content;
          }

          // Update messages in real-time
          setChatState(prev => {
            const updated = [...prev.messages];
            const lastMsg = updated[updated.length - 1];

            if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.final) {
              updated[updated.length - 1] = { ...currentMsg };
            } else {
              updated.push({ ...currentMsg });
            }

            return { ...prev, messages: updated };
          });
        },
        onDone: () => {
          const currentMsg = currentAssistantMessageRef.current;
          if (!currentMsg) return;

          currentMsg.final = true;

          setChatState(prev => {
            const updated = [...prev.messages];
            const lastMsg = updated[updated.length - 1];

            if (lastMsg && lastMsg.role === 'assistant') {
              updated[updated.length - 1] = { ...currentMsg, final: true };
            }

            return { ...prev, messages: updated, loading: false };
          });

          currentAssistantMessageRef.current = null;
        },
        onError: (error) => {
          setChatState(prev => ({
            ...prev,
            error,
            loading: false
          }));
          currentAssistantMessageRef.current = null;
        }
      }
    );
  }, [chatState.loading, threadId, startStream]);

  /**
   * Update input text
   */
  const setInput = useCallback((value: string) => {
    setChatState(prev => ({ ...prev, input: value }));
  }, []);

  /**
   * Clear chat history and reset state
   */
  const clearChat = useCallback(() => {
    closeStream();
    setChatState({
      messages: [{
        id: 0,
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date().toISOString()
      }],
      input: '',
      loading: false,
      error: null
    });
    setThreadId(null);
    currentAssistantMessageRef.current = null;
  }, [closeStream]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    chatState,
    threadId,
    sendMessage,
    setInput,
    clearChat,
    clearError
  };
}
