const mongoose = require('mongoose');

const mcqQuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
    marks: { type: Number, required: true, default: 1 },
}, { _id: true });

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add an assignment title'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        type: {
            type: String,
            enum: ['mcq', 'programming'],
            default: 'programming',
        },
        course: {
            type: mongoose.Schema.ObjectId,
            ref: 'Course',
            required: true,
        },
        instructor: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        dueDate: {
            type: Date,
            required: [true, 'Please add a due date'],
        },
        totalMarks: {
            type: Number,
            required: [true, 'Please add total marks for this assignment'],
            default: 100,
        },
        // For MCQ assignments: array of questions (same shape as exam)
        questions: [mcqQuestionSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
