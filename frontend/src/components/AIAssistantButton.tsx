import React, { useState } from 'react';
import { AIAssistantChat } from './AIAssistantChat';
import roboIcon from '../assets/robot.png';

export const AIAssistantButton: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    React.useEffect(() => {
        const handleClose = () => setIsChatOpen(false);
        window.addEventListener('closeAIChat', handleClose);
        return () => window.removeEventListener('closeAIChat', handleClose);
    }, []);

    return (
        <>
            <button
                className="ai-assistant-fab"
                aria-label="AI Assistant"
                onClick={() => setIsChatOpen(!isChatOpen)}
            >
                <img src={roboIcon} alt="AI Agent" />
            </button>
            {isChatOpen && <AIAssistantChat />}
        </>
    );
};
