import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AITutor.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_details?: string;
  isError?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  date: string;
  messages: Message[];
};

const SUGGESTIONS = [
  { text: 'Explain a concept I am stuck on in simple steps', label: 'Explain a topic' },
  { text: 'Quiz me with 5 questions on what I am studying', label: 'Quick quiz' },
  { text: 'Help me outline an essay or assignment draft', label: 'Outline help' },
  { text: 'Walk me through this problem one step at a time', label: 'Step-by-step' },
];

const DEFAULT_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '**Vidya Bridge AI Tutor** is here to help you learn—not to replace your coursework. Ask a question, paste a prompt, or try a suggestion below.',
};

export const AITutorPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('ai_tutor_sessions_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');
  const [citationEnabled, setCitationEnabled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const prepRunKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserName(u.firstName || 'User');
      }
    } catch {}

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      const session = sessions.find((s) => s.id === activeSessionId);
      if (session) {
        setMessages(session.messages);
      }
    } else {
      // Avoid resetting to welcome while Exams → Prepare is about to start (same tick as URL has prepExam)
      try {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('prepExam')) return;
      } catch {
        /* ignore */
      }
      setMessages([DEFAULT_MESSAGE]);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    localStorage.setItem('ai_tutor_sessions_v5', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([DEFAULT_MESSAGE]);
    setInput('');
    setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter((s) => s.id !== id);
    setSessions(updatedSessions);
    if (activeSessionId === id) {
      startNewChat();
    }
  };

  const sendMessage = async (text: string) => {
    const toSend = text.trim();
    if (!toSend || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: toSend };
    
    let currentSessionId = activeSessionId;
    let isNewSession = false;

    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      isNewSession = true;
      setActiveSessionId(currentSessionId);
    }

    const updatedMessages = [...messages.filter(m => m.id !== 'welcome'), userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    setSessions((prev) => {
      if (isNewSession) {
        return [
          {
            id: currentSessionId!,
            title: toSend.substring(0, 30) + (toSend.length > 30 ? '...' : ''),
            date: new Date().toISOString(),
            messages: updatedMessages
          },
          ...prev
        ];
      }
      return prev.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages } : s);
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: toSend }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      // Initial assistant message (empty)
      const assistantMsgId = `a-${Date.now()}`;
      let assistantMsg: Message = { 
        id: assistantMsgId, 
        role: 'assistant', 
        content: '',
        reasoning_details: ''
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullReasoning = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                const json = JSON.parse(dataStr);
                if (json.content) fullContent += json.content;
                if (json.reasoning) fullReasoning += json.reasoning;

                // Update state incrementally
                setMessages((prev) => 
                  prev.map(m => m.id === assistantMsgId 
                    ? { ...m, content: fullContent, reasoning_details: fullReasoning } 
                    : m
                  )
                );
              } catch (e) {
                // Partial chunk
              }
            }
          }
        }
      }

      // Final update to sessions
      setSessions((prev) => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, { ...assistantMsg, content: fullContent, reasoning_details: fullReasoning }] } 
          : s
      ));

    } catch (err) {
      console.error("Chat Error:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**System Diagnostic:** Connection failed. Reason: ${err instanceof Error ? err.message : String(err)}`,
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
      setSessions((prev) => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, errorMsg] } 
          : s
      ));
      setLoading(false);
    }
  };

  /** Opened from Exams → Prepare: syllabus is read server-side; same SSE shape as /api/chat */
  const runExamPrepFromSyllabus = async (examId: string, examTitle: string) => {
    const userLine = `**Exam prep:** *${examTitle}*\n\nI'm using the syllabus PDF I uploaded for this exam. Tell me what to learn and how to prepare.`;
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: userLine };

    let currentSessionId = activeSessionId;
    let isNewSession = false;

    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      isNewSession = true;
      setActiveSessionId(currentSessionId);
    }

    const updatedMessages = [...messages.filter((m) => m.id !== 'welcome'), userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const sessionTitle =
      `Prep: ${examTitle}`.length > 42 ? `Prep: ${examTitle.slice(0, 38)}…` : `Prep: ${examTitle}`;

    setSessions((prev) => {
      if (isNewSession) {
        return [
          {
            id: currentSessionId!,
            title: sessionTitle,
            date: new Date().toISOString(),
            messages: updatedMessages,
          },
          ...prev,
        ];
      }
      return prev.map((s) => (s.id === currentSessionId ? { ...s, messages: updatedMessages } : s));
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/academic-exams/prep-stream/${encodeURIComponent(examId)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const assistantMsgId = `a-${Date.now()}`;
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        reasoning_details: '',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullReasoning = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                const json = JSON.parse(dataStr);
                if (json.content) fullContent += json.content;
                if (json.reasoning) fullReasoning += json.reasoning;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: fullContent, reasoning_details: fullReasoning }
                      : m
                  )
                );
              } catch {
                // partial chunk
              }
            }
          }
        }
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { ...assistantMsg, content: fullContent, reasoning_details: fullReasoning },
                ],
              }
            : s
        )
      );
    } catch (err) {
      console.error('Exam prep stream error:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `**Could not prepare exam plan:** ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s
        )
      );
      setLoading(false);
    }
  };

  const prepExamId = searchParams.get('prepExam');
  const prepExamNameRaw = searchParams.get('examName');
  const prepTrigger = searchParams.get('prepTrigger');

  useEffect(() => {
    if (!prepExamId || !prepTrigger) return;
    const runKey = `${prepExamId}:${prepTrigger}`;
    if (prepRunKeysRef.current.has(runKey)) return;
    prepRunKeysRef.current.add(runKey);
    const title = prepExamNameRaw?.trim() || 'Exam';
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('prepExam');
        next.delete('examName');
        next.delete('prepTrigger');
        return next;
      },
      { replace: true }
    );
    void runExamPrepFromSyllabus(prepExamId, title);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot when query appears
  }, [prepExamId, prepExamNameRaw, prepTrigger, setSearchParams]);

  const CodeBlockComponent = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const [copied, setCopied] = useState(false);
      const codeString = String(children).replace(/\n$/, '');

      const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      if (!inline && match) {
        return (
          <div className="gpt-code-wrapper">
            <div className="gpt-code-header">
              <span className="gpt-code-lang">{match[1]}</span>
              <button className="gpt-code-copy" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            <pre className={className} {...props}>
              <code>{children}</code>
            </pre>
          </div>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  const isInitialState = messages.length === 1 && messages[0].id === 'welcome' && !loading;

  return (
    <div className="gpt-layout no-sidebar">
      {/* History Modal Overlay */}
      {showHistory && (
        <div className="history-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
               <h3>Chat History</h3>
               <button className="close-modal" onClick={() => setShowHistory(false)}>&times;</button>
            </div>
            <div className="history-modal-content">
              {sessions.length === 0 ? (
                <div className="no-history">No past conversations found.</div>
              ) : (
                <div className="history-grid-view">
                  {sessions.map(s => (
                    <div key={s.id} className="history-card" onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}>
                      <div className="history-card-info">
                        <strong>{s.title}</strong>
                        <span>{new Date(s.date).toLocaleDateString()}</span>
                      </div>
                      <button className="delete-hist-btn" onClick={(e) => deleteSession(e, s.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="gpt-main">
        <header className="gpt-top-header" role="banner">
          <div className="gpt-header-inner">
            <div className="header-brand">
              <div className="header-logo" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3" />
                  <path d="M12 18v3" />
                  <path d="M3 12h3" />
                  <path d="M18 12h3" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <div className="header-titles">
                <h1 className="page-title">AI Tutor</h1>
                <p className="page-subtitle">Clear answers for your courses. Verify important facts with your instructor or materials.</p>
              </div>
            </div>
            <div className="header-actions">
              <button type="button" className="header-btn ghost" onClick={() => setShowHistory(true)} aria-label="Open chat history">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                History
              </button>
              <button type="button" className="header-btn primary" onClick={startNewChat} aria-label="Start new chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New chat
              </button>
            </div>
          </div>
        </header>

        <div className={`gpt-chat-container ${isInitialState ? 'initial-state' : ''}`}>
          {isInitialState ? (
            <div className="initial-content">
              <p className="greeting-kicker">{greeting}</p>
              <h1 className="greeting-text">
                Hi, <span className="greeting-name">{userName}</span>
              </h1>
              <p className="sub-greeting">What would you like to learn or practice today?</p>

              <div className="gpt-input-area initial">
                <div className="gpt-input-wrapper">
                  <textarea
                    className="gpt-input"
                    placeholder="Ask about a topic, assignment, or paste a question…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    rows={2}
                  />
                  <div className="input-controls">
                    <div className="controls-left">
                      <button type="button" className="control-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> Attach</button>
                    </div>
                    <div className="controls-right">
                      <div className={`citation-toggle ${citationEnabled ? 'active' : ''}`} onClick={() => setCitationEnabled(!citationEnabled)}>
                        <span>Citation</span>
                        <div className="toggle-switch"></div>
                      </div>
                      <button type="button" className="gpt-send-btn" disabled={!input.trim()} onClick={() => sendMessage(input)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"></path><polyline points="5 12 12 5 19 12"></polyline></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="suggestion-section">
                <div className="suggestion-header">Try asking</div>
                <div className="suggestion-grid" role="list">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="suggestion-card"
                      onClick={() => sendMessage(s.text)}
                      role="listitem"
                    >
                      <span className="suggestion-card-label">{s.label}</span>
                      <span className="suggestion-card-hint">{s.text}</span>
                      <span className="suggestion-card-chevron" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="gpt-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`gpt-message-row ${msg.role === 'user' ? 'is-user' : 'is-assistant'}${msg.isError ? ' is-error' : ''}`}
                  >
                    <div className="gpt-message-content">
                      <div className="message-avatar" aria-hidden>
                        {msg.role === 'assistant' ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        )}
                      </div>
                      <div className="gpt-message-body">
                        {msg.reasoning_details && (
                          <details className="gpt-reasoning-block">
                            <summary>How the tutor reasoned</summary>
                            <div className="gpt-reasoning-content">{msg.reasoning_details}</div>
                          </details>
                        )}
                        <div className="gpt-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={CodeBlockComponent}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        {msg.isError && (
                          <button 
                            className="gpt-retry-btn"
                            onClick={() => {
                              const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                              if (lastUserMsg) sendMessage(lastUserMsg.content);
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            Try Again
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="gpt-message-row is-assistant">
                    <div className="gpt-message-content">
                      <div className="message-avatar" aria-hidden>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                        </svg>
                      </div>
                      <div className="gpt-message-body">
                         <div className="gpt-typing-indicator"><span></span><span></span><span></span></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="gpt-input-area">
                <div className="gpt-input-wrapper">
                  <textarea
                    className="gpt-input"
                    placeholder="Message the tutor…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    rows={2}
                  />
                  <div className="input-controls">
                    <div className="controls-left">
                       <button type="button" className="control-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>
                    </div>
                    <div className="controls-right">
                       <button type="button" className="gpt-send-btn" disabled={!input.trim() || loading} onClick={() => sendMessage(input)}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"></path><polyline points="5 12 12 5 19 12"></polyline></svg>
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
