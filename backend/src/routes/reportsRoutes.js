const express = require('express');
const { getStudentAnalytics } = require('../controllers/reportsController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/student-analytics', protect, authorizeRoles('instructor', 'admin'), getStudentAnalytics);

module.exports = router;
