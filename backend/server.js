const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Body parser
app.use(cors()); // Enable CORS

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
    res.send('AI-Powered LMS API is running...');
});

// Load routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/assignments', require('./src/routes/assignmentRoutes'));
app.use('/api/exams', require('./src/routes/examRoutes'));
// app.use('/api/progress', require('./src/routes/progressRoutes')); // Currently mounted via courseRoutes
app.use('/api/chat', require('./src/routes/chatbotRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));

const errorHandler = require('./src/middlewares/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

start();
