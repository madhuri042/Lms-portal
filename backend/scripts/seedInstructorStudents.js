/**
 * Seed script: add students to instructor's courses with progress and grades.
 * Run from backend folder: node scripts/seedInstructorStudents.js
 * Ensures instructor has courses, creates students if needed, enrolls them, adds progress and assignment grades.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const User = require('../src/models/User');
const Progress = require('../src/models/Progress');
const Assignment = require('../src/models/Assignment');
const AssignmentSubmission = require('../src/models/AssignmentSubmission');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

const SAMPLE_STUDENTS = [
    { firstName: 'Shaurya', lastName: 'Pandey', email: 'student26@lms.com', phone: '1234567891' },
    { firstName: 'Vihaan', lastName: 'Reddy', email: 'student42@lms.com', phone: '1234567892' },
    { firstName: 'Krishna', lastName: 'Patel', email: 'student54@lms.com', phone: '1234567893' },
    { firstName: 'Pari', lastName: 'Saxena', email: 'student64@lms.com', phone: '1234567894' },
    { firstName: 'Saanvi', lastName: 'Rao', email: 'student109@lms.com', phone: '1234567895' },
    { firstName: 'Arjun', lastName: 'Kumar', email: 'student70@lms.com', phone: '1234567896' },
];

const DEFAULT_PASSWORD = 'Student@123';

async function run() {
    await mongoose.connect(MONGO_URI);

    const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }).select('_id');
    if (!instructor) {
        console.error('No instructor found. Run seedInstructorCourses or create an instructor first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    const courses = await Course.find({ instructor: instructor._id }).select('_id title').lean();
    if (courses.length === 0) {
        console.error('Instructor has no courses. Run node scripts/seedInstructorCourses.js first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    const courseIds = courses.map((c) => c._id);
    const students = [];

    for (const s of SAMPLE_STUDENTS) {
        let user = await User.findOne({ email: s.email });
        if (!user) {
            user = await User.create({
                ...s,
                password: DEFAULT_PASSWORD,
                role: 'student',
            });
            console.log('  Created student:', s.email);
        }
        students.push(user);
    }

    for (const student of students) {
        const numCourses = 2 + Math.floor(Math.random() * Math.min(3, courses.length));
        const shuffled = [...courses].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numCourses && i < shuffled.length; i++) {
            const course = await Course.findById(shuffled[i]._id);
            if (course && !course.enrolledStudents.some((id) => id.toString() === student._id.toString())) {
                course.enrolledStudents.push(student._id);
                await course.save();
            }
        }
    }
    console.log('Enrolled students in courses.');

    for (const student of students) {
        const enrolledCourses = await Course.find({ enrolledStudents: student._id, _id: { $in: courseIds } }).select('_id').lean();
        for (const c of enrolledCourses) {
            let progress = await Progress.findOne({ student: student._id, course: c._id });
            const pct = 20 + Math.floor(Math.random() * 70);
            if (!progress) {
                progress = await Progress.create({ student: student._id, course: c._id, completionPercentage: pct });
            } else {
                progress.completionPercentage = pct;
                await progress.save();
            }
        }
    }
    console.log('Created/updated progress records.');

    let assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id course totalMarks').lean();
    if (assignments.length === 0) {
        for (const c of courses) {
            await Assignment.create({
                title: 'Introduction Assignment',
                description: 'Get started with the course.',
                course: c._id,
                instructor: instructor._id,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                totalMarks: 100,
            });
        }
        assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id course totalMarks').lean();
        console.log('Created placeholder assignments for grading.');
    }

    for (const assignment of assignments) {
        const enrolled = await Course.findById(assignment.course).select('enrolledStudents').lean();
        const studentIds = (enrolled && enrolled.enrolledStudents) || [];
        for (const sid of studentIds) {
            const existing = await AssignmentSubmission.findOne({ assignment: assignment._id, student: sid });
            if (!existing) {
                const total = assignment.totalMarks || 100;
                const marksObtained = Math.floor((total * (0.5 + Math.random() * 0.5)));
                await AssignmentSubmission.create({
                    assignment: assignment._id,
                    student: sid,
                    status: 'Evaluated',
                    marksObtained,
                });
            }
        }
    }
    console.log('Created assignment submissions with grades.');

    console.log('Done. Student directory data is ready.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
