/**
 * Set recommended courses (replace the list).
 * Run from backend: node scripts/setRecommendedCourses.js
 * Or with course IDs: RECOMMENDED_IDS=id1,id2,id3 node scripts/setRecommendedCourses.js
 * If RECOMMENDED_IDS is not set, uses first 30 courses from DB.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const CourseRecommendation = require('../src/models/CourseRecommendation');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

async function run() {
    await mongoose.connect(MONGO_URI);

    let courseIds = [];
    const envIds = process.env.RECOMMENDED_IDS;
    if (envIds && typeof envIds === 'string') {
        courseIds = envIds.split(',').map((id) => id.trim()).filter(Boolean);
    }

    if (courseIds.length === 0) {
        const courses = await Course.find().select('_id').limit(30).lean();
        courseIds = courses.map((c) => c._id.toString());
        console.log('No RECOMMENDED_IDS set; using first', courseIds.length, 'courses from DB.');
    }

    await CourseRecommendation.deleteMany({});
    const docs = courseIds.slice(0, 30).map((courseId, index) => ({
        course: courseId,
        sortOrder: index,
    }));

    if (docs.length > 0) {
        await CourseRecommendation.insertMany(docs);
        console.log('Set', docs.length, 'recommended courses.');
    } else {
        console.log('No courses to recommend. Add RECOMMENDED_IDS or create courses first.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
