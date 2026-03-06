import React, { useState, useRef, useEffect } from 'react';
import roboIcon from '../assets/robo_icon.png';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export const AIAssistantChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hello! I'm your Vidya Bridge AI Assistant. How can I help you with your studies today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const targetUrl = `http://localhost:5000/api/chat`;
            console.log('>>> FETCHING AI FROM:', targetUrl);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: input })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('>>> CHAT API ERROR RESPONSE:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.reply
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                console.error('>>> CHAT API SUCCESS FALSE:', data);
                throw new Error(data.message || 'Failed to get reply');
            }
        } catch (error) {
            console.error('>>> CHAT COMPONENT CATCH:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again later."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chat-window">
            <div className="ai-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <img src={roboIcon} alt="AI Agent" />
                    <h3>Vidya Bridge AI Assistant</h3>
                </div>
                <button
                    onClick={async () => {
                        try {
                            const token = localStorage.getItem('token');
                            const targetUrl = `http://localhost:5000/api/chat/test`;
                            const verUrl = `http://localhost:5000/api/chat/version`;

                            const [res, verRes] = await Promise.all([
                                fetch(targetUrl, { headers: { Authorization: `Bearer ${token}` } }),
                                fetch(verUrl, { headers: { Authorization: `Bearer ${token}` } })
                            ]);

                            const data = await res.json();
                            const verData = await verRes.json().catch(() => ({ version: 'UNKNOWN (Old Code)' }));

                            alert(`Connection: ${data.success ? 'OK' : 'FAIL'}\nVersion: ${verData.version || 'UNKNOWN'}`);
                        } catch (err) {
                            alert(`Connection Test ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        }
                    }}
                    style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', marginRight: '8px' }}
                >
                    Test Ping
                </button>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('closeAIChat'))}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div className="ai-chat-messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && <div className="message assistant">Typing...</div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-chat-input">
                <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="ai-chat-send" onClick={handleSend} disabled={isLoading || !input.trim()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
