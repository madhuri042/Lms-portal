const express = require('express');
const { register, login, getMe } = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', protect, getMe);
router.get('/test', (req, res) => res.json({ message: 'Auth routes are working' }));

module.exports = router;
