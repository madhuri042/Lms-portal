const express = require('express');
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
} = require('../controllers/courseController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Include other resource routers
const assignmentRouter = require('./assignmentRoutes');
const examRouter = require('./examRoutes');
const progressRouter = require('./progressRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:courseId/assignments', assignmentRouter);
router.use('/:courseId/exams', examRouter);
router.use('/:courseId/progress', progressRouter);

// Public routes for courses
router.route('/').get(getCourses);
router.route('/:id').get(getCourse);

// Protected routes
router
    .route('/')
    .post(protect, authorizeRoles('admin', 'instructor'), createCourse);

router
    .route('/:id')
    .put(protect, authorizeRoles('admin', 'instructor'), updateCourse)
    .delete(protect, authorizeRoles('admin', 'instructor'), deleteCourse);

// Student enrollment
router.route('/:id/enroll').post(protect, authorizeRoles('student', 'admin'), enrollCourse);

module.exports = router;
