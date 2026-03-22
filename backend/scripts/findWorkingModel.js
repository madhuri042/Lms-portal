require('dotenv').config({ path: './.env' });

async function findAnyWorkingModel() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log("Fetching available models...");

    try {
        const modelsResponse = await fetch("https://openrouter.ai/api/v1/models", {
            method: "GET",
            headers: { "Authorization": `Bearer ${apiKey}` }
        });
        const { data: models } = await modelsResponse.json();
        const freeModels = models.filter(m => m.id.includes(':free')).map(m => m.id);

        console.log(`Found ${freeModels.length} free models. Testing top 10 for connectivity...`);

        for (const modelId of freeModels.slice(0, 10)) {
            process.stdout.write(`Testing ${modelId}... `);
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
                    console.log("OK!");
                    console.log(`\nSTABLE_MODEL_FOUND: ${modelId}`);
                    return;
                } else {
                    console.log(`FAILED (${response.status}): ${data.error?.message || 'Unknown error'}`);
                }
            } catch (innerErr) {
                console.log(`FETCH ERROR: ${innerErr.message}`);
            }
        }
        console.log("\nNo working free models found in the top 10. This might indicate an account-level or provider-wide issue.");
    } catch (err) {
        console.error("General error:", err.message);
    }
}

findAnyWorkingModel();
