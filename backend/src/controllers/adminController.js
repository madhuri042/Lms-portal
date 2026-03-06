const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = role ? { role } : {};
        const users = await User.find(filter).select('firstName lastName email role createdAt').sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: users, count: users.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all courses (admin) with instructor and enrollment count
// @route   GET /api/admin/courses
// @access  Private (Admin)
exports.getCourses = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const courses = await Course.find(filter)
            .populate('instructor', 'firstName lastName email')
            .lean();
        const data = courses.map((c) => ({
            _id: c._id,
            title: c.title,
            category: c.category || '',
            instructor: c.instructor,
            students: (c.enrolledStudents || []).length,
            status: c.status || 'approved',
        }));
        res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve a course
// @route   PATCH /api/admin/courses/:id/approve
// @access  Private (Admin)
exports.approveCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true }
        );
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get categories (distinct from courses + count)
// @route   GET /api/admin/categories
// @access  Private (Admin)
exports.getCategories = async (req, res) => {
    try {
        const categories = await Course.aggregate([
            { $match: { category: { $exists: true, $ne: '' } } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);
        const data = categories.map((c) => ({ name: c._id, count: c.count }));
        res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get assignment submissions (admin)
// @route   GET /api/admin/submissions
// @access  Private (Admin)
exports.getSubmissions = async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find()
            .populate('student', 'firstName lastName email')
            .populate({ path: 'assignment', select: 'title course', populate: { path: 'course', select: 'title' } })
            .sort({ createdAt: -1 })
            .lean();
        const data = submissions.map((s) => ({
            _id: s._id,
            student: s.student,
            assignment: s.assignment ? { _id: s.assignment._id, title: s.assignment.title } : null,
            course: s.assignment?.course || null,
            status: s.status,
            submittedDate: s.createdAt,
            marksObtained: s.marksObtained,
        }));
        res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get students progress (admin)
// @route   GET /api/admin/students/progress
// @access  Private (Admin)
exports.getStudentsProgress = async (req, res) => {
    try {
        const progress = await Progress.find()
            .populate('student', 'firstName lastName email')
            .populate('course', 'title')
            .sort({ updatedAt: -1 })
            .lean();
        const data = progress.map((p) => ({
            _id: p._id,
            student: p.student,
            course: p.course,
            completionPercentage: p.completionPercentage || 0,
            updatedAt: p.updatedAt,
        }));
        res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get students performance (admin)
// @route   GET /api/admin/students/performance
// @access  Private (Admin)
exports.getStudentsPerformance = async (req, res) => {
    try {
        const submissions = await AssignmentSubmission.find({ status: 'Evaluated' })
            .populate('student', 'firstName lastName email')
            .populate('assignment', 'title totalMarks course')
            .lean();
        const byStudent = {};
        submissions.forEach((s) => {
            const id = s.student?._id?.toString();
            if (!id) return;
            if (!byStudent[id]) {
                byStudent[id] = {
                    student: s.student,
                    totalMarks: 0,
                    obtained: 0,
                    count: 0,
                };
            }
            byStudent[id].count += 1;
            byStudent[id].totalMarks += s.assignment?.totalMarks || 0;
            byStudent[id].obtained += s.marksObtained || 0;
        });
        const data = Object.values(byStudent).map((o) => ({
            student: o.student,
            assignmentsEvaluated: o.count,
            totalMarksPossible: o.totalMarks,
            totalMarksObtained: o.obtained,
            averagePercent: o.totalMarks ? Math.round((o.obtained / o.totalMarks) * 100) : 0,
        }));
        data.sort((a, b) => b.totalMarksObtained - a.totalMarksObtained);
        res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get pending submissions for review (admin)
// @route   GET /api/admin/assignments/reviews
// @access  Private (Admin)
exports.getPendingReviews = async (req, res) => {
    try {
        const assignmentIds = await Assignment.find({}).select('_id title').lean();
        const ids = assignmentIds.map((a) => a._id);
        const submissions = await AssignmentSubmission.find({
            assignment: { $in: ids },
            status: 'Submitted',
        })
            .populate('student', 'firstName lastName email')
            .populate({ path: 'assignment', select: 'title totalMarks', populate: { path: 'course', select: 'title' } })
            .sort({ createdAt: -1 })
            .lean();
        const data = submissions.map((s) => ({
            _id: s._id,
            student: s.student,
            assignment: s.assignment,
            course: s.assignment?.course,
            submittedDate: s.createdAt,
        }));
        res.status(200).json({ success: true, data, count: data.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get activity logs (admin)
// @route   GET /api/admin/activity
// @access  Private (Admin)
exports.getActivityLogs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const skip = (page - 1) * limit;

        const submissions = await AssignmentSubmission.find()
            .sort({ updatedAt: -1 })
            .limit(limit * 2)
            .populate('student', 'firstName lastName')
            .populate('assignment', 'title')
            .lean();
        const activities = submissions.map((s) => ({
            id: s._id,
            type: s.status === 'Evaluated' ? 'graded' : 'submitted',
            description:
                s.status === 'Evaluated'
                    ? `${s.student?.firstName || 'Student'} was graded for ${s.assignment?.title || 'Assignment'}`
                    : `${s.student?.firstName || 'Student'} submitted ${s.assignment?.title || 'Assignment'}`,
            timestamp: s.updatedAt || s.createdAt,
            meta: { submissionId: s._id },
        }));

        const courses = await Course.find().sort({ createdAt: -1 }).limit(10).populate('instructor', 'firstName lastName').lean();
        courses.forEach((c) => {
            activities.push({
                id: c._id,
                type: 'course_created',
                description: `${c.instructor?.firstName || 'Instructor'} created course "${c.title}"`,
                timestamp: c.createdAt,
                meta: { courseId: c._id },
            });
        });

        const users = await User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(10).select('firstName lastName createdAt').lean();
        users.forEach((u) => {
            activities.push({
                id: u._id,
                type: 'registered',
                description: `${u.firstName || ''} ${u.lastName || ''}`.trim() + ' registered as a student',
                timestamp: u.createdAt,
                meta: { userId: u._id },
            });
        });

        const combined = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const paginated = combined.slice(skip, skip + limit);
        res.status(200).json({
            success: true,
            data: paginated,
            count: paginated.length,
            total: combined.length,
            page,
            totalPages: Math.ceil(combined.length / limit),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all notifications (admin – platform-wide)
// @route   GET /api/admin/notifications
// @access  Private (Admin)
exports.getAdminNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find()
            .populate('user', 'firstName lastName email')
            .populate('assignment', 'title')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        res.status(200).json({ success: true, data: notifications, count: notifications.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
