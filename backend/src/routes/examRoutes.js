const express = require('express');

const {
    createExam,
    getExams,
    getExam,
    submitExam,
} = require('../controllers/examController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

// Routes starting with /api/courses/:courseId/exams
router
    .route('/')
    .get(protect, getExams)
    .post(protect, authorizeRoles('admin', 'instructor'), createExam);

// Routes starting with /api/exams/
router
    .route('/:id')
    .get(protect, getExam);

router
    .route('/:id/submit')
    .post(protect, authorizeRoles('student'), submitExam);

module.exports = router;
