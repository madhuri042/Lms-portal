const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const Assignment = require('../src/models/Assignment');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

// Helper to generate a 20-question MCQ based on a topic
function generateMCQ(topic) {
    const questions = [];
    for (let i = 1; i <= 20; i++) {
        questions.push({
            questionText: `Sample knowledge check ${i} regarding ${topic}: Which of the following is correct?`,
            options: [`The first answer`, `The second answer`, `The third answer`, `None of the above`],
            correctAnswer: `The first answer`,
            marks: 5
        });
    }
    return questions;
}

// Helper to create an aligned assignment based on category
function getAssignmentData(course, instructorId) {
    // 50% chance to be MCQ or Programming
    const isMcq = Math.random() > 0.5;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    if (isMcq) {
        return {
            title: `Quiz: ${course.title} Comprehensive Review`,
            description: `Test your knowledge on the core concepts discussed in the "${course.title}" lecture. Please complete all 20 multiple-choice questions to prove mastery.`,
            type: 'mcq',
            course: course._id,
            instructor: instructorId,
            dueDate,
            totalMarks: 100,
            questions: generateMCQ(course.category || "General Concepts")
        };
    } else {
        const actionVerb = course.category === "Web Development" ? "Build and deploy" 
                         : course.category === "Programming" ? "Write a script/program for"
                         : course.category === "Design" ? "Create a wireframe for"
                         : "Analyze and implement a solution for";

        return {
            title: `Project: ${course.title} Practical Implementation`,
            description: `Follow the instructions from the video lecture to ${actionVerb} the topics discussed. Once finished, compress your work into a single ZIP or PDF file and upload it here before the deadline.`,
            type: 'programming',
            course: course._id,
            instructor: instructorId,
            dueDate,
            totalMarks: 100
        };
    }
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log("Fetching students...");
        const students = await User.find({ role: 'student' }).select('_id');
        const studentIds = students.map(s => s._id);

        if (studentIds.length === 0) {
            console.log("Warning: No users with role 'student' found. Assignments will be created, but no one will be enrolled.");
        }

        console.log("Cleaning up previously generated generic assignments...");
        await Assignment.deleteMany({ title: { $regex: /^Assignment:/ } });

        console.log("Fetching recently seeded Youtube courses...");
        // Match recently seeded YouTube cover images
        const courses = await Course.find({ coverImage: { $regex: /maxresdefault\.jpg/ } });
        
        if (courses.length === 0) {
            console.log("No Youtube courses found. Make sure you ran seedYoutubeCourses.js first.");
            process.exit(1);
        }

        let assignmentsCreated = 0;
        let studentsEnrolled = 0;

        for (const c of courses) {
            // Auto-enroll all students
            let enrolledUpdated = false;
            for (const sId of studentIds) {
                if (!c.enrolledStudents.includes(sId)) {
                    c.enrolledStudents.push(sId);
                    enrolledUpdated = true;
                    studentsEnrolled++;
                }
            }
            if (enrolledUpdated) {
                await c.save();
            }

            // Generate an aligned homework assignment
            const assignmentData = getAssignmentData(c, c.instructor);
            await Assignment.create(assignmentData);
            assignmentsCreated++;
        }

        console.log(`Successfully bulk enrolled students ${studentsEnrolled} total times across ${courses.length} courses!`);
        console.log(`Successfully generated ${assignmentsCreated} rich, aligned assignments (mixed MCQ/Programming)!`);

    } catch (error) {
        console.error("Error executing script:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
