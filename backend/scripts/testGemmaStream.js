require('dotenv').config();

async function testStream() {
    console.log("Starting test against LOCALHOST backend (Direct Stream)...");
    try {
        const response = await fetch("http://localhost:5000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Hello, backend stream test! Give me a 1-sentence response." })
        });

        console.log("Status:", response.status);
        if (response.status !== 200) {
            console.log(await response.text());
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                console.log("CHUNK START >>>");
                console.log(chunk);
                console.log("<<< CHUNK END");
            }
        }
        console.log("Stream completely finished.");
    } catch (e) {
        console.error("Error:", e);
    }
}
testStream();
