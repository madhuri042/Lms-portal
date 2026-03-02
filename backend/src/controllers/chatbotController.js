const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Chat with AI Assistant
// @route   POST /api/chat
// @access  Private
exports.chatWithAI = async (req, res) => {
    try {
        const { message, courseContext } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const systemPrompt = `You are a helpful and knowledgeable AI teaching assistant for a Learning Management System. 
Your goal is to clarify concepts, answer questions related to the course material, and guide students without directly giving them answers to assignments.
${courseContext ? `Context about the current course/topic: ${courseContext}` : ''}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // The user can change this via env vars later if they want
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        res.status(200).json({
            success: true,
            reply: completion.choices[0].message.content,
        });
    } catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({ success: false, message: 'Failed to communicate with AI Assistant' });
    }
};
