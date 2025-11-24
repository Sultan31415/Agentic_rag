import { useState, useEffect } from 'react';
import type { Session } from '../types';
import { chatAPI } from '../api';
import './Sidebar.css';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  currentPage: 'chat' | 'documents';
  onPageChange: (page: 'chat' | 'documents') => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  currentPage,
  onPageChange,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? '←' : '→'}
        </button>
        {expanded && <h2>Agentic RAG</h2>}
      </div>
      
      {expanded && (
        <>
          <button className="new-chat-btn" onClick={onNewSession}>
            + New Chat
          </button>
          
          <div className="sidebar-nav">
            <button
              className={`nav-item ${currentPage === 'chat' ? 'active' : ''}`}
              onClick={() => onPageChange('chat')}
            >
              💬 Chat
            </button>
            <button
              className={`nav-item ${currentPage === 'documents' ? 'active' : ''}`}
              onClick={() => onPageChange('documents')}
            >
              📎 Documents
            </button>
          </div>
          
          {currentPage === 'chat' && (
            <div className="sessions-list">
              <h3>Sessions</h3>
              {sessions.length === 0 ? (
                <p className="empty-state">No sessions yet</p>
              ) : (
                <div className="sessions">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <div className="session-content">
                        <div className="session-title">{session.title}</div>
                        <div className="session-date">{formatDate(session.lastMessageAt)}</div>
                      </div>
                      <button
                        className="delete-session-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

