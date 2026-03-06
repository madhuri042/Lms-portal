const express = require('express');
const {
    getAdminDashboard,
    getAdminActivity,
    getAdminAnalytics,
    getInstructorDashboard,
    getStudentDashboard,
} = require('../controllers/dashboardController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/admin', protect, authorizeRoles('admin'), getAdminDashboard);
router.get('/admin/activity', protect, authorizeRoles('admin'), getAdminActivity);
router.get('/admin/analytics', protect, authorizeRoles('admin'), getAdminAnalytics);
router.get('/instructor', protect, authorizeRoles('instructor'), getInstructorDashboard);
router.get('/student', protect, authorizeRoles('student'), getStudentDashboard);

module.exports = router;
