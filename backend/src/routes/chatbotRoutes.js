const express = require('express');
const { chatWithAI } = require('../controllers/chatbotController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, chatWithAI);

module.exports = router;
