const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const {
    createAssignment,
    getAssignments,
    getAssignmentById,
    submitAssignment,
    submitMcqAssignment,
    evaluateSubmission,
    getAssignmentSubmissions,
    getPendingSubmissions,
} = require('../controllers/assignmentController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true }); // Important for re-routing from courseRoutes

// Absolute path to uploads dir (same as server.js static: backend/uploads)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadsDir);
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

// Literal paths must come before /:id so they are not matched as assignment id
router
    .route('/submissions/pending')
    .get(protect, authorizeRoles('admin', 'instructor'), getPendingSubmissions);

router
    .route('/submissions/:id/evaluate')
    .put(protect, authorizeRoles('admin', 'instructor'), evaluateSubmission);

// These are called directly from /api/assignments/
router.route('/:id').get(protect, getAssignmentById);

router
    .route('/:id/submit-mcq')
    .post(protect, authorizeRoles('student'), submitMcqAssignment);

router
    .route('/:id/submit')
    .post(protect, authorizeRoles('student'), upload.single('file'), submitAssignment);

router
    .route('/:id/submissions')
    .get(protect, authorizeRoles('admin', 'instructor'), getAssignmentSubmissions);

module.exports = router;
