const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const {
    addAcademicExam,
    getAcademicExams,
    deleteAcademicExam,
    streamExamPrep,
} = require('../controllers/academicExamController');
const { protect } = require('../middlewares/authMiddleware');

const syllabiDir = path.join(__dirname, '..', '..', 'uploads', 'exam-syllabi');
if (!fs.existsSync(syllabiDir)) {
    fs.mkdirSync(syllabiDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, syllabiDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || '') || '.pdf';
        const unique = `syllabus-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, unique);
    },
});

const uploadSyllabus = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok =
            file.mimetype === 'application/pdf' ||
            (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
        if (ok) cb(null, true);
        else cb(new Error('Only PDF files are allowed for the syllabus.'));
    },
});

const router = express.Router();

router.route('/').get(protect, getAcademicExams).post(protect, uploadSyllabus.single('syllabus'), addAcademicExam);
/* Explicit path so :id never collides with a segment named "prep-stream" */
router.post('/prep-stream/:id', protect, streamExamPrep);
router.route('/:id').delete(protect, deleteAcademicExam);

module.exports = router;
