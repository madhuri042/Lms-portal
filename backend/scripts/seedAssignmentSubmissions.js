/**
 * Seed script: creates submitted and evaluated assignment submissions for a student.
 * Run from backend folder: node scripts/seedAssignmentSubmissions.js
 * Ensures some assignments show as "Submitted" and some as "Evaluated" in the Assignments list.
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

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected.');

        // Prefer a student; otherwise use any user (they will see submissions if they use student flow)
        let student = await User.findOne({ role: 'student' });
        if (!student) {
            student = await User.findOne();
        }
        if (!student) {
            console.error('No user found. Register a user first.');
            process.exit(1);
        }

        const assignments = await Assignment.find().limit(15);
        if (assignments.length === 0) {
            console.error('No assignments found. Run seedAssignments.js first.');
            process.exit(1);
        }

        let created = 0;
        let skipped = 0;

        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];
            const existing = await AssignmentSubmission.findOne({
                assignment: assignment._id,
                student: student._id,
            });
            if (existing) {
                skipped++;
                continue;
            }

            // First 3: Evaluated (with marks); next 3: Submitted; rest stay pending
            if (i < 3) {
                await AssignmentSubmission.create({
                    assignment: assignment._id,
                    student: student._id,
                    status: 'Evaluated',
                    marksObtained: [85, 92, 78][i] || 80,
                    feedback: 'Good work.',
                });
                created++;
            } else if (i < 6) {
                await AssignmentSubmission.create({
                    assignment: assignment._id,
                    student: student._id,
                    status: 'Submitted',
                });
                created++;
            }
        }

        console.log(`Done. Created ${created} submission(s), skipped ${skipped} (already exist).`);
        console.log('Log in as the student to see Submitted and Evaluated assignments.');
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
