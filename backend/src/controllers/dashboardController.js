const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AcademicExam = require('../models/AcademicExam');
const OnlineExam = require('../models/OnlineExam');
const Progress = require('../models/Progress');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalInstructors = await User.countDocuments({ role: 'instructor' });
        const totalCourses = await Course.countDocuments();
        const totalAssignments = await Assignment.countDocuments();
        const totalExams = await OnlineExam.countDocuments();

        const activeCourses = totalCourses; // All courses are active unless you add status
        const pendingApprovals = 0; // Placeholder if you add course approval workflow later

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalInstructors,
                totalCourses,
                totalAssignments,
                totalExams,
                activeCourses,
                pendingApprovals,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Admin Recent Activity
// @route   GET /api/dashboard/admin/activity
// @access  Private (Admin)
exports.getAdminActivity = async (req, res) => {
    try {
        const limit = 20;
        const submissions = await AssignmentSubmission.find()
            .sort({ createdAt: -1 })
            .limit(limit)
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
            userId: s.student?._id,
        }));
        const courses = await Course.find().sort({ createdAt: -1 }).limit(5).populate('instructor', 'firstName lastName').lean();
        const courseActivities = courses.map((c) => ({
            id: c._id,
            type: 'course_created',
            description: `${c.instructor?.firstName || 'Instructor'} created course "${c.title}"`,
            timestamp: c.createdAt,
            userId: c.instructor?._id,
        }));
        const users = await User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('firstName lastName createdAt').lean();
        const userActivities = users.map((u) => ({
            id: u._id,
            type: 'registered',
            description: `${u.firstName || ''} ${u.lastName || ''}`.trim() + ' registered as a student',
            timestamp: u.createdAt,
            userId: u._id,
        }));
        const combined = [...activities, ...courseActivities.map((a) => ({ ...a, id: `c-${a.id}` })), ...userActivities.map((a) => ({ ...a, id: `u-${a.id}` }))]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
        res.status(200).json({ success: true, data: combined });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Admin Analytics (charts)
// @route   GET /api/dashboard/admin/analytics
// @access  Private (Admin)
exports.getAdminAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const userGrowth = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const count = await User.countDocuments({ createdAt: { $gte: d, $lt: next } });
            userGrowth.push({ date: d.toISOString().slice(0, 10), count, label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] });
        }
        const courses = await Course.find().populate('instructor', 'firstName lastName').lean();
        const courseEnrollments = courses.slice(0, 10).map((c) => ({ name: c.title, enrollments: (c.enrolledStudents || []).length }));
        const totalSubmissions = await AssignmentSubmission.countDocuments();
        const evaluatedSubmissions = await AssignmentSubmission.countDocuments({ status: 'Evaluated' });
        const assignmentCompletionRate = totalSubmissions ? Math.round((evaluatedSubmissions / totalSubmissions) * 100) : 0;
        res.status(200).json({
            success: true,
            data: { userGrowth, courseEnrollments, assignmentCompletionRate, totalSubmissions, evaluatedSubmissions },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Instructor Dashboard Stats
// @route   GET /api/dashboard/instructor
// @access  Private (Instructor)
exports.getInstructorDashboard = async (req, res) => {
    try {
        const instructorId = req.user.id;

        const myCourses = await Course.find({ instructor: instructorId });
        const courseIds = myCourses.map((c) => c._id);

        const totalStudentsEnrolled = myCourses.reduce(
            (acc, course) => acc + course.enrolledStudents.length,
            0
        );

        const totalAssignments = await Assignment.countDocuments({ instructor: instructorId });
        const totalExams = await OnlineExam.countDocuments({ instructor: instructorId });

        const instructorAssignmentIds = await Assignment.find({ instructor: instructorId }).distinct('_id');
        const pendingSubmissions = await AssignmentSubmission.countDocuments({
            assignment: { $in: instructorAssignmentIds },
            status: { $in: ['Submitted', 'Pending'] },
        });

        res.status(200).json({
            success: true,
            data: {
                totalCourses: myCourses.length,
                totalStudentsEnrolled,
                totalAssignments,
                totalExams,
                pendingSubmissions,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Student Dashboard Stats
// @route   GET /api/dashboard/student
// @access  Private (Student)
exports.getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        const enrolledCourses = await Course.find({ enrolledStudents: studentId });
        const courseIds = enrolledCourses.map((c) => c._id);

        // Match Assignments page: count all assignments (GET /api/assignments returns all)
        const totalAssignments = await Assignment.countDocuments({});

        const pendingAssignments = await Assignment.countDocuments({
            course: { $in: courseIds },
        });

        const submittedAssignmentsCount = await AssignmentSubmission.countDocuments({
            student: studentId,
            status: 'Submitted',
        });

        const evaluatedAssignmentsCount = await AssignmentSubmission.countDocuments({
            student: studentId,
            status: 'Evaluated',
        });

        const totalExamsRemaining = await AcademicExam.countDocuments({ user: studentId });

        const upcomingExams = await OnlineExam.countDocuments({
            course: { $in: courseIds },
            isPublished: true,
        });

        const progressReports = await Progress.find({ student: studentId }).populate('course', 'title');

        // Weekly activity: last 7 days, count of assignment submissions per day
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const weeklyActivity = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const count = await AssignmentSubmission.countDocuments({
                student: studentId,
                createdAt: { $gte: d, $lt: next },
            });
            weeklyActivity.push({
                dayLabel: dayLabels[d.getDay()],
                date: d.toISOString().slice(0, 10),
                count,
            });
        }

        res.status(200).json({
            success: true,
            data: {
                totalEnrolledCourses: enrolledCourses.length,
                pendingAssignments,
                upcomingExams,
                totalAssignments,
                submittedAssignmentsCount,
                evaluatedAssignmentsCount,
                totalExamsRemaining,
                progressReports,
                weeklyActivity,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
