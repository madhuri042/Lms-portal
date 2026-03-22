// @desc    Chat with AI Assistant (uses OpenRouter API with Nemotron via Streaming)
// @route   POST /api/chat
// @access  Private

exports.chatWithAI = async (req, res) => {
    console.log('>>> OPENROUTER (NON-STREAMING) HIT - Message:', req.body.message);
    try {
        const { message, courseContext } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
            return res.status(503).json({
                success: false,
                message: 'AI Assistant is not configured. Please add OPENROUTER_API_KEY to backend/.env and restart the server.',
            });
        }

        const systemPrompt = `You are a helpful and knowledgeable AI teaching assistant for a Learning Management System. 
Your goal is to clarify concepts, answer questions related to the course material, and guide students without directly giving them answers to assignments.
${courseContext ? `Context about the current course/topic: ${courseContext}` : ''}`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://lms-portal.com",
                "X-OpenRouter-Title": "LMS AI Assistant",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "z-ai/glm-4.5-air:free",
                "messages": [{ "role": "user", "content": `${systemPrompt}\n\nUser Question: ${message}` }],
                "stream": true
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                success: false,
                message: `AI service error: ${errorData.error?.message || 'Failed to connect to OpenRouter'}`,
            });
        }

        // Set up Server-Sent Events headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') {
                        res.write('data: [DONE]\n\n');
                        continue;
                    }

                    try {
                        const json = JSON.parse(dataStr);
                        const content = json.choices?.[0]?.delta?.content || '';
                        const reasoning = json.choices?.[0]?.delta?.reasoning_details || '';
                        
                        if (content || reasoning) {
                            res.write(`data: ${JSON.stringify({ content, reasoning })}\n\n`);
                        }
                    } catch (e) {
                        // Skip partial/invalid JSON
                    }
                }
            }
        }

        res.end();

    } catch (error) {
        console.error('Streaming Error:', error);
        res.status(500).json({ success: false, message: 'Streaming failed', detail: error.message });
    }
};
