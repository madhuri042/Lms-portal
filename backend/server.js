const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');

// Load env from backend folder so it works when started from project root or backend/
dotenv.config({ path: path.join(__dirname, '.env') });

// Ensure uploads directory exists (multer and static both use backend/uploads)
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('[BACKEND] Created uploads directory at', uploadsPath);
}

// Log if chatbot/Gemini key is set (do not log the key)
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    console.warn('[BACKEND] OPENAI_API_KEY is not set — AI chatbot will not work. Add a Google Gemini API key to backend/.env and restart.');
} else {
    console.log('[BACKEND] OPENAI_API_KEY is set — AI chatbot (Gemini) is configured.');
}

const app = express();

// Middleware
app.use(express.json()); // Body parser
app.use(cors()); // Enable CORS

// Request Logger for Debugging
app.use((req, res, next) => {
    console.log(`[BACKEND DEBUG] ${req.method} ${req.url}`);
    next();
});

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
    res.send('AI-Powered LMS API is running...');
});

// Load routes (academic-exams before /api/exams so "academic-exams" is not treated as :id under exams)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/courses', require('./src/routes/courseRoutes'));
app.use('/api/assignments', require('./src/routes/assignmentRoutes'));
app.use('/api/academic-exams', require('./src/routes/academicExamRoutes'));
app.use('/api/exams', require('./src/routes/examRoutes'));
// app.use('/api/progress', require('./src/routes/progressRoutes')); // Currently mounted via courseRoutes
app.use('/api/chat', require('./src/routes/chatbotRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/recommended-courses', require('./src/routes/recommendedRoutes'));
app.use('/api/instructor', require('./src/routes/instructorRoutes'));
app.use('/api/reports', require('./src/routes/reportsRoutes'));

app.get('/api/debug', (req, res) => {
    const listRoutes = (stack, parentPath = '') => {
        let routes = [];
        stack.forEach(layer => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                routes.push(`${methods} ${parentPath}${layer.route.path}`);
            } else if (layer.name === 'router' && layer.handle.stack) {
                const newParent = parentPath + (layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace('\\/', '/').replace('\\', ''));
                routes = routes.concat(listRoutes(layer.handle.stack, newParent));
            }
        });
        return routes;
    };

    res.json({
        message: 'Comprehensive Route Debug',
        timestamp: new Date().toISOString(),
        routes: listRoutes(app._router.stack)
    });
});

app.use((req, res, next) => {
    console.log(`Unmatched Request: ${req.method} ${req.url}`);
    next();
});

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
