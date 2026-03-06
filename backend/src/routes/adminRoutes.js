const express = require('express');
const {
    getUsers,
    getCourses,
    getSubmissions,
    approveCourse,
    getCategories,
    getStudentsProgress,
    getStudentsPerformance,
    getPendingReviews,
    getActivityLogs,
    getAdminNotifications,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/users', protect, authorizeRoles('admin'), getUsers);
router.get('/courses', protect, authorizeRoles('admin'), getCourses);
router.patch('/courses/:id/approve', protect, authorizeRoles('admin'), approveCourse);
router.get('/categories', protect, authorizeRoles('admin'), getCategories);
router.get('/submissions', protect, authorizeRoles('admin'), getSubmissions);
router.get('/students/progress', protect, authorizeRoles('admin'), getStudentsProgress);
router.get('/students/performance', protect, authorizeRoles('admin'), getStudentsPerformance);
router.get('/assignments/reviews', protect, authorizeRoles('admin'), getPendingReviews);
router.get('/activity', protect, authorizeRoles('admin'), getActivityLogs);
router.get('/notifications', protect, authorizeRoles('admin'), getAdminNotifications);

module.exports = router;
