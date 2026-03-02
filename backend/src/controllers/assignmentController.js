const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

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

// @desc    Get all assignments for a course
// @route   GET /api/courses/:courseId/assignments
// @access  Private
exports.getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ course: req.params.courseId });
        res.status(200).json({ success: true, count: assignments.length, data: assignments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Handle file upload
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
            'name email'
        );

        res.status(200).json({ success: true, count: submissions.length, data: submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
