const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Course = require('./src/models/Course');
const connectDB = require('./src/config/db');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedDetails = async () => {
    try {
        await connectDB();

        const courses = await Course.find();
        console.log(`Found ${courses.length} courses to update.`);

        for (const course of courses) {
            course.objectives = [
                `Master the fundamentals of ${course.category || 'this subject'}.`,
                "Build real-world projects to apply your knowledge.",
                "Learn industry best practices and advanced techniques."
            ];

            course.outcomes = [
                "Ability to build complex applications from scratch.",
                "Deep understanding of core concepts and principles.",
                "Certificate of completion to showcase your skills."
            ];

            course.syllabus = [
                {
                    moduleTitle: "Introduction & Setup",
                    lessons: ["Course Overview", "Setting up the Environment", "Hello World!"]
                },
                {
                    moduleTitle: "Core Concepts",
                    lessons: ["Variables and Data Types", "Control Structures", "Functions and Scope"]
                },
                {
                    moduleTitle: "Advanced Topics",
                    lessons: ["Asynchronous Programming", "Working with APIs", "Testing and Debugging"]
                },
                {
                    moduleTitle: "Final Project",
                    lessons: ["Project Planning", "Implementation", "Deployment"]
                }
            ];

            await course.save();
            console.log(`Updated course: ${course.title}`);
        }

        console.log('Seeding completed successfully.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDetails();
