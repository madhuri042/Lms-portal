/**
 * Seed script: insert sample courses for an instructor.
 * Run from backend folder: node scripts/seedInstructorCourses.js
 * Uses the first instructor (or admin) found in the DB.
 * Optional: INSTRUCTOR_EMAIL=foo@example.com node scripts/seedInstructorCourses.js
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

const SAMPLE_COURSES = [
    { title: 'Full Stack Web Development', description: 'Comprehensive course on Full Stack Web Development. Master the MERN stack, REST APIs, and deployment.', category: 'Development' },
    { title: 'Mastering React.js', description: 'Build modern user interfaces with React. Hooks, state management, and best practices.', category: 'AI & ML' },
    { title: 'Node.js Backend Engineering', description: 'Server-side JavaScript with Node.js and Express. APIs, databases, and authentication.', category: 'Cloud' },
    { title: 'Machine Learning Mastery', description: 'From fundamentals to real-world projects. Supervised learning, neural networks, and deployment.', category: 'Design' },
    { title: 'Data Science with Python', description: 'Data analysis, visualization, and machine learning with Python, pandas, and scikit-learn.', category: 'Business' },
    { title: 'Introduction to AI', description: 'Overview of artificial intelligence, machine learning, and deep learning concepts.', category: 'Security' },
    { title: 'Cloud Computing with AWS', description: 'Deploy and scale applications on AWS. EC2, S3, Lambda, and more.', category: 'Development' },
    { title: 'DevOps', description: 'CI/CD, Docker, Kubernetes, and infrastructure as code for modern software delivery.', category: 'AI & ML' },
    { title: 'Introduction to Python', description: 'A beginner-friendly guide to coding in Python, covering basics to advanced concepts.', category: 'Programming' },
    { title: 'UI/UX Design Fundamentals', description: 'User research, wireframing, prototyping, and visual design principles.', category: 'Design' },
];

async function run() {
    await mongoose.connect(MONGO_URI);

    const instructorEmail = process.env.INSTRUCTOR_EMAIL;
    let instructor;
    if (instructorEmail) {
        instructor = await User.findOne({ email: instructorEmail, role: { $in: ['instructor', 'admin'] } }).select('_id email firstName lastName');
    }
    if (!instructor) {
        instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }).select('_id email firstName lastName');
    }
    if (!instructor) {
        console.error('No instructor or admin user found. Create an instructor account first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log('Using instructor:', instructor.email);

    let created = 0;
    for (const sample of SAMPLE_COURSES) {
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
        console.log('  +', sample.title);
    }

    console.log('Done. Created', created, 'course(s) for instructor.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
