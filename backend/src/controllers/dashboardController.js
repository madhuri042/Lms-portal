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

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalInstructors,
                totalCourses,
                totalAssignments,
                totalExams,
            },
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
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
