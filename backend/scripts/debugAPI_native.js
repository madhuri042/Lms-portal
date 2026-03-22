const https = require('https');
require('dotenv').config();

const apiKey = process.env.OPENROUTER_API_KEY;
const model = 'z-ai/glm-4.5-air:free';

console.log('--- NATIVE DIAGNOSTIC START ---');
console.log('Model:', model);

const data = JSON.stringify({
    model: model,
    messages: [{ role: 'user', content: 'Respond with OK' }]
});

const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
            const json = JSON.parse(body);
            if (res.statusCode === 200) {
                console.log('SUCCESS:', json.choices[0].message.content);
            } else {
                console.error('SERVER ERROR:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error('PARSE ERROR:', body);
        }
    });
});

req.on('error', (e) => console.error('CLIENT ERROR:', e.message));
req.write(data);
req.end();
