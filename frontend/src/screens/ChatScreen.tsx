import React, { useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { AI_CHARACTER_NAME, INTELLIGENT_PROMPTS } from '../utils/constants';
import { filterRefusalText, formatTime } from '../utils/textUtils';
import '../App.css';

const bodyTextClass = "text-base leading-relaxed";

export const ChatScreen: React.FC = () => {
  const { chatState, sendMessage, setInput, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="relative min-h-screen aurora-bg flex flex-col lg:flex-row transition-all duration-300 overflow-hidden">
      {/* Avatar Section - Left Panel (35%) - Desktop Only */}
      <section
        className="hidden lg:block lg:w-[35%] lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:p-8 lg:z-20"
        aria-label={`${AI_CHARACTER_NAME} avatar section`}
      >
        <div className="relative w-full h-full flex flex-col items-center justify-start pt-[10%]">
          {/* Character Header */}
          <div className="w-full text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{AI_CHARACTER_NAME}</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-500 font-medium">Online</span>
              </div>
            </div>
            <p className="text-base text-gray-600">Your AI teaching assistant</p>
            {chatState.messages.length > 1 && (
              <div className="mt-2 text-xs text-gray-500">📝 Continuing conversation</div>
            )}
          </div>

          {/* Avatar Display */}
          <div className="relative w-[350px] h-[450px]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-3xl blur-xl" />
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl shadow-2xl">
              <BookOpen className="w-40 h-40 text-white" />
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-100/10 to-pink-100/10 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-br from-blue-100/10 to-purple-100/10 rounded-full blur-xl" />
        </div>
      </section>

      {/* Mobile Avatar */}
      <section
        className="lg:hidden w-full flex flex-col items-center pt-6 pb-3 relative bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-sm z-10"
        aria-label={`${AI_CHARACTER_NAME} avatar section`}
      >
        <div className="w-[120px] h-[120px] relative mb-2">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 to-pink-100/40 rounded-full blur-sm" />
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 rounded-full shadow-lg">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500 font-medium">Online</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{AI_CHARACTER_NAME}</h2>
      </section>

      {/* Chat Section - Right Panel (65%) */}
      <main
        className="flex-1 lg:ml-[35%] lg:w-[65%] flex flex-col relative"
        role="main"
        aria-label="Chat conversation"
      >
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-2xl" />
          <div className="absolute bottom-40 left-10 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-xl" />
        </div>

        {/* Header */}
        <div className="fixed top-[5%] left-0 right-0 lg:left-[35%] lg:right-0 px-4 lg:px-6 pt-2 pb-4 z-20 bg-transparent">
          <div className="flex items-center justify-between">
            <div></div>
            <h2 className="text-2xl font-bold text-gray-900">Your Chat</h2>
            <button
              onClick={clearChat}
              disabled={chatState.loading}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-400/50 disabled:cursor-not-allowed"
              title="Start new chat"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Error Display */}
        {chatState.error && (
          <div className="fixed top-[calc(5%+4rem)] left-0 right-0 lg:left-[35%] lg:right-0 px-4 lg:px-6 z-20">
            <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{chatState.error}</span>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div
          className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 relative z-10"
          role="log"
          aria-live="polite"
          style={{
            marginTop: '120px',
            marginBottom: '120px'
          }}
        >
          {/* Messages */}
          {chatState.messages.map((msg) => (
            <div
              key={`${msg.id}-${msg.timestamp}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              role="article"
              aria-label={`${msg.role === 'user' ? 'Your message' : `${AI_CHARACTER_NAME}'s response`}`}
            >
              <div className="max-w-[80%]">
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

                {/* Agent Activity Details */}
                {msg.events && msg.events.length > 0 && (
                  <details className="mt-2 text-xs text-gray-600 cursor-pointer">
                    <summary className="font-medium hover:text-gray-800">
                      🔍 Agent Activity ({msg.events.length} events)
                    </summary>
                    <div className="mt-1 pl-4 space-y-1">
                      {msg.events.map((event, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-semibold">{event.type}</span>
                          {event.name && <span className="text-gray-500"> - {event.name}</span>}
                          {event.tool_calls && (
                            <span className="text-blue-600"> [Tools: {event.tool_calls.map(tc => tc.name).join(', ')}]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {chatState.loading && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="max-w-[80%]">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" aria-hidden="true" />
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
          <div className="relative z-10 px-4 lg:px-6 pb-4" style={{ marginBottom: '120px' }}>
            <div className="mb-2">
              <p className="text-xs text-gray-500 font-medium">Quick starters:</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Conversation starters">
              {INTELLIGENT_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="px-4 py-2 text-sm w-full rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-medium transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-300 active:scale-95"
                  disabled={chatState.loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Input Area */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[35%] lg:right-0 p-4 lg:p-6 z-30">
        <div className="relative bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl shadow-purple-500/20">
          <div className="flex items-center gap-3 p-3">
            {/* Text input */}
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
                aria-label={`Message ${AI_CHARACTER_NAME}`}
              />
            </div>
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={chatState.loading || !chatState.input.trim()}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400/50 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
