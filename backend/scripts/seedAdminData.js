/**
 * Seed data for admin dashboard: pending courses, notifications.
 * Run from backend: node scripts/seedAdminData.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const AssignmentSubmission = require('../src/models/AssignmentSubmission');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

async function run() {
    await mongoose.connect(MONGO_URI);

    // Set first 2–3 courses to pending so admin has something to approve
    const courses = await Course.find().limit(3).select('_id title');
    let pendingSet = 0;
    for (const c of courses) {
        const updated = await Course.findByIdAndUpdate(c._id, { status: 'pending' }, { new: true });
        if (updated?.status === 'pending') pendingSet++;
    }
    console.log(`Set ${pendingSet} course(s) to pending approval.`);

    // Ensure some courses have categories (for Categories page)
    const withCategory = await Course.countDocuments({ category: { $exists: true, $ne: '' } });
    console.log(`Courses with category: ${withCategory}. Run seedPendingCourses.js if you need more.`);

    // Create a couple of sample notifications for admin (if we have users and submissions)
    const user = await User.findOne({ role: 'student' }).select('_id');
    const submission = await AssignmentSubmission.findOne().populate('assignment', 'title').select('_id');
    if (user && submission?.assignment) {
        const existing = await Notification.countDocuments({ title: 'Assignment submitted (admin seed)' });
        if (existing === 0) {
            await Notification.create({
                user: user._id,
                type: 'assignment_submitted',
                title: 'Assignment submitted (admin seed)',
                message: `Submission for ${submission.assignment.title} is ready for review.`,
                link: '/dashboard/admin/assignments/reviews',
                submission: submission._id,
                assignment: submission.assignment._id,
                read: false,
            });
            console.log('Created 1 sample notification for admin.');
        }
    }

    console.log('Admin seed done.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
