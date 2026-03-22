require('dotenv').config({ path: './.env' });

async function testSpecific() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelId = "google/gemma-3n-e2b-it:free";

    console.log(`Testing ${modelId}...`);
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://lms-portal.com",
                "X-OpenRouter-Title": "LMS AI Assistant",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": modelId,
                "messages": [{ "role": "user", "content": "hi" }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("SUCCESS:", data.choices?.[0]?.message?.content);
        } else {
            console.log(`FAILED (${response.status}):`, JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testSpecific();
