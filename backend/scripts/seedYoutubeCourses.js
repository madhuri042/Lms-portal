const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const User = require('../src/models/User');
const Assignment = require('../src/models/Assignment');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
}

// 15 high-quality, real YouTube Video IDs from reputable educators
const SAFE_VIDEO_IDS = [
    "ok-plXXHlWw", // HTML & CSS - SuperSimpleDev
    "W6NZfCO5SIk", // JavaScript - Programming with Mosh
    "bMknfKXIFA8", // React - Dave Gray
    "wm5gMKuwSYk", // Next.js - JavaScript Mastery
    "Oe421EPjeBE", // Node.js - freeCodeCamp
    "_uQrJ0TkZlc", // Python - Programming with Mosh
    "7S_tz1z_5bA", // SQL - Programming with Mosh
    "ua-CiDNNj30", // Data Science - freeCodeCamp
    "GwIo3gDZCVQ", // Machine Learning - Edureka
    "FTFaQWPPq9Q", // Figma - AJ&Smart
    "5uD99mG1fks", // UX Design - Google
    "nU-IIXBWlS4", // Digital Marketing - Simplilearn
    "fW8amMCVAJQ", // Business - CEO Entrepreneur
    "LwCRRUa8yTU", // College Algebra - freeCodeCamp
    "QnQe0xW_JY4"  // Biology - Crash Course
];

const COURSES = [
    { title: "HTML & CSS Full Course - Beginner to Pro", description: "Learn HTML5 and CSS3 from scratch with hands-on projects.", category: "Web Development" },
    { title: "JavaScript Tutorial for Beginners", description: "Master the fundamentals of JavaScript in this comprehensive guide.", category: "Web Development" },
    { title: "React JS Full Course 2024", description: "Build modern web applications with React from zero to hero.", category: "Web Development" },
    { title: "Next.js 14 Full Course 2024", description: "Learn App Router, Server Actions, and more in Next.js 14.", category: "Web Development" },
    { title: "Node.js and Express.js - Full Course", description: "Deep dive into backend development with Node.js and Express.", category: "Web Development" },
    { title: "Python for Beginners - Full Course", description: "Start your programming journey with the most popular language.", category: "Programming" },
    { title: "SQL Tutorial for Beginners", description: "Learn how to manage and query databases like a pro.", category: "Programming" },
    { title: "Learn Data Science Tutorial", description: "Introduction to data science foundations and tools.", category: "Data Science" },
    { title: "Machine Learning Full Course", description: "Comprehensive guide to supervised and unsupervised learning.", category: "Data Science" },
    { title: "Figma UI Design Tutorial", description: "Learn the industry-standard tool for UI/UX design.", category: "Design" },
    { title: "Google UX Design Professional Certificate", description: "Foundational principles of user experience design from Google experts.", category: "Design" },
    { title: "Digital Marketing Full Course", description: "Master SEO, SEM, and social media marketing strategies.", category: "Marketing" },
    { title: "How to Start a Business from Scratch", description: "Real-world advice for entrepreneurs starting their first business.", category: "Business" },
    { title: "College Algebra - Full Course", description: "Complete college-level algebra course for students.", category: "Mathematics" },
    { title: "Introduction to Biology", description: "Learn the fundamentals of life and biological systems.", category: "Science" }
];

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        
        const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }).select('_id');
        if (!instructor) {
            console.error('No instructor or admin user found! You must register an instructor first.');
            process.exit(1);
        }

        console.log("Found instructor/admin:", instructor._id);
        console.log("Cleaning up previously seeded courses/assignments...");
        
        // Clear all existing courses and assignments to ensure a fresh start with real data
        await Course.deleteMany({});
        await Assignment.deleteMany({});

        console.log(`Seeding ${COURSES.length} real YouTube-integrated courses and Assignments...`);

        let createdCount = 0;

        for (let i = 0; i < COURSES.length; i++) {
            const c = COURSES[i];
            const safeYtId = SAFE_VIDEO_IDS[i]; // 1:1 mapping

            const courseData = {
                title: c.title,
                description: c.description,
                category: c.category,
                instructor: instructor._id,
                coverImage: `https://img.youtube.com/vi/${safeYtId}/maxresdefault.jpg`,
                status: 'approved',
                enrolledStudents: [],
                videos: [
                    {
                        title: `${c.title} - Video Lecture`,
                        videoUrl: `https://www.youtube.com/watch?v=${safeYtId}`
                    }
                ],
                objectives: ["Understand the fundamentals", "Build hands-on projects", "Master the concepts"],
                outcomes: ["Ready for real-world application", "Solid foundation for advanced topics"],
                syllabus: [
                    {
                        moduleTitle: "Module 1: Video Lecture",
                        lessons: ["Watch the integrated session", "Complete the follow-up assignment"]
                    }
                ]
            };
            
            const savedCourse = await Course.create(courseData);
            
            // 1. Programming Assignment
            const assignmentData = {
                title: `Programming: ${c.title}`,
                description: `Complete the practical exercises for "${c.title}". Implement the core concepts discussed in the video.`,
                type: 'programming',
                course: savedCourse._id,
                instructor: instructor._id,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                totalMarks: 50
            };
            await Assignment.create(assignmentData);

            // 2. MCQ Exercise
            const mcqData = {
                title: `Self-Assessment: ${c.title}`,
                description: `Test your knowledge on "${c.title}" with these fundamental questions.`,
                type: 'mcq',
                course: savedCourse._id,
                instructor: instructor._id,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                totalMarks: 50,
                questions: [
                    { questionText: `What is the primary focus of ${c.category}?`, options: ['Theory', 'Practice', 'Both', 'None'], correctAnswer: 'Both', marks: 10 },
                    { questionText: `Which tool is most commonly used in ${c.title}?`, options: ['Tool A', 'Tool B', 'Tool C', 'Depends'], correctAnswer: 'Depends', marks: 10 },
                    { questionText: `Is ${c.title} suitable for beginners?`, options: ['Yes', 'No', 'Maybe', 'Advanced Only'], correctAnswer: 'Yes', marks: 10 },
                    { questionText: `How many hours of practice are recommended for this module?`, options: ['1 hour', '5 hours', '10 hours', 'Unlimited'], correctAnswer: '10 hours', marks: 10 },
                    { questionText: `Which of these is a key outcome of this course?`, options: ['Knowledge', 'Skills', 'Certification', 'All of the above'], correctAnswer: 'All of the above', marks: 10 }
                ]
            };
            await Assignment.create(mcqData);

            createdCount++;
        }

        console.log(`Successfully created ${createdCount} real original courses and their corresponding Assignments!`);

    } catch (err) {
        console.error("Error seeding courses:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
