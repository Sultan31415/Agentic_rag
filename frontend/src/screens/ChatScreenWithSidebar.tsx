import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  BookOpen,
  Upload,
  X,
  Menu
} from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { AI_CHARACTER_NAME, WELCOME_MESSAGE, INTELLIGENT_PROMPTS } from '../utils/constants';
import { filterRefusalText, formatTime } from '../utils/textUtils';
import { DEFAULT_API_URL } from '../utils/constants';
import '../App.css';

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

const bodyTextClass = "text-base leading-relaxed";

export const ChatScreenWithSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || 'default';
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessionId);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 1024);
  
  const { chatState, sendMessage, setInput, clearChat, threadId } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('chat_sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Error loading sessions:', e);
      }
    }
  }, []);

  // Save sessions to localStorage
  const saveSessions = useCallback((newSessions: Session[]) => {
    setSessions(newSessions);
    localStorage.setItem('chat_sessions', JSON.stringify(newSessions));
  }, []);

  // Create new session
  const createNewSession = useCallback(() => {
    const newSessionId = `session_${Date.now()}`;
    const newSession: Session = {
      id: newSessionId,
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date().toISOString()
    };
    
    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    setCurrentSessionId(newSessionId);
    setSearchParams({ session: newSessionId });
    clearChat();
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [sessions, saveSessions, setSearchParams, clearChat, isMobile]);

  // Delete session
  const deleteSession = useCallback((sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== sessionIdToDelete);
    saveSessions(updatedSessions);
    
    if (currentSessionId === sessionIdToDelete) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
        setSearchParams({ session: updatedSessions[0].id });
      } else {
        createNewSession();
      }
    }
  }, [sessions, saveSessions, currentSessionId, setSearchParams, createNewSession]);

  // Switch session
  const switchSession = useCallback((sessionIdToSwitch: string) => {
    setCurrentSessionId(sessionIdToSwitch);
    setSearchParams({ session: sessionIdToSwitch });
    clearChat();
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [setSearchParams, clearChat, isMobile]);

  // Update session title when messages change
  useEffect(() => {
    if (chatState.messages.length > 1 && currentSessionId) {
      const userMessages = chatState.messages.filter(m => m.role === 'user');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1];
        const title = lastUserMessage.content.slice(0, 50) + (lastUserMessage.content.length > 50 ? '...' : '');
        
        setSessions(prev => {
          const updated = prev.map(s => 
            s.id === currentSessionId 
              ? { ...s, title, lastMessage: lastUserMessage.content, timestamp: lastUserMessage.timestamp }
              : s
          );
          saveSessions(updated);
          return updated;
        });
      }
    }
  }, [chatState.messages, currentSessionId, saveSessions]);

  // Handlers
  const handleSend = useCallback(() => {
    if (chatState.input.trim()) {
      sendMessage(chatState.input);
    }
  }, [chatState.input, sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, [setInput]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  }, [setInput]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatState.messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showSuggestedPrompts = chatState.messages.length === 1 && !chatState.loading;

  return (
    <div className="relative min-h-screen aurora-bg flex transition-all duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative lg:translate-x-0 z-40 w-64 lg:w-72 h-screen bg-white/95 backdrop-blur-xl border-r border-gray-200 flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Chat Sessions</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-purple-50 border border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                    currentSessionId === session.id ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      currentSessionId === session.id ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {session.title || 'New Chat'}
                    </p>
                    {session.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {session.lastMessage.slice(0, 30)}...
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/attachments')}
            className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            Manage Files
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{AI_CHARACTER_NAME}</h1>
                <p className="text-xs text-gray-500">AI Teaching Assistant</p>
              </div>
            </div>
            <button
              onClick={createNewSession}
              disabled={chatState.loading}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-400/50 disabled:cursor-not-allowed"
            >
              New Chat
            </button>
          </div>
        </header>

        {/* Error Display */}
        {chatState.error && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700 text-sm">{chatState.error}</span>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div
          className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 relative"
          style={{ minHeight: 0 }}
        >
          {/* Messages */}
          {chatState.messages.map((msg) => (
            <div
              key={`${msg.id}-${msg.timestamp}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] lg:max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 backdrop-blur-md shadow-lg border ${
                    msg.role === 'user'
                      ? 'bg-white/90 border-white/50 text-gray-900 font-semibold shadow-purple-400/30'
                      : 'bg-white/90 border-gray-200 text-gray-800 font-normal'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkBreaks]}
                      components={{
                        h1: (props) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                        h2: (props) => <h2 className="text-lg font-semibold mt-3 mb-2" {...props} />,
                        h3: (props) => <h3 className="text-base font-semibold mt-2 mb-1" {...props} />,
                        ul: (props) => <ul className={`list-disc pl-6 my-2 ${bodyTextClass}`} {...props} />,
                        ol: (props) => <ol className={`list-decimal pl-6 my-2 ${bodyTextClass}`} {...props} />,
                        li: (props) => <li className={`mb-1 ${bodyTextClass}`} {...props} />,
                        code: (props) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                        pre: (props) => <pre className="bg-gray-100 rounded p-2 my-2 overflow-x-auto text-xs" {...props} />,
                        p: (props) => <p className={`${bodyTextClass} whitespace-pre-wrap`} {...props} />
                      }}
                    >
                      {filterRefusalText(msg.content)}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Message time */}
                <div className={`mt-1 text-xs text-gray-400 px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {chatState.loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] lg:max-w-[80%]">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    <span className="text-sm text-gray-600">{AI_CHARACTER_NAME} is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {showSuggestedPrompts && (
          <div className="px-4 lg:px-6 pb-4">
            <div className="mb-2">
              <p className="text-xs text-gray-500 font-medium">Quick starters:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INTELLIGENT_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="px-4 py-2 text-sm w-full rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-medium transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-300 active:scale-95"
                  disabled={chatState.loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Input Area */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-4">
          <div className="relative bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl shadow-purple-500/20">
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatState.input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={`Message ${AI_CHARACTER_NAME}...`}
                  className="w-full px-4 py-3 text-sm bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 font-medium"
                  disabled={chatState.loading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={chatState.loading || !chatState.input.trim()}
                className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400/50 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

