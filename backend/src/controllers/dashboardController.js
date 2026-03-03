const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AcademicExam = require('../models/AcademicExam');
const OnlineExam = require('../models/OnlineExam');
const ExamSubmission = require('../models/ExamSubmission');
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

        res.status(200).json({
            success: true,
            data: {
                totalCourses: myCourses.length,
                totalStudentsEnrolled,
                totalAssignments,
                totalExams,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get student directory for instructor (students enrolled in instructor's courses)
// @route   GET /api/dashboard/students
// @access  Private (Instructor, Admin)
exports.getInstructorStudents = async (req, res) => {
    try {
        const instructorId = req.user.id;

        const myCourses = await Course.find({ instructor: instructorId }).select('_id title enrolledStudents').lean();
        const courseIds = myCourses.map((c) => c._id);

        const allStudentIds = new Set();
        myCourses.forEach((c) => {
            (c.enrolledStudents || []).forEach((sid) => allStudentIds.add(sid.toString()));
        });
        const studentIds = Array.from(allStudentIds);

        if (studentIds.length === 0) {
            return res.status(200).json({ success: true, data: [], courses: myCourses.map((c) => ({ _id: c._id, title: c.title })) });
        }

        const students = await User.find({ _id: { $in: studentIds }, role: 'student' })
            .select('_id firstName lastName email')
            .lean();

        const progressList = await Progress.find({ student: { $in: studentIds }, course: { $in: courseIds } })
            .select('student course completionPercentage')
            .lean();

        const assignmentIds = await Assignment.find({ course: { $in: courseIds } }).distinct('_id');
        const examIds = await OnlineExam.find({ course: { $in: courseIds } }).distinct('_id');

        const assignmentSubs = await AssignmentSubmission.find({
            student: { $in: studentIds },
            assignment: { $in: assignmentIds },
            status: 'Evaluated',
        })
            .select('student assignment marksObtained')
            .populate('assignment', 'totalMarks')
            .lean();

        const examSubs = await ExamSubmission.find({
            student: { $in: studentIds },
            exam: { $in: examIds },
        })
            .select('student exam totalScore')
            .populate('exam', 'totalMarks')
            .lean();

        const progressByStudent = {};
        progressList.forEach((p) => {
            const sid = p.student.toString();
            if (!progressByStudent[sid]) progressByStudent[sid] = [];
            progressByStudent[sid].push(p.completionPercentage || 0);
        });

        const gradeByStudent = {};
        assignmentSubs.forEach((s) => {
            const sid = s.student.toString();
            const total = (s.assignment && s.assignment.totalMarks) || 100;
            const obtained = s.marksObtained != null ? s.marksObtained : 0;
            if (!gradeByStudent[sid]) gradeByStudent[sid] = { sum: 0, total: 0 };
            gradeByStudent[sid].sum += obtained;
            gradeByStudent[sid].total += total;
        });
        examSubs.forEach((s) => {
            const sid = s.student.toString();
            const exam = s.exam;
            const total = (exam && exam.totalMarks) ? exam.totalMarks : 100;
            const obtained = s.totalScore != null ? s.totalScore : 0;
            if (!gradeByStudent[sid]) gradeByStudent[sid] = { sum: 0, total: 0 };
            gradeByStudent[sid].sum += obtained;
            gradeByStudent[sid].total += total;
        });

        const courseTitlesById = {};
        myCourses.forEach((c) => { courseTitlesById[c._id.toString()] = c.title; });

        const data = students.map((s) => {
            const sid = s._id.toString();
            const enrolledCourses = myCourses
                .filter((c) => (c.enrolledStudents || []).some((id) => id.toString() === sid))
                .map((c) => ({ _id: c._id, title: c.title }));
            const percents = progressByStudent[sid] || [];
            const progressPercent = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0;
            const g = gradeByStudent[sid];
            const avgGradePercent = g && g.total > 0 ? Math.round((g.sum / g.total) * 100) : null;

            return {
                _id: s._id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                enrolledCourses,
                progressPercent,
                avgGradePercent,
                status: 'ACTIVE',
            };
        });

        res.status(200).json({
            success: true,
            data,
            courses: myCourses.map((c) => ({ _id: c._id, title: c.title })),
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
