async function testLocalEndpoint() {
    try {
        const response = await fetch("http://localhost:5000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Note: The /api/chat route has 'protect' middleware.
                // We might need a JWT token if we want to test the full path.
                // But let's see if we can hit it or at least see the logs.
            },
            body: JSON.stringify({ message: "Hello" })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Local fetch error:", e.message);
    }
}
testLocalEndpoint();
