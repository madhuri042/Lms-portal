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
    const [hasError, setHasError] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text?: string) => {
        const messageToSend = text || input;
        if (!messageToSend.trim() || isLoading) return;

        if (!text) {
            const userMessage: Message = {
                id: `u-${Date.now()}`,
                role: 'user',
                content: messageToSend
            };
            setMessages(prev => [...prev, userMessage]);
            setInput('');
        }
        
        setIsLoading(true);
        setHasError(false);

        // Initial assistant message
        const assistantMsgId = `a-${Date.now()}`;
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ message: messageToSend })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

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
                                if (json.content) {
                                    fullContent += json.content;
                                    setMessages(prev => 
                                        prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent } : m)
                                    );
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setHasError(true);
            setMessages(prev => 
                prev.map(m => m.id === assistantMsgId ? { ...m, content: "I'm sorry, I'm having trouble connecting right now." } : m)
            );
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
                        {msg.role === 'assistant' && hasError && msg.id === messages[messages.length - 1].id && (
                            <button 
                                className="chat-retry-btn"
                                onClick={() => {
                                    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                                    if (lastUserMsg) {
                                        setMessages(prev => prev.slice(0, -1)); // Remove error message
                                        handleSend(lastUserMsg.content);
                                    }
                                }}
                                style={{ marginTop: '8px', display: 'block', fontSize: '12px', color: '#7c3aed', background: 'none', border: '1px solid #7c3aed', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.content === '' && <div className="message assistant">Typing...</div>}
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
                <button className="ai-chat-send" onClick={() => handleSend()} disabled={isLoading || !input.trim()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
