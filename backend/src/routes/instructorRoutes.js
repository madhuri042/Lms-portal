const express = require('express');
const { getStudentDirectory, createStudent, updateStudent, removeStudent } = require('../controllers/instructorStudentsController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router
    .route('/students')
    .get(protect, authorizeRoles('instructor', 'admin'), getStudentDirectory)
    .post(protect, authorizeRoles('instructor', 'admin'), createStudent);

router
    .route('/students/:id')
    .put(protect, authorizeRoles('instructor', 'admin'), updateStudent)
    .delete(protect, authorizeRoles('instructor', 'admin'), removeStudent);

module.exports = router;
