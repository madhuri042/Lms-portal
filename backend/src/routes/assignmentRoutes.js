const express = require('express');
const multer = require('multer');
const path = require('path');

const {
    createAssignment,
    getAssignments,
    submitAssignment,
    evaluateSubmission,
    getAssignmentSubmissions,
} = require('../controllers/assignmentController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true }); // Important for re-routing from courseRoutes

// Multer storage engine
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(
            null,
            `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        );
    },
});

const upload = multer({
    storage,
});

// Since mergeParams is true, these can be called from /api/courses/:courseId/assignments/
router
    .route('/')
    .get(protect, getAssignments)
    .post(protect, authorizeRoles('admin', 'instructor'), createAssignment);

// These are called directly from /api/assignments/
router
    .route('/:id/submit')
    .post(protect, authorizeRoles('student'), upload.single('file'), submitAssignment);

router
    .route('/:id/submissions')
    .get(protect, authorizeRoles('admin', 'instructor'), getAssignmentSubmissions);

router
    .route('/submissions/:id/evaluate')
    .put(protect, authorizeRoles('admin', 'instructor'), evaluateSubmission);

module.exports = router;
