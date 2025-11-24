import { useCallback, useRef } from 'react';
import { EventSourceConfig, EventSourceCallbacks, MessageEvent } from '../types/chat';
import { DEFAULT_API_URL, DEFAULT_MAX_ITERATIONS } from '../utils/constants';

/**
 * Custom hook for managing Server-Sent Events (EventSource) streaming
 */
export function useEventSource() {
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback((
    config: EventSourceConfig,
    callbacks: EventSourceCallbacks
  ) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Construct streaming URL with query parameters
      const apiUrl = config.apiUrl || process.env.REACT_APP_API_URL || DEFAULT_API_URL;
      const url = new URL(`${apiUrl}/api/v1/chat/stream`);

      url.searchParams.append('query', config.query);
      if (config.threadId) {
        url.searchParams.append('session_id', config.threadId);
      }
      url.searchParams.append('max_iterations', String(config.maxIterations || DEFAULT_MAX_ITERATIONS));

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      let hasContent = false;

      // Thread ID event
      eventSource.addEventListener('thread_id', (event) => {
        const data = JSON.parse(event.data);
        callbacks.onThreadId?.(data.thread_id);
        console.log('Thread ID:', data.thread_id);
      });

      // Stream start event
      eventSource.addEventListener('start', (event: any) => {
        const data = JSON.parse(event.data);
        callbacks.onStart?.(data);
        console.log('Stream started:', data);
      });

      // Message event
      eventSource.addEventListener('message', (event) => {
        const data: MessageEvent = JSON.parse(event.data);
        hasContent = true;
        callbacks.onMessage?.(data);
        console.log('Message received:', data);
      });

      // Stream complete event
      eventSource.addEventListener('done', () => {
        console.log('Stream completed');
        callbacks.onDone?.();
        eventSource.close();
      });

      // Error events
      eventSource.addEventListener('error', (event) => {
        console.error('Stream error:', event);
        if (!hasContent) {
          callbacks.onError?.('Failed to get response from server');
        }
        eventSource.close();
      });

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        if (!hasContent) {
          callbacks.onError?.('Connection failed. Make sure the backend is running on ' + apiUrl);
        }
        eventSource.close();
      };

    } catch (error: any) {
      console.error('Error starting stream:', error);
      callbacks.onError?.(error.message || 'An error occurred');
    }
  }, []);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return {
    startStream,
    closeStream
  };
}
