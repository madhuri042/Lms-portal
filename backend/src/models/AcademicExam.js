const mongoose = require('mongoose');

const academicExamSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        universityName: {
            type: String,
            required: [true, 'Please add university name'],
            trim: true,
        },
        examName: {
            type: String,
            required: [true, 'Please add exam name'],
            trim: true,
        },
        examCode: {
            type: String,
            required: [true, 'Please add exam code'],
            trim: true,
        },
        examDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ['upcoming', 'submitted', 'evaluated'],
            default: 'upcoming',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AcademicExam', academicExamSchema);
