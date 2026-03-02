const mongoose = require('mongoose');

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
    },
    { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
