/**
 * Inserts one MCQ assignment with at least 20 questions.
 * Run: node scripts/seedMcqAssignment.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Assignment = require('../src/models/Assignment');
const Course = require('../src/models/Course');
const User = require('../src/models/User');

const MIN_MCQ_QUESTIONS = 20;

const QUESTIONS = [
    { questionText: 'What is the result of typeof null in JavaScript?', options: ['"object"', '"null"', '"undefined"', 'null'], correctAnswer: '"object"', marks: 5 },
    { questionText: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'const', 'both let and const'], correctAnswer: 'both let and const', marks: 5 },
    { questionText: 'What does Array.isArray([]) return?', options: ['false', 'true', 'undefined', 'null'], correctAnswer: 'true', marks: 5 },
    { questionText: 'What is the output of console.log(1 + "2" + 3)?', options: ['6', '"123"', '"15"', '123'], correctAnswer: '"123"', marks: 5 },
    { questionText: 'Which method adds an element to the end of an array?', options: ['push()', 'append()', 'add()', 'insert()'], correctAnswer: 'push()', marks: 5 },
    { questionText: 'What does the === operator check?', options: ['Value only', 'Value and type', 'Type only', 'Reference'], correctAnswer: 'Value and type', marks: 5 },
    { questionText: 'What is a closure in JavaScript?', options: ['A function that returns another function', 'A function that has access to its outer scope', 'A global function', 'An async function'], correctAnswer: 'A function that has access to its outer scope', marks: 5 },
    { questionText: 'What does NaN stand for?', options: ['Not a Number', 'Null and None', 'No Answer', 'Number Alert'], correctAnswer: 'Not a Number', marks: 5 },
    { questionText: 'Which array method returns a new array with filtered elements?', options: ['filter()', 'find()', 'map()', 'reduce()'], correctAnswer: 'filter()', marks: 5 },
    { questionText: 'What is the default return value of a function that has no return statement?', options: ['null', '0', 'undefined', 'void'], correctAnswer: 'undefined', marks: 5 },
    { questionText: 'Which keyword is used to define a constant?', options: ['var', 'let', 'const', 'constant'], correctAnswer: 'const', marks: 5 },
    { questionText: 'What does the spread operator (...) do?', options: ['Combines strings', 'Copies and expands iterables', 'Multiplies numbers', 'Spreads errors'], correctAnswer: 'Copies and expands iterables', marks: 5 },
    { questionText: 'Which method removes the last element from an array?', options: ['pop()', 'shift()', 'remove()', 'delete()'], correctAnswer: 'pop()', marks: 5 },
    { questionText: 'What is the type of typeof undefined?', options: ['undefined', '"undefined"', 'null', 'object'], correctAnswer: '"undefined"', marks: 5 },
    { questionText: 'What does the map() method return?', options: ['A single value', 'A new array', 'The same array', 'undefined'], correctAnswer: 'A new array', marks: 5 },
    { questionText: 'Which symbol is used for strict equality?', options: ['=', '==', '===', '!='], correctAnswer: '===', marks: 5 },
    { questionText: 'What is the purpose of the async keyword?', options: ['To pause execution', 'To define an asynchronous function', 'To wait for a promise', 'To run in background'], correctAnswer: 'To define an asynchronous function', marks: 5 },
    { questionText: 'Which object method returns an array of keys?', options: ['Object.keys()', 'Object.values()', 'Object.entries()', 'Object.getKeys()'], correctAnswer: 'Object.keys()', marks: 5 },
    { questionText: 'What does the this keyword refer to in a method?', options: ['The global object', 'The function itself', 'The object that owns the method', 'The window'], correctAnswer: 'The object that owns the method', marks: 5 },
    { questionText: 'Which method converts a string to an integer?', options: ['parseInt()', 'toInt()', 'integer()', 'Number.parseInt()'], correctAnswer: 'parseInt()', marks: 5 },
];

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const course = await Course.findOne();
    const instructor = await User.findOne({ role: { $in: ['instructor', 'admin'] } }) || await User.findOne();
    if (!course || !instructor) {
        console.error('Need at least one course and one user.');
        process.exit(1);
    }

    const existing = await Assignment.findOne({ type: 'mcq', course: course._id });
    if (existing) {
        console.log('MCQ assignment already exists for this course. Skipping.');
        await mongoose.disconnect();
        return;
    }

    const totalMarks = QUESTIONS.reduce((sum, q) => sum + (q.marks || 1), 0);
    await Assignment.create({
        title: 'JavaScript Basics – MCQ Quiz',
        description: 'Answer the following multiple choice questions on JavaScript fundamentals. Minimum 20 questions.',
        type: 'mcq',
        course: course._id,
        instructor: instructor._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalMarks,
        questions: QUESTIONS,
    });
    console.log(`Inserted MCQ assignment "JavaScript Basics – MCQ Quiz" with ${QUESTIONS.length} questions (${totalMarks} total marks).`);
    await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
