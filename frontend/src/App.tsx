import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import { Documents } from './components/Documents';
import type { Session, Message } from './types';
import { chatAPI } from './api';
import './App.css';

function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'chat' | 'documents'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastMessageAt: new Date(s.lastMessageAt),
      })));
    }

    const savedCurrentSession = localStorage.getItem('currentSessionId');
    if (savedCurrentSession) {
      setCurrentSessionId(savedCurrentSession);
      loadSessionMessages(savedCurrentSession);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save current session ID
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('currentSessionId', currentSessionId);
    } else {
      localStorage.removeItem('currentSessionId');
    }
  }, [currentSessionId]);

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await chatAPI.getThreadMessages(sessionId);
      const formattedMessages: Message[] = (response.messages || []).map((msg: any, index: number) => ({
        id: `${sessionId}-${index}`,
        content: msg.content || '',
        role: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: new Date(),
        agent_name: msg.name,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading session messages:', error);
      setMessages([]);
    }
  };

  const handleNewSession = async () => {
    try {
      const response = await chatAPI.createThread();
      const newSession: Session = {
        id: response.thread_id,
        title: 'New Chat',
        createdAt: new Date(),
        lastMessageAt: new Date(),
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setCurrentPage('chat');
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    loadSessionMessages(sessionId);
    setCurrentPage('chat');
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatAPI.deleteThread(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        if (sessions.length > 1) {
          const remainingSessions = sessions.filter(s => s.id !== sessionId);
          if (remainingSessions.length > 0) {
            handleSelectSession(remainingSessions[0].id);
          } else {
            setCurrentSessionId(null);
            setMessages([]);
          }
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleMessageAdd = (message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Update session's last message time
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, lastMessageAt: new Date() }
          : s
      ));
    }
  };

  const handleSessionUpdate = (sessionId: string, title: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, title: title.length > 50 ? title.slice(0, 50) + '...' : title }
        : s
    ));
  };

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <div className="main-content">
        {currentPage === 'chat' ? (
          currentSessionId ? (
            <Chat
              sessionId={currentSessionId}
              messages={messages}
              onMessageAdd={handleMessageAdd}
              onSessionUpdate={handleSessionUpdate}
            />
          ) : (
            <div className="no-session">
              <h2>Select a session or create a new one</h2>
              <p>Start a new conversation to begin chatting with the agentic RAG system.</p>
            </div>
          )
        ) : (
          <Documents />
        )}
      </div>
    </div>
  );
}

export default App;
