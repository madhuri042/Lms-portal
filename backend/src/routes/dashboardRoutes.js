const express = require('express');
const {
    getAdminDashboard,
    getInstructorDashboard,
    getStudentDashboard,
} = require('../controllers/dashboardController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/admin', protect, authorizeRoles('admin'), getAdminDashboard);
router.get('/instructor', protect, authorizeRoles('instructor'), getInstructorDashboard);
router.get('/student', protect, authorizeRoles('student'), getStudentDashboard);

module.exports = router;
