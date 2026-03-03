const express = require('express');
const {
    addAcademicExam,
    getAcademicExams,
    deleteAcademicExam,
} = require('../controllers/academicExamController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getAcademicExams).post(protect, addAcademicExam);
router.route('/:id').delete(protect, deleteAcademicExam);

module.exports = router;
