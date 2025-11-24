import { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { chatAPI } from '../api';
import './Chat.css';

interface ChatProps {
  sessionId: string | null;
  messages: Message[];
  onMessageAdd: (message: Message) => void;
  onSessionUpdate: (sessionId: string, title: string) => void;
}

export function Chat({ sessionId, messages, onMessageAdd, onSessionUpdate }: ChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSessionRef = useRef<string | null>(sessionId);
  const assistantMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentSessionRef.current = sessionId;
    setStreamingContent('');
    assistantMessageIdRef.current = null;
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    onMessageAdd(userMessage);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    let currentSessionId = currentSessionRef.current;
    let fullResponse = '';
    let firstChunk = true;

    try {
      const cleanup = await chatAPI.streamChat(
        userMessage.content,
        currentSessionId,
        (event) => {
          try {
            // EventSource sends data with event and data properties
            const eventType = event.event || event.type;
            const eventData = event.data ? JSON.parse(event.data) : event;

            if (eventType === 'thread_id' || (eventData.thread_id && !currentSessionId)) {
              const threadId = eventData.thread_id || eventData.data?.thread_id;
              if (threadId) {
                currentSessionId = threadId;
                currentSessionRef.current = currentSessionId;
                onSessionUpdate(currentSessionId, userMessage.content.slice(0, 50));
              }
            }

            if (eventType === 'message' || eventData.type === 'ai') {
              const msgData = eventData.type ? eventData : eventData.data || eventData;
              
              if (msgData.type === 'ai' && msgData.content) {
                if (firstChunk) {
                  firstChunk = false;
                  const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    content: '',
                    role: 'assistant',
                    timestamp: new Date(),
                    agent_name: msgData.name,
                  };
                  assistantMessageIdRef.current = assistantMessage.id;
                  onMessageAdd(assistantMessage);
                }
                
                fullResponse = msgData.content;
                setStreamingContent(fullResponse);
              }
            }

            if (eventType === 'done' || eventData.status === 'completed') {
              setIsLoading(false);
              
              // Update the assistant message with full content
              if (fullResponse && assistantMessageIdRef.current) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageIdRef.current
                    ? { ...msg, content: fullResponse }
                    : msg
                ));
              }
              
              setStreamingContent('');
              fullResponse = '';
              assistantMessageIdRef.current = null;
            }

            if (eventType === 'error' || eventData.error) {
              const errorMsg = eventData.error || 'Unknown error';
              throw new Error(errorMsg);
            }
          } catch (parseError) {
            console.error('Error parsing event:', parseError, event);
          }
        },
        (error) => {
          console.error('Stream error:', error);
          setIsLoading(false);
          setStreamingContent('');
        }
      );

      // Store cleanup function for potential cancellation
      return cleanup;
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && !isLoading && (
          <div className="empty-chat">
            <h2>Start a conversation</h2>
            <p>Ask me anything about your documents or search the web!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-meta">
              {message.agent_name && (
                <span className="agent-badge">{message.agent_name}</span>
              )}
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && streamingContent && (
          <div className="message assistant">
            <div className="message-content">
              {streamingContent}
              <span className="cursor">▋</span>
            </div>
          </div>
        )}
        
        {isLoading && !streamingContent && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={isLoading}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}

