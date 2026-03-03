/**
 * Seed script: creates sample academic exams (submitted, evaluated, upcoming) with dates.
 * Run from backend folder: node scripts/seedAcademicExams.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const AcademicExam = require('../src/models/AcademicExam');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

const now = new Date();
const sampleExams = [
    { universityName: 'ABC University', examName: 'Mid-term Examination', examCode: 'CS101-MID', examDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), status: 'evaluated' },
    { universityName: 'ABC University', examName: 'Final Examination', examCode: 'CS101-FIN', examDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), status: 'evaluated' },
    { universityName: 'XYZ Institute', examName: 'Semester End Exam', examCode: 'MATH201-SEM', examDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: 'submitted' },
    { universityName: 'XYZ Institute', examName: 'Programming Lab Test', examCode: 'PROG-LAB1', examDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: 'submitted' },
    { universityName: 'National University', examName: 'Entrance Test', examCode: 'ENT-2025', examDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), status: 'upcoming' },
    { universityName: 'National University', examName: 'Placement Assessment', examCode: 'PLACE-2025', examDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), status: 'upcoming' },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        const user = await User.findOne();
        if (!user) {
            console.error('No user found. Create a user first (e.g. register).');
            process.exit(1);
        }

        const existingCount = await AcademicExam.countDocuments({ user: user._id });
        if (existingCount > 0) {
            console.log(`Academic exams already exist for this user (${existingCount}). Skipping seed to avoid duplicates.`);
            process.exit(0);
        }

        for (const e of sampleExams) {
            await AcademicExam.create({
                user: user._id,
                universityName: e.universityName,
                examName: e.examName,
                examCode: e.examCode,
                examDate: e.examDate,
                status: e.status,
            });
        }

        console.log(`Inserted ${sampleExams.length} academic exams (submitted, evaluated, upcoming) with dates.`);
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
