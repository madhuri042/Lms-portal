// @desc    Chat with AI Assistant (uses Google Gemini)
// @route   POST /api/chat
// @access  Private
//
// Setup: In backend/.env set OPENAI_API_KEY to your Google Gemini API key.
// 1. Get a key: https://aistudio.google.com/apikey (recommended; API is pre-enabled).
// 2. Or in Google Cloud: enable "Generative Language API", create an API key, restrict to that API only.
// 3. Restart the backend after changing .env.
exports.chatWithAI = async (req, res) => {
    console.log('>>> GEMINI FETCH HIT - Message:', req.body.message);
    try {
        const { message, courseContext } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const apiKey = process.env.OPENAI_API_KEY; // Gemini key in .env as OPENAI_API_KEY
        if (!apiKey || apiKey.trim() === '') {
            console.error('OPENAI_API_KEY is missing. Add your Google/Gemini API key to backend/.env');
            return res.status(503).json({
                success: false,
                message: 'AI Assistant is not configured. Please add OPENAI_API_KEY (Google Gemini key) to backend/.env and restart the server.',
            });
        }

        const model = 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = `You are a helpful and knowledgeable AI teaching assistant for a Learning Management System. 
Your goal is to clarify concepts, answer questions related to the course material, and guide students without directly giving them answers to assignments.
${courseContext ? `Context about the current course/topic: ${courseContext}` : ''}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errMsg = data.error?.message || data.error?.status || 'Gemini API failed';
            const code = data.error?.code || response.status;
            console.error('Gemini API Error Response:', JSON.stringify(data, null, 2));

            // User-friendly hint based on common errors
            let hint = 'Check that your key is a Google Gemini key and that Generative Language API is enabled.';
            if (response.status === 403 || (errMsg && errMsg.toLowerCase().includes('permission'))) {
                hint = 'Create or use an API key from Google AI Studio (https://aistudio.google.com/apikey). If using a key from Google Cloud, enable "Generative Language API" for your project.';
            } else if (response.status === 400 && errMsg && errMsg.toLowerCase().includes('invalid')) {
                hint = 'Your API key may be invalid or restricted. Create a new key at https://aistudio.google.com/apikey and avoid IP/referrer restrictions for server use.';
            }

            return res.status(502).json({
                success: false,
                message: 'AI service error. ' + hint,
                detail: errMsg,
                code: code,
            });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

        console.log('>>> AI REPLY SUCCESS:', reply.substring(0, 50) + '...');
        res.status(200).json({
            success: true,
            reply: reply,
        });
    } catch (error) {
        console.error('AI Error Details:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to communicate with AI Assistant',
            detail: error.message,
        });
    }
};
