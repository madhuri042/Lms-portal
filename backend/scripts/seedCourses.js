/**
 * Seed script: ensures at least 30 courses exist for recommendations.
 * Run from backend folder: node scripts/seedCourses.js
 * Uses an existing instructor/admin; creates only as many courses as needed to reach 30.
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

const TARGET_COUNT = 30;

const SAMPLE_COURSES = [
    { title: 'Introduction to Programming', description: 'Learn variables, conditionals, loops and basic algorithms.', category: 'Programming' },
    { title: 'Web Development Fundamentals', description: 'HTML, CSS and JavaScript for building modern websites.', category: 'Web Development' },
    { title: 'React and Modern Frontend', description: 'Build UIs with React, hooks and state management.', category: 'Web Development' },
    { title: 'Node.js and Backend APIs', description: 'REST APIs, Express and database integration.', category: 'Web Development' },
    { title: 'Python for Beginners', description: 'Python syntax, data structures and simple projects.', category: 'Programming' },
    { title: 'Java Programming', description: 'OOP, collections and core Java development.', category: 'Programming' },
    { title: 'UI/UX Design Principles', description: 'User research, wireframes and visual design.', category: 'Design' },
    { title: 'Figma for Designers', description: 'Create mockups and prototypes with Figma.', category: 'Design' },
    { title: 'Digital Marketing Basics', description: 'SEO, social media and content marketing.', category: 'Marketing' },
    { title: 'Business Analytics', description: 'Data-driven decisions and reporting.', category: 'Business' },
    { title: 'English Communication', description: 'Speaking, writing and presentation skills.', category: 'Language' },
    { title: 'Spanish for Beginners', description: 'Vocabulary, grammar and conversation.', category: 'Language' },
    { title: 'Algebra and Pre-Calculus', description: 'Equations, functions and graphs.', category: 'Math' },
    { title: 'Statistics for Data', description: 'Descriptive and inferential statistics.', category: 'Math' },
    { title: 'Introduction to Data Science', description: 'Data cleaning, visualization and analysis.', category: 'Data' },
    { title: 'Machine Learning Fundamentals', description: 'Supervised and unsupervised learning basics.', category: 'Data' },
    { title: 'Chemistry Basics', description: 'Atoms, molecules and chemical reactions.', category: 'Science' },
    { title: 'Physics for Engineers', description: 'Mechanics, waves and thermodynamics.', category: 'Science' },
    { title: 'Project Management', description: 'Planning, execution and agile methods.', category: 'Business' },
    { title: 'Leadership and Teams', description: 'Leading teams and effective communication.', category: 'Business' },
    { title: 'SQL and Databases', description: 'Queries, joins and database design.', category: 'Programming' },
    { title: 'Git and Version Control', description: 'Branches, merges and collaboration workflows.', category: 'Programming' },
    { title: 'Mobile App Development', description: 'Cross-platform apps with React Native or Flutter.', category: 'Web Development' },
    { title: 'Cloud and DevOps', description: 'Containers, CI/CD and cloud basics.', category: 'Programming' },
    { title: 'Creative Writing', description: 'Story structure, character and style.', category: 'Language' },
    { title: 'Graphic Design Basics', description: 'Layout, typography and color theory.', category: 'Design' },
    { title: 'Entrepreneurship', description: 'Ideation, validation and business models.', category: 'Business' },
    { title: 'Social Media Marketing', description: 'Campaigns, ads and community management.', category: 'Marketing' },
    { title: 'Biology Essentials', description: 'Cells, genetics and ecosystems.', category: 'Science' },
];

async function run() {
    await mongoose.connect(MONGO_URI);

    const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }).select('_id');
    if (!instructor) {
        console.error('No instructor or admin user found. Create one first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    const existing = await Course.countDocuments();
    if (existing >= TARGET_COUNT) {
        console.log('Already have', existing, 'courses. No new courses created.');
        await mongoose.disconnect();
        process.exit(0);
    }

    const toCreate = TARGET_COUNT - existing;
    const toUse = SAMPLE_COURSES.slice(0, toCreate);

    for (let i = 0; i < toUse.length; i++) {
        const sample = toUse[i];
        await Course.create({
            title: sample.title,
            description: sample.description,
            category: sample.category || '',
            instructor: instructor._id,
            enrolledStudents: [],
        });
    }

    const total = await Course.countDocuments();
    console.log('Created', toUse.length, 'course(s). Total courses:', total);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
