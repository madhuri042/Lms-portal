const express = require('express');
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    getEnrolledCourses,
    getTeachingCourses,
} = require('../controllers/courseController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Include other resource routers
const assignmentRouter = require('./assignmentRoutes');
const examRouter = require('./examRoutes');
const progressRouter = require('./progressRoutes');

const router = express.Router();

// 1. Static/Specific Routes (Must be HIGHER than parameterized routes)
router.route('/enrolled').get(protect, authorizeRoles('student', 'admin'), getEnrolledCourses);
router.route('/teaching').get(protect, authorizeRoles('instructor', 'admin'), getTeachingCourses);

// 2. Resource Redirection
router.use('/:courseId/assignments', assignmentRouter);
router.use('/:courseId/exams', examRouter);
router.use('/:courseId/progress', progressRouter);

// 3. Public routes for courses
router.route('/').get(getCourses);
router.route('/:id').get(getCourse);

// 4. Protected routes
router
    .route('/')
    .post(protect, authorizeRoles('admin', 'instructor'), createCourse);

router
    .route('/:id')
    .put(protect, authorizeRoles('admin', 'instructor'), updateCourse)
    .delete(protect, authorizeRoles('admin', 'instructor'), deleteCourse);

router.route('/:id/enroll').post(protect, authorizeRoles('student', 'admin'), enrollCourse);

module.exports = router;
