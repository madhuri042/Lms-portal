/**
 * Seed script: creates sample assignments in the database.
 * Run from backend folder: node scripts/seedAssignments.js
 * Or from project root: node backend/scripts/seedAssignments.js
 */
const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend directory
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

const sampleAssignments = [
    {
        title: 'Introduction to Variables and Data Types',
        description: 'Write a short program that declares variables of different types (string, number, boolean) and prints them. Submit your code file.',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        totalMarks: 100,
    },
    {
        title: 'Functions and Control Flow',
        description: 'Implement a function that takes a number n and returns the sum of numbers from 1 to n. Include at least one loop and one conditional.',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalMarks: 100,
    },
    {
        title: 'Arrays and Objects',
        description: 'Create an array of 5 student objects (name, id, grade). Write a function to find the student with the highest grade and return their name.',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        totalMarks: 100,
    },
    {
        title: 'API Integration Assignment',
        description: 'Build a simple page that fetches data from a public API (e.g. JSONPlaceholder) and displays the results. Submit the code and a screenshot.',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        totalMarks: 100,
    },
    {
        title: 'Database Design Quiz',
        description: 'Design a normalized schema for a library system (books, members, borrowings). Submit an ER diagram or schema description document.',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        totalMarks: 50,
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        let course = await Course.findOne();
        let instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } });

        if (!instructor) {
            instructor = await User.findOne();
        }
        if (!course && instructor) {
            course = await Course.create({
                title: 'Introduction to Programming',
                description: 'Learn the basics of programming with hands-on assignments.',
                instructor: instructor._id,
                enrolledStudents: [],
            });
            console.log('Created seed course:', course.title);
        }
        if (!course || !instructor) {
            console.error('Need at least one Course and one User (instructor/admin) in the database. Create a user and course first.');
            process.exit(1);
        }

        const existingCount = await Assignment.countDocuments({ course: course._id });
        if (existingCount > 0) {
            console.log(`Assignments already exist for this course (${existingCount}). Skipping seed to avoid duplicates.`);
            process.exit(0);
        }

        for (const a of sampleAssignments) {
            await Assignment.create({
                title: a.title,
                description: a.description,
                course: course._id,
                instructor: instructor._id,
                dueDate: a.dueDate,
                totalMarks: a.totalMarks,
            });
        }

        console.log(`Inserted ${sampleAssignments.length} assignments for course "${course.title}".`);
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
