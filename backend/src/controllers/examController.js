const OnlineExam = require('../models/OnlineExam');
const ExamSubmission = require('../models/ExamSubmission');

const MIN_MCQ_EXAM_QUESTIONS = 20;

// @desc    Create an online exam
// @route   POST /api/courses/:courseId/exams
// @access  Private (Admin, Instructor)
exports.createExam = async (req, res) => {
    try {
        req.body.course = req.params.courseId;
        req.body.instructor = req.user.id;

        const questions = req.body.questions;
        if (!Array.isArray(questions) || questions.length < MIN_MCQ_EXAM_QUESTIONS) {
            return res.status(400).json({
                success: false,
                message: `MCQ/online exams must have at least ${MIN_MCQ_EXAM_QUESTIONS} questions. You provided ${Array.isArray(questions) ? questions.length : 0}.`,
            });
        }

        const exam = await OnlineExam.create(req.body);

        res.status(201).json({ success: true, data: exam });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get exams for a course
// @route   GET /api/courses/:courseId/exams
// @access  Private
exports.getExams = async (req, res) => {
    try {
        const exams = await OnlineExam.find({ course: req.params.courseId });
        res.status(200).json({ success: true, count: exams.length, data: exams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single exam (hides correct answers for students)
// @route   GET /api/exams/:id
// @access  Private
exports.getExam = async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        // Clone the exam object to modify
        const examData = exam.toObject();

        // If user is student, hide the correctAnswer field
        if (req.user.role === 'student' && examData.questions) {
            examData.questions.forEach((q) => {
                delete q.correctAnswer;
            });
        }

        res.status(200).json({ success: true, data: examData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit an exam
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
exports.submitExam = async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        const { answers } = req.body;

        // Auto-calculate MCQ scores
        let totalScore = 0;
        let needsManualEvaluation = false;

        const processedAnswers = answers.map((ans) => {
            // Find the question in the exam
            const question = exam.questions.find((q) => q._id.toString() === ans.questionId.toString());

            let marksAwarded = 0;

            if (question) {
                if (question.type === 'MCQ') {
                    if (question.correctAnswer === ans.answerGiven) {
                        marksAwarded = question.marks;
                        totalScore += marksAwarded;
                    }
                } else {
                    // Descriptive requires manual evaluation
                    needsManualEvaluation = true;
                }
            }

            return {
                questionId: ans.questionId,
                answerGiven: ans.answerGiven,
                marksAwarded,
            };
        });

        const submissionStatus = needsManualEvaluation ? 'Pending Evaluation' : 'Evaluated';

        const submission = await ExamSubmission.create({
            exam: req.params.id,
            student: req.user.id,
            answers: processedAnswers,
            totalScore,
            status: submissionStatus,
        });

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
