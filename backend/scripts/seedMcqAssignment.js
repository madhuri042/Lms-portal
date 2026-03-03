/**
 * Inserts one MCQ assignment with sample questions.
 * Run: node scripts/seedMcqAssignment.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const course = await Course.findOne();
    const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }) || await User.findOne();
    if (!course || !instructor) {
        console.error('Need at least one course and one user.');
        process.exit(1);
    }

    const existing = await Assignment.findOne({ type: 'mcq', course: course._id });
    if (existing) {
        console.log('MCQ assignment already exists. Skipping.');
        await mongoose.disconnect();
        return;
    }

    await Assignment.create({
        title: 'JavaScript Basics – MCQ Quiz',
        description: 'Answer the following multiple choice questions on JavaScript fundamentals.',
        type: 'mcq',
        course: course._id,
        instructor: instructor._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalMarks: 15,
        questions: [
            { questionText: 'What is the result of typeof null in JavaScript?', options: ['"object"', '"null"', '"undefined"', 'null'], correctAnswer: '"object"', marks: 5 },
            { questionText: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const', 'both let and const'], correctAnswer: 'both let and const', marks: 5 },
            { questionText: 'What does Array.isArray([]) return?', options: ['false', 'true', 'undefined', 'null'], correctAnswer: 'true', marks: 5 },
        ],
    });
    console.log('Inserted MCQ assignment "JavaScript Basics – MCQ Quiz" with 3 questions.');
    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
