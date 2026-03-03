const express = require('express');
const {
    getAdminDashboard,
    getInstructorDashboard,
    getStudentDashboard,
    getInstructorStudents,
} = require('../controllers/dashboardController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/admin', protect, authorizeRoles('admin'), getAdminDashboard);
router.get('/instructor', protect, authorizeRoles('instructor'), getInstructorDashboard);
router.get('/students', protect, authorizeRoles('instructor', 'admin'), getInstructorStudents);
router.get('/student', protect, authorizeRoles('student'), getStudentDashboard);

module.exports = router;
