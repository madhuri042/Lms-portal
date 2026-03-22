async function e2eTest() {
    try {
        // 1. Get a token (Assume we have a user from previous seeds)
        // We'll try to login or use a known test user if possible.
        // For simplicity, let's assume valid login or use a debug bypass if we had one.
        // Since I don't want to mess with db, I'll check if I can just hit a test endpoint.

        console.log("Testing reachability of /api/chat/test...");
        const testRes = await fetch("http://localhost:5000/api/chat/test");
        console.log("Test Endpoint Status:", testRes.status);
        const testData = await testRes.json();
        console.log("Test Endpoint Data:", testData);

        // 2. Mock a request to /api/chat
        // Since it's protected, it might fail with 401. 
        // But if I see 401, it means the server IS responding.
        console.log("\nCalling /api/chat (expected to fail with 401 or pass if token added)...");
        const res = await fetch("http://localhost:5000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Hello" })
        });

        console.log("Chat Status:", res.status);
        const data = await res.json().catch(() => ({}));
        console.log("Chat Response:", data);

    } catch (e) {
        console.error("Test error:", e.message);
    }
}
e2eTest();
