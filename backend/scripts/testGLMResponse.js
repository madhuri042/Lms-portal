require('dotenv').config();

const testResponse = async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "z-ai/glm-4.5-air:free",
                "messages": [{ "role": "user", "content": "Hello" }],
                "stream": false
            })
        });

        const data = await response.json();
        console.log('--- FULL RESPONSE ---');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.choices && data.choices[0]) {
            const content = data.choices[0].message.content;
            console.log('--- CONTENT ---');
            console.log('Type:', typeof content);
            console.log('Value:', content);
            
            if (typeof content === 'object') {
                console.log('Keys:', Object.keys(content));
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
};

testResponse();
