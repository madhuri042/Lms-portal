const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

/**
 * GET /api/reports/student-analytics
 * Returns student analytics for the current user (instructor: their courses; admin: all).
 */
exports.getStudentAnalytics = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const instructorId = req.user.id;

        let courseFilter = {};
        if (!isAdmin) courseFilter = { instructor: instructorId };

        const courses = await Course.find(courseFilter).select('_id title enrolledStudents').lean();
        const courseIds = courses.map((c) => c._id);
        const courseMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c]));

        const allStudentIds = new Set();
        courses.forEach((c) => (c.enrolledStudents || []).forEach((id) => allStudentIds.add(id.toString())));

        if (allStudentIds.size === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalStudents: 0,
                    enrollmentByCourse: courses.map((c) => ({ courseId: c._id, courseTitle: c.title, count: 0 })),
                    progressDistribution: [
                        { range: '0-25%', count: 0 },
                        { range: '25-50%', count: 0 },
                        { range: '50-75%', count: 0 },
                        { range: '75-100%', count: 0 },
                    ],
                    averageProgress: 0,
                    averageGrade: null,
                    topStudents: [],
                    studentsWithGrades: 0,
                },
            });
        }

        const students = await User.find({ _id: { $in: Array.from(allStudentIds) }, role: 'student' })
            .select('_id firstName lastName email')
            .lean();

        const progressList = await Progress.find({
            student: { $in: Array.from(allStudentIds) },
            course: { $in: courseIds },
        })
            .select('student course completionPercentage')
            .lean();

        const assignmentIds = await Assignment.find({ course: { $in: courseIds } }).distinct('_id');
        const submissions = await AssignmentSubmission.find({
            student: { $in: Array.from(allStudentIds) },
            assignment: { $in: assignmentIds },
            status: 'Evaluated',
        })
            .populate('assignment', 'totalMarks')
            .lean();

        const assignmentsByStudent = {};
        submissions.forEach((s) => {
            const sid = s.student._id ? s.student._id.toString() : s.student.toString();
            if (!assignmentsByStudent[sid]) assignmentsByStudent[sid] = [];
            const total = (s.assignment && s.assignment.totalMarks) || 100;
            assignmentsByStudent[sid].push(total > 0 ? ((s.marksObtained || 0) / total) * 100 : 0);
        });

        const progressByStudentCourse = {};
        progressList.forEach((p) => {
            const sid = p.student._id ? p.student._id.toString() : p.student.toString();
            const cid = p.course._id ? p.course._id.toString() : p.course.toString();
            if (!progressByStudentCourse[sid]) progressByStudentCourse[sid] = {};
            progressByStudentCourse[sid][cid] = p.completionPercentage || 0;
        });

        const enrollmentByCourse = courses.map((c) => ({
            courseId: c._id,
            courseTitle: c.title,
            count: (c.enrolledStudents || []).length,
        }));

        const progressBuckets = { '0-25': 0, '25-50': 0, '50-75': 0, '75-100': 0 };
        let totalProgressSum = 0;
        let progressCount = 0;
        let totalGradeSum = 0;
        let gradeCount = 0;
        const studentStats = [];

        students.forEach((s) => {
            const sid = s._id.toString();
            const progressPcts = courseIds.map(
                (cid) => (progressByStudentCourse[sid] && progressByStudentCourse[sid][cid.toString()]) || 0
            );
            const avgProgress = progressPcts.length
                ? Math.min(100, Math.max(0, Math.round(progressPcts.reduce((a, b) => a + b, 0) / progressPcts.length)))
                : 0;
            const grades = assignmentsByStudent[sid] || [];
            const avgGrade = grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10 : null;

            if (avgProgress <= 25) progressBuckets['0-25']++;
            else if (avgProgress <= 50) progressBuckets['25-50']++;
            else if (avgProgress <= 75) progressBuckets['50-75']++;
            else progressBuckets['75-100']++;

            totalProgressSum += avgProgress;
            progressCount++;
            if (avgGrade != null) {
                totalGradeSum += avgGrade;
                gradeCount++;
            }

            studentStats.push({
                _id: s._id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                progress: avgProgress,
                avgGrade: avgGrade != null ? avgGrade : null,
            });
        });

        const progressDistribution = [
            { range: '0-25%', count: progressBuckets['0-25'] },
            { range: '25-50%', count: progressBuckets['25-50'] },
            { range: '50-75%', count: progressBuckets['50-75'] },
            { range: '75-100%', count: progressBuckets['75-100'] },
        ];

        const topStudents = [...studentStats]
            .filter((s) => s.avgGrade != null || s.progress > 0)
            .sort((a, b) => (b.avgGrade ?? 0) - (a.avgGrade ?? 0))
            .slice(0, 10)
            .map((s) => ({
                _id: s._id,
                name: [s.firstName, s.lastName].filter(Boolean).join(' ') || '—',
                email: s.email,
                progress: s.progress,
                avgGrade: s.avgGrade,
            }));

        const averageProgress = progressCount ? Math.round(totalProgressSum / progressCount) : 0;
        const averageGrade = gradeCount ? Math.round((totalGradeSum / gradeCount) * 10) / 10 : null;

        res.status(200).json({
            success: true,
            data: {
                totalStudents: students.length,
                enrollmentByCourse,
                progressDistribution,
                averageProgress,
                averageGrade,
                studentsWithGrades: gradeCount,
                topStudents,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
