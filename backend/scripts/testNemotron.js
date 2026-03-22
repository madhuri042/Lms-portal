require('dotenv').config({ path: './.env' });

async function testNemotron() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("No OPENROUTER_API_KEY found.");
        return;
    }
    
    console.log("Testing OpenRouter Nemotron API Key with reasoning...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "nvidia/nemotron-3-super-120b-a12b:free",
                "messages": [{ "role": "user", "content": "How many r's are in the word 'strawberry'?" }],
                "reasoning": { "enabled": true }
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log("SUCCESS:");
            console.log("Content:", data.choices?.[0]?.message?.content);
            console.log("\nReasoning Details:", data.choices?.[0]?.message?.reasoning_details ? "YES" : "NO");
        } else {
            console.log(`FAILED (${response.status}):`, JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testNemotron();
