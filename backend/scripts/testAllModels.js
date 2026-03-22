require('dotenv').config({ path: './.env' });

async function testModels() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const models = [
        "google/gemma-3n-e2b-it:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "qwen/qwen-2.5-7b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "google/gemma-2-9b-it:free"
    ];

    console.log("Starting model connectivity test...");
    for (const model of models) {
        process.stdout.write(`Testing ${model}... `);
        try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://lms-portal.com",
                    "X-OpenRouter-Title": "LMS TEST",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": model,
                    "messages": [{ "role": "user", "content": "hi" }]
                })
            });
            const data = await res.json();
            if (res.ok) {
                console.log("SUCCESS ✅");
            } else {
                console.log(`FAILED ❌ (${res.status}): ${data.error?.message || 'Unknown'}`);
            }
        } catch (e) {
            console.log(`ERROR ⚠️: ${e.message}`);
        }
    }
}
testModels();
