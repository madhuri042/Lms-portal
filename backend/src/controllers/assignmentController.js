const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create new assignment
// @route   POST /api/courses/:courseId/assignments
// @access  Private (Admin, Instructor)
exports.createAssignment = async (req, res) => {
    try {
        req.body.course = req.params.courseId;
        req.body.instructor = req.user.id;

        const assignment = await Assignment.create(req.body);

        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get single assignment by ID (for opening / taking)
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
        }

        const assignment = await Assignment.findById(id)
            .populate('course', 'title')
            .populate('instructor', 'firstName lastName');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found. It may have been removed or the ID is invalid.',
            });
        }

        const data = assignment.toObject();
        // Hide correct answers from students when fetching MCQ
        if (req.user && req.user.role === 'student' && data.questions && data.questions.length) {
            data.questions.forEach((q) => delete q.correctAnswer);
        }
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('getAssignmentById error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to load assignment' });
    }
};

// @desc    Get all assignments (all or for a course), with mySubmission for current user
// @route   GET /api/assignments or GET /api/courses/:courseId/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        let assignments;
        if (courseId) {
            assignments = await Assignment.find({ course: courseId });
        } else {
            assignments = await Assignment.find()
                .populate('course', 'title')
                .populate('instructor', 'firstName lastName');
        }

        // For students: attach current user's submission status and grade to each assignment
        if (req.user && req.user.role === 'student' && assignments.length > 0) {
            const assignmentIds = assignments.map((a) => a._id);
            const submissions = await AssignmentSubmission.find({
                assignment: { $in: assignmentIds },
                student: req.user.id,
            });
            const byAssignment = {};
            submissions.forEach((s) => {
                byAssignment[s.assignment.toString()] = {
                    status: s.status || 'Submitted',
                    marksObtained: s.marksObtained,
                    feedback: s.feedback,
                };
            });
            assignments = assignments.map((a) => {
                const d = a.toObject ? a.toObject() : { ...a };
                d.mySubmission = byAssignment[d._id.toString()] || null;
                return d;
            });
        }

        res.status(200).json({ success: true, count: assignments.length, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit MCQ assignment (answers only)
// @route   POST /api/assignments/:id/submit-mcq
// @access  Private (Student)
exports.submitMcqAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        if (assignment.type !== 'mcq') {
            return res.status(400).json({ success: false, message: 'This assignment is not an MCQ assignment' });
        }

        const { answers } = req.body; // [{ questionId, answerGiven }]
        if (!Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'answers array is required' });
        }

        let totalScore = 0;
        const processedAnswers = answers.map((ans) => {
            const q = assignment.questions.id(ans.questionId);
            let marksAwarded = 0;
            if (q && q.correctAnswer === ans.answerGiven) {
                marksAwarded = q.marks || 0;
                totalScore += marksAwarded;
            }
            return { questionId: ans.questionId, answerGiven: ans.answerGiven };
        });

        let submission = await AssignmentSubmission.findOne({
            assignment: req.params.id,
            student: req.user.id,
        });
        if (submission) {
            submission.answers = processedAnswers;
            submission.marksObtained = totalScore;
            submission.status = 'Evaluated';
            submission.fileUrl = submission.fileUrl || undefined;
            await submission.save();
        } else {
            submission = await AssignmentSubmission.create({
                assignment: req.params.id,
                student: req.user.id,
                answers: processedAnswers,
                marksObtained: totalScore,
                status: 'Evaluated',
            });
        }
        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit an assignment (file upload for programming)
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Handle file upload (required for programming)
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Check if student already submitted
        let submission = await AssignmentSubmission.findOne({
            assignment: req.params.id,
            student: req.user.id,
        });

        if (submission) {
            // Update submission (resubmit before deadline)
            submission.fileUrl = fileUrl;
            submission.status = 'Submitted';
            await submission.save();
        } else {
            // Create new submission
            submission = await AssignmentSubmission.create({
                assignment: req.params.id,
                student: req.user.id,
                fileUrl,
                status: 'Submitted',
            });
        }

        // Notify instructor
        const instructorId = assignment.instructor && assignment.instructor.toString();
        if (instructorId) {
            const student = await User.findById(req.user.id).select('firstName lastName').lean();
            const full = student ? [student.firstName, student.lastName].filter(Boolean).join(' ').trim() : '';
            const studentName = full || 'A student';
            await Notification.create({
                user: instructorId,
                type: 'assignment_submitted',
                title: 'New assignment submission',
                message: `${studentName} submitted "${assignment.title}".`,
                link: `/dashboard/submissions?assignment=${assignment._id}&submission=${submission._id}`,
                submission: submission._id,
                assignment: assignment._id,
            });
        }

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Evaluate an assignment
// @route   PUT /api/assignments/submissions/:id/evaluate
// @access  Private (Admin, Instructor)
exports.evaluateSubmission = async (req, res) => {
    try {
        const { marksObtained, feedback } = req.body;

        let submission = await AssignmentSubmission.findById(req.params.id).populate('assignment');

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        // Check permissions
        if (
            submission.assignment.instructor.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to evaluate this assignment',
            });
        }

        submission.marksObtained = marksObtained;
        submission.feedback = feedback;
        submission.status = 'Evaluated';

        await submission.save();

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Admin, Instructor)
exports.getAssignmentSubmissions = async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find({ assignment: req.params.id }).populate(
            'student',
            'firstName lastName email'
        );

        res.status(200).json({ success: true, count: submissions.length, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get pending submissions for instructor (to evaluate)
// @route   GET /api/assignments/submissions/pending
// @access  Private (Instructor, Admin)
exports.getPendingSubmissions = async (req, res) => {
    try {
        const assignments = await Assignment.find(
            req.user.role === 'admin' ? {} : { instructor: req.user.id }
        ).select('_id title');

        const assignmentIds = assignments.map((a) => a._id);
        const submissions = await AssignmentSubmission.find({
            assignment: { $in: assignmentIds },
            status: 'Submitted',
        })
            .populate('student', 'firstName lastName email')
            .populate('assignment', 'title totalMarks')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: submissions.length, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
