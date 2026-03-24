// @desc    Chat with AI Assistant (uses OpenRouter API via Streaming)
// @route   POST /api/chat
// @access  Private

const { streamOpenRouterToSse } = require('../utils/openRouterStream');

exports.chatWithAI = async (req, res) => {
    try {
        const { message, courseContext } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const systemPrompt = `You are a helpful and knowledgeable AI teaching assistant for a Learning Management System.
Your goal is to clarify concepts, answer questions related to the course material, and guide students without directly giving them answers to assignments.
${courseContext ? `Context about the current course/topic: ${courseContext}` : ''}`;

        const ok = await streamOpenRouterToSse(res, {
            systemPrompt,
            userMessage: message,
        });
        if (!ok) return;
    } catch (error) {
        console.error('Streaming Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Streaming failed', detail: error.message });
        }
    }
};
