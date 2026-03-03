const AcademicExam = require('../models/AcademicExam');

// @desc    Add an academic exam
// @route   POST /api/academic-exams
// @access  Private
exports.addAcademicExam = async (req, res) => {
    try {
        req.body.user = req.user.id;
        const exam = await AcademicExam.create(req.body);
        res.status(201).json({ success: true, data: exam });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all academic exams for the current user (delete exams whose date has passed)
// @route   GET /api/academic-exams
// @access  Private
exports.getAcademicExams = async (req, res) => {
    try {
        const userId = req.user.id;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Delete exams whose exam date has passed (date completed)
        await AcademicExam.deleteMany({
            user: userId,
            examDate: { $ne: null, $lt: startOfToday },
        });

        const exams = await AcademicExam.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: exams.length, data: exams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete an academic exam
// @route   DELETE /api/academic-exams/:id
// @access  Private
exports.deleteAcademicExam = async (req, res) => {
    try {
        const exam = await AcademicExam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        if (exam.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await exam.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
