const express = require('express');
const { chatWithAI } = require('../controllers/chatbotController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, chatWithAI);
router.get('/version', (req, res) => res.json({ success: true, version: '2.0.0-FETCH' }));
router.get('/test', (req, res) => res.json({ success: true, message: 'Chatbot endpoint is reachable' }));

module.exports = router;
