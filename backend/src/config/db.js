const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15 * 1000 // Increase to 15 seconds
    });
    console.log(`[BACKEND] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[BACKEND ERROR] MongoDB Connection Failed: ${error.message}`);
    if (error.message.includes('MongooseServerSelectionError')) {
        console.error('TIP: Check if your IP address is whitelisted in MongoDB Atlas "Network Access" tab.');
    }
    throw error;
  }
};

module.exports = connectDB;
