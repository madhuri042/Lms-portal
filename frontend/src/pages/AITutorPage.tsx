import React, { useState, useRef, useEffect } from 'react';
import roboIcon from '../assets/robo_icon.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_PROMPTS = [
  'Explain recursion in programming in simple terms',
  'Help me understand what I should focus on for my next assignment',
  'Give me a short quiz on variables and data types',
  'Summarize the key points of object-oriented programming',
  'What are best practices for writing clean code?',
  'I need help with a debugging problem',
];

export const AITutorPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Vidya Bridge AI Tutor. Ask me anything about your courses, assignments, or concepts you're learning. You can use the suggestions below to get started, or type your own question.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    const toSend = text.trim();
    if (!toSend || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: toSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

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

      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data?.message || "I couldn't get a response right now. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickPrompt = (prompt: string) => sendMessage(prompt);

  return (
    <div className="ai-tutor-page">
      <header className="ai-tutor-page__header">
        <div className="ai-tutor-page__header-inner">
          <img src={roboIcon} alt="" className="ai-tutor-page__logo" />
          <div>
            <h1 className="ai-tutor-page__title">AI Tutor</h1>
            <p className="ai-tutor-page__subtitle">
              Get instant help, explanations, and study tips from Vidya Bridge AI. Ask about concepts, assignments, or request a quick quiz.
            </p>
          </div>
        </div>
      </header>

      <div className="ai-tutor-page__prompts">
        <span className="ai-tutor-page__prompts-label">Try asking:</span>
        <div className="ai-tutor-page__prompts-list">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ai-tutor-page__chip"
              onClick={() => handleQuickPrompt(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-tutor-page__chat">
        <div className="ai-tutor-page__messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-tutor-page__message ai-tutor-page__message--${msg.role}`}>
              {msg.role === 'assistant' && (
                <img src={roboIcon} alt="" className="ai-tutor-page__msg-avatar" />
              )}
              <div className="ai-tutor-page__msg-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-tutor-page__message ai-tutor-page__message--assistant">
              <img src={roboIcon} alt="" className="ai-tutor-page__msg-avatar" />
              <div className="ai-tutor-page__msg-bubble ai-tutor-page__msg-bubble--typing">
                Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="ai-tutor-page__input-wrap">
          <input
            type="text"
            className="ai-tutor-page__input"
            placeholder="Ask me anything about your courses or assignments..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          <button
            type="button"
            className="ai-tutor-page__send"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
