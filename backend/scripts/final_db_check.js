const mongoose = require('mongoose');
require('dotenv').config();

const testDB = async () => {
    console.log('--- DB DIAGNOSTIC START ---');
    console.log('URI:', process.env.MONGO_URI);

    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('SUCCESS: Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        const userExists = collections.some(c => c.name === 'users');
        if (userExists) {
            const count = await db.collection('users').countDocuments();
            console.log('User Count:', count);
        } else {
            console.warn('WARNING: "users" collection NOT FOUND');
        }

    } catch (error) {
        console.error('FAILURE:', error.message);
    }
    console.log('--- DB DIAGNOSTIC END ---');
    process.exit(0);
};

testDB();
