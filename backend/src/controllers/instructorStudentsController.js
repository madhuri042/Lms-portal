const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

/**
 * GET /api/instructor/students
 * Returns students enrolled in instructor's courses with enrolled courses, progress, avg grade.
 * Query: courseId (optional) - filter by one course
 */
exports.getStudentDirectory = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { courseId } = req.query;

        const courseFilter = { instructor: instructorId };
        if (courseId) courseFilter._id = courseId;

        const courses = await Course.find(courseFilter).select('_id title enrolledStudents').lean();
        const courseIds = courses.map((c) => c._id);
        const courseMap = Object.fromEntries(courses.map((c) => [c._id.toString(), c]));

        const allStudentIds = new Set();
        courses.forEach((c) => (c.enrolledStudents || []).forEach((id) => allStudentIds.add(id.toString())));

        if (allStudentIds.size === 0) {
            return res.status(200).json({ success: true, data: [], courses: courses.map((c) => ({ _id: c._id, title: c.title })) });
        }

        const students = await User.find({ _id: { $in: Array.from(allStudentIds) }, role: 'student' })
            .select('_id firstName lastName email phone')
            .lean();

        const progressList = await Progress.find({ student: { $in: Array.from(allStudentIds) }, course: { $in: courseIds } })
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
            assignmentsByStudent[sid].push(total > 0 ? (s.marksObtained || 0) / total * 100 : 0);
        });

        const progressByStudentCourse = {};
        progressList.forEach((p) => {
            const sid = p.student._id ? p.student._id.toString() : p.student.toString();
            const cid = p.course._id ? p.course._id.toString() : p.course.toString();
            if (!progressByStudentCourse[sid]) progressByStudentCourse[sid] = {};
            progressByStudentCourse[sid][cid] = p.completionPercentage || 0;
        });

        const studentEnrolledCourses = {};
        courses.forEach((c) => {
            (c.enrolledStudents || []).forEach((ref) => {
                const sid = ref.toString();
                if (!studentEnrolledCourses[sid]) studentEnrolledCourses[sid] = [];
                studentEnrolledCourses[sid].push(courseMap[c._id.toString()] ? courseMap[c._id.toString()].title : '');
            });
        });

        const directory = students.map((s) => {
            const sid = s._id.toString();
            const enrolledTitles = (studentEnrolledCourses[sid] || []).filter(Boolean);
            const progressPcts = courseIds.map((cid) => (progressByStudentCourse[sid] && progressByStudentCourse[sid][cid.toString()]) || 0);
            const avgProgress = progressPcts.length ? Math.round(progressPcts.reduce((a, b) => a + b, 0) / progressPcts.length) : 0;
            const grades = assignmentsByStudent[sid] || [];
            const avgGrade = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

            return {
                _id: s._id,
                firstName: s.firstName,
                lastName: s.lastName,
                email: s.email,
                phone: s.phone || '',
                enrolledCourses: enrolledTitles,
                progress: Math.min(100, Math.max(0, avgProgress)),
                avgGrade: avgGrade != null ? avgGrade : null,
                status: 'ACTIVE',
            };
        });

        const coursesForDropdown = courses.map((c) => ({ _id: c._id, title: c.title }));

        res.status(200).json({ success: true, data: directory, courses: coursesForDropdown });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/instructor/students
 * Create a new student (instructor only). Body: firstName, lastName, email, phone.
 * Optional: courseId to enroll the student in one of instructor's courses.
 * Password is set to a default; instructors cannot set or change it here.
 */
exports.createStudent = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, courseId } = req.body;

        if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide firstName, lastName, email, and phone.',
            });
        }

        const phoneStr = String(phone).trim().replace(/\D/g, '');
        if (phoneStr.length !== 10) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits.',
            });
        }

        const userExists = await User.findOne({ $or: [{ email: email.trim() }, { phone: phoneStr }] });
        if (userExists) {
            const field = userExists.email === email.trim() ? 'Email' : 'Phone number';
            return res.status(400).json({ success: false, message: `${field} already exists.` });
        }

        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            phone: phoneStr,
            password: 'Student@123',
            role: 'student',
        });

        if (courseId) {
            const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
            if (course && !course.enrolledStudents.some((id) => id.toString() === user._id.toString())) {
                course.enrolledStudents.push(user._id);
                await course.save();
            }
        }

        res.status(201).json({
            success: true,
            message: 'Student created successfully.',
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/instructor/students/:id
 * Update a student's profile. Instructor can only update students enrolled in their courses.
 * Body: firstName, lastName, email, phone. Password cannot be changed here.
 */
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone } = req.body;
        const instructorId = req.user.id;

        const courses = await Course.find({ instructor: instructorId }).select('enrolledStudents').lean();
        const studentIds = new Set();
        courses.forEach((c) => (c.enrolledStudents || []).forEach((sid) => studentIds.add(sid.toString())));

        if (!studentIds.has(id)) {
            return res.status(403).json({ success: false, message: 'You can only update students enrolled in your courses.' });
        }

        const user = await User.findById(id);
        if (!user || user.role !== 'student') {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const updates = {};
        if (firstName != null && String(firstName).trim()) updates.firstName = String(firstName).trim();
        if (lastName != null && String(lastName).trim()) updates.lastName = String(lastName).trim();
        if (email != null && String(email).trim()) {
            const newEmail = String(email).trim().toLowerCase();
            const existing = await User.findOne({ email: newEmail, _id: { $ne: id } });
            if (existing) return res.status(400).json({ success: false, message: 'Email already in use.' });
            updates.email = newEmail;
        }
        if (phone != null) {
            const phoneStr = String(phone).replace(/\D/g, '');
            if (phoneStr.length !== 10) {
                return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits.' });
            }
            const existing = await User.findOne({ phone: phoneStr, _id: { $ne: id } });
            if (existing) return res.status(400).json({ success: false, message: 'Phone number already in use.' });
            updates.phone = phoneStr;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update.' });
        }

        Object.assign(user, updates);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Student updated successfully.',
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/instructor/students/:id
 * Remove student from all of the instructor's courses (unenroll). Does not delete the user account.
 */
exports.removeStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const instructorId = req.user.id;

        const courses = await Course.find({ instructor: instructorId, enrolledStudents: id });
        for (const course of courses) {
            course.enrolledStudents = course.enrolledStudents.filter(
                (sid) => sid.toString() !== id
            );
            await course.save();
        }

        res.status(200).json({
            success: true,
            message: 'Student has been removed from your courses.',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
