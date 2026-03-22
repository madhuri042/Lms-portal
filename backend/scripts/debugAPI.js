const axios = require('axios');
require('dotenv').config();

const testOpenRouter = async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = 'z-ai/glm-4.5-air:free';

    console.log('--- DIAGNOSTIC START ---');
    console.log('Model:', model);
    console.log('API Key Prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');

    if (!apiKey) {
        console.error('ERROR: OPENROUTER_API_KEY is missing in .env');
        process.exit(1);
    }

    try {
        console.log('Sending request to OpenRouter...');
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: model,
                messages: [{ role: 'user', content: 'Say hello' }],
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('SUCCESS!');
        console.log('Response:', response.data.choices[0].message.content);
    } catch (error) {
        console.error('FAILURE!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
    console.log('--- DIAGNOSTIC END ---');
};

testOpenRouter();
