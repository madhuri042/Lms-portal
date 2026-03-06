/**
 * Ensures courses that have enrolled students have at least a few assignments
 * so students see "pending assignments" on the dashboard.
 * Run from backend folder: node scripts/seedAssignmentsForEnrolledCourses.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

const SAMPLE_ASSIGNMENTS = [
    { title: 'Week 1: Getting Started', description: 'Complete the setup and submit a short reflection.', dueDays: 7, totalMarks: 100 },
    { title: 'Week 2: Core Concepts', description: 'Apply the concepts from this week in a small project.', dueDays: 14, totalMarks: 100 },
    { title: 'Week 3: Practice Assignment', description: 'Submit your solution and a brief explanation.', dueDays: 21, totalMarks: 100 },
];

async function run() {
    await mongoose.connect(MONGO_URI);

    const coursesWithStudents = await Course.find({
        $expr: { $gt: [{ $size: { $ifNull: ['$enrolledStudents', []] } }, 0] },
    })
        .populate('instructor', '_id')
        .lean();

    if (coursesWithStudents.length === 0) {
        console.log('No courses have enrolled students. Enroll at least one student in a course first (e.g. run seedInstructorStudents.js).');
        await mongoose.disconnect();
        process.exit(0);
    }

    let created = 0;
    for (const course of coursesWithStudents) {
        const count = await Assignment.countDocuments({ course: course._id });
        if (count >= 2) continue;

        const instructorId = course.instructor?._id || course.instructor;
        if (!instructorId) continue;

        const toAdd = SAMPLE_ASSIGNMENTS.slice(0, Math.max(0, 3 - count));
        for (const a of toAdd) {
            await Assignment.create({
                title: a.title,
                description: a.description,
                course: course._id,
                instructor: instructorId,
                dueDate: new Date(Date.now() + a.dueDays * 24 * 60 * 60 * 1000),
                totalMarks: a.totalMarks,
            });
            created++;
            console.log('Created:', a.title, 'in', course.title);
        }
    }

    console.log('Done. Created', created, 'assignment(s) in courses that have enrolled students.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
