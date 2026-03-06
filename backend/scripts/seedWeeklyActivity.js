/**
 * Seed script: adds assignment submissions with createdAt spread over the last 7 days
 * so the student dashboard "Weekly Activity" graph shows data.
 * Run from backend folder: node scripts/seedWeeklyActivity.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const AssignmentSubmission = require('../src/models/AssignmentSubmission');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

// How many submissions per day (for the last 7 days). Index 0 = 7 days ago, 6 = today.
const SUBMISSIONS_PER_DAY = [2, 0, 3, 1, 4, 2, 3];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        const student = await User.findOne({ role: 'student' });
        if (!student) {
            console.error('No student found. Create a student user first (e.g. run seedInstructorStudents.js or sign up).');
            process.exit(1);
        }

        let assignments = await Assignment.find().limit(30).select('_id').lean();
        if (assignments.length === 0) {
            console.error('No assignments found. Run seedAssignments.js or seedInstructorCourses.js first.');
            process.exit(1);
        }

        // Assignments this student has not submitted yet
        const existingSubs = await AssignmentSubmission.find({ student: student._id }).select('assignment _id').lean();
        const submittedIds = new Set(existingSubs.map((s) => s.assignment.toString()));
        const available = assignments.filter((a) => !submittedIds.has(a._id.toString()));

        const now = new Date();
        let created = 0;
        let usedIndex = 0;

        if (available.length === 0 && existingSubs.length >= 7) {
            // Fallback: spread existing submissions' createdAt over the last 7 days so the graph shows data
            console.log('Student already has submissions. Backdating some to spread over the last 7 days.');
            const toUpdate = existingSubs.slice(0, 15);
            for (let i = 0; i < toUpdate.length; i++) {
                const dayOffset = i % 7;
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - dayOffset));
                d.setHours(10 + (i % 5), 30 + i * 2, 0, 0);
                await AssignmentSubmission.updateOne(
                    { _id: toUpdate[i]._id },
                    { $set: { createdAt: d } }
                );
                created++;
            }
            console.log(`Done. Updated createdAt for ${created} submission(s) to spread over the last 7 days.`);
        } else {
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const d = new Date(now);
                d.setDate(d.getDate() - (6 - dayOffset));
                d.setHours(10 + dayOffset, 30, 0, 0);

                const count = SUBMISSIONS_PER_DAY[dayOffset] || 0;
                for (let i = 0; i < count; i++) {
                    if (usedIndex >= available.length) break;
                    const assignment = available[usedIndex];

                    const sub = await AssignmentSubmission.create({
                        assignment: assignment._id,
                        student: student._id,
                        status: dayOffset >= 5 ? 'Submitted' : 'Evaluated',
                        marksObtained: dayOffset >= 5 ? undefined : 70 + Math.floor(Math.random() * 25),
                    });
                    const createdAt = new Date(d);
                    createdAt.setMinutes(createdAt.getMinutes() + i * 15);
                    await AssignmentSubmission.updateOne(
                        { _id: sub._id },
                        { $set: { createdAt } }
                    );
                    created++;
                    usedIndex++;
                }
            }
            console.log(`Done. Created ${created} submission(s) with dates spread over the last 7 days.`);
        }
        console.log('Log in as the student and open Dashboard to see the Weekly Activity graph.');
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
