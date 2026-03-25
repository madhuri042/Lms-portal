const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

async function diagnose() {
    console.log("--- MongoDB Connection Diagnostic ---");
    console.log("Current Time:", new Date().toISOString());
    
    try {
        const res = await axios.get('https://api.ipify.org?format=json');
        console.log("Your Public IP:", res.data.ip);
        console.log("ACTION: Ensure this IP is whitelisted in your MongoDB Atlas 'Network Access' tab.");
    } catch (err) {
        console.error("Could not determine public IP:", err.message);
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("MONGO_URI is missing in .env!");
        return;
    }

    console.log("Attempting to connect to MongoDB...");
    console.log("URI (masked):", uri.replace(/\/\/.*@/, "//****:****@"));

    const start = Date.now();
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
        console.log("SUCCESS: Connected to MongoDB in", Date.now() - start, "ms");
        console.log("Database Name:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);
    } catch (err) {
        console.error("FAILED: Connection error after", Date.now() - start, "ms");
        console.error("Error Message:", err.message);
        if (err.message.includes('MongooseServerSelectionError')) {
            console.log("\nLikely Cause: Your IP is not whitelisted in MongoDB Atlas, or your network/firewall is blocking the connection.");
        }
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
