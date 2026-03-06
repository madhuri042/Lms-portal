/**
 * Seed script: add extra courses to the DB (no enrollments = "pending" for students to enroll).
 * Run from backend folder: node scripts/seedPendingCourses.js
 * Uses the first instructor/admin. These courses show in Recommended / catalog.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

const PENDING_COURSES = [
    { title: 'Introduction to TypeScript', description: 'Static typing for JavaScript. Interfaces, generics, and modern tooling.', category: 'Programming' },
    { title: 'REST API Design', description: 'Design and build RESTful APIs. Status codes, versioning, and best practices.', category: 'Web Development' },
    { title: 'Docker and Containers', description: 'Containerize applications with Docker. Images, Dockerfile, and docker-compose.', category: 'Programming' },
    { title: 'Agile and Scrum', description: 'Sprint planning, standups, retrospectives, and agile delivery.', category: 'Business' },
    { title: 'Cybersecurity Basics', description: 'Threats, encryption, and secure coding practices for developers.', category: 'Security' },
    { title: 'GraphQL APIs', description: 'Query language for APIs. Schemas, resolvers, and Apollo Server.', category: 'Web Development' },
    { title: 'Testing with Jest', description: 'Unit and integration testing in JavaScript. Mocks, coverage, and TDD.', category: 'Programming' },
    { title: 'Technical Writing', description: 'Documentation, READMEs, and clear technical communication.', category: 'Language' },
];

async function run() {
    await mongoose.connect(MONGO_URI);

    const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }).select('_id');
    if (!instructor) {
        console.error('No instructor or admin user found. Create one first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    let created = 0;
    for (const sample of PENDING_COURSES) {
        const exists = await Course.findOne({ title: sample.title, instructor: instructor._id });
        if (exists) continue;
        await Course.create({
            title: sample.title,
            description: sample.description,
            category: sample.category || '',
            instructor: instructor._id,
            enrolledStudents: [],
        });
        created++;
        console.log('Created:', sample.title);
    }

    console.log('Done. Created', created, 'pending course(s). Total courses in DB:', await Course.countDocuments());
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
