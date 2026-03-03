/**
 * Inserts additional sample assignments into the database.
 * Run: node scripts/addMoreAssignments.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const extra = [
    { title: 'React Components Exercise', description: 'Build a small React app with at least 3 components. Submit the repo link.', dueDays: 12, totalMarks: 100 },
    { title: 'REST API Design', description: 'Document a REST API for a todo app (endpoints, methods, request/response samples).', dueDays: 8, totalMarks: 80 },
    { title: 'Unit Testing Assignment', description: 'Write unit tests for a provided function. Achieve at least 80% coverage.', dueDays: 6, totalMarks: 50 },
];

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const course = await Course.findOne();
    const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }) || await User.findOne();
    if (!course || !instructor) {
        console.error('Need at least one course and one user.');
        process.exit(1);
    }
    for (const a of extra) {
        await Assignment.create({
            title: a.title,
            description: a.description,
            course: course._id,
            instructor: instructor._id,
            dueDate: new Date(Date.now() + a.dueDays * 24 * 60 * 60 * 1000),
            totalMarks: a.totalMarks,
        });
    }
    console.log(`Inserted ${extra.length} more assignments.`);
    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
