import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // Construct streaming URL with query parameters
      const url = new URL('http://localhost:8000/api/rag/chat/stream');
      url.searchParams.append('query', query);
      if (threadId) {
        url.searchParams.append('session_id', threadId);
      }
      url.searchParams.append('max_iterations', '10');

      const eventSource = new EventSource(url.toString());

      let currentAssistantMessage = { role: 'assistant', content: '', events: [] };
      let hasContent = false;

      eventSource.addEventListener('thread_id', (event) => {
        const data = JSON.parse(event.data);
        setThreadId(data.thread_id);
        console.log('Thread ID:', data.thread_id);
      });

      eventSource.addEventListener('start', (event) => {
        const data = JSON.parse(event.data);
        console.log('Stream started:', data);
      });

      eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('Message received:', data);

        hasContent = true;
        currentAssistantMessage.events.push(data);

        // Update content with the latest message
        if (data.content) {
          currentAssistantMessage.content = data.content;
        }

        // Update messages in real-time
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.final) {
            updated[updated.length - 1] = { ...currentAssistantMessage };
          } else {
            updated.push({ ...currentAssistantMessage });
          }
          return updated;
        });
      });

      eventSource.addEventListener('done', (event) => {
        console.log('Stream completed');
        currentAssistantMessage.final = true;

        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            updated[updated.length - 1] = { ...currentAssistantMessage, final: true };
          }
          return updated;
        });

        eventSource.close();
        setIsLoading(false);
      });

      eventSource.addEventListener('error', (event) => {
        console.error('Stream error:', event);
        if (!hasContent) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Error: Failed to get response from server',
            error: true
          }]);
        }
        eventSource.close();
        setIsLoading(false);
      });

      eventSource.onerror = (error) => {
        console.error('EventSource failed:', error);
        if (!hasContent) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Error: Connection failed. Make sure the backend is running on http://localhost:8000',
            error: true
          }]);
        }
        eventSource.close();
        setIsLoading(false);
      };

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}`,
        error: true
      }]);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setThreadId(null);
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>Agentic RAG Chat</h1>
          <button onClick={clearChat} className="clear-btn" disabled={isLoading}>
            New Chat
          </button>
        </div>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to Agentic RAG!</h2>
              <p>Ask me anything. I can search local knowledge, web, and cloud resources.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-header">
                <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
              </div>
              <div className="message-content">
                {msg.content}
              </div>

              {msg.events && msg.events.length > 0 && (
                <details className="message-details">
                  <summary>Agent Activity ({msg.events.length} events)</summary>
                  <div className="events-list">
                    {msg.events.map((event, i) => (
                      <div key={i} className="event-item">
                        <div className="event-type">{event.type}</div>
                        {event.name && <div className="event-name">Agent: {event.name}</div>}
                        {event.tool_calls && (
                          <div className="tool-calls">
                            Tools: {event.tool_calls.map(tc => tc.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="message assistant loading">
              <div className="message-header">
                <strong>Assistant</strong>
              </div>
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

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="input-field"
          />
          <button type="submit" disabled={isLoading || !query.trim()} className="send-btn">
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
