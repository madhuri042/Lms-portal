/**
 * Stream a chat completion from OpenRouter to an Express response (SSE, same shape as /api/chat).
 * @returns {Promise<boolean>} false if setup failed (response already sent)
 */
async function streamOpenRouterToSse(res, { systemPrompt, userMessage }) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        res.status(503).json({
            success: false,
            message:
                'AI Assistant is not configured. Please add OPENROUTER_API_KEY to backend/.env and restart the server.',
        });
        return false;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://lms-portal.com',
            'X-OpenRouter-Title': 'LMS AI Assistant',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'z-ai/glm-4.5-air:free',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        res.status(response.status).json({
            success: false,
            message: `AI service error: ${errorData.error?.message || 'Failed to connect to OpenRouter'}`,
        });
        return false;
    }

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
                } catch {
                    // partial JSON
                }
            }
        }
    }

    res.end();
    return true;
}

module.exports = { streamOpenRouterToSse };
