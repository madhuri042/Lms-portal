require('dotenv').config({ path: './.env' });

async function testOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("No OPENAI_API_KEY found.");
        return;
    }
    
    console.log("Testing OpenAI API Key...");
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "gpt-4o-mini",
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

testOpenAI();
