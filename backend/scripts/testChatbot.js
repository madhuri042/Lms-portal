require('dotenv').config({ path: './.env' });
async function checkKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: { "Authorization": `Bearer ${apiKey}` }
    });
    const data = await response.json();
    console.log("Key Info:", JSON.stringify(data, null, 2));
}
checkKey();
