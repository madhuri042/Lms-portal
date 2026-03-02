const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['MCQ', 'Descriptive'],
        required: true,
    },
    questionText: {
        type: String,
        required: true,
    },
    options: [
        {
            type: String, // For MCQ
        },
    ],
    correctAnswer: {
        type: String, // Value matches one of the options
    },
    marks: {
        type: Number,
        required: true,
    },
});

const onlineExamSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add an exam title'],
        },
        description: {
            type: String,
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
        questions: [questionSchema],
        durationMinutes: {
            type: Number,
            required: [true, 'Please set the exam duration in minutes'],
        },
        startTime: {
            type: Date,
        },
        endTime: {
            type: Date,
        },
        totalMarks: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

// Pre-save to calculate total marks
onlineExamSchema.pre('save', function (next) {
    if (this.questions && this.questions.length > 0) {
        this.totalMarks = this.questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    }
    next();
});

module.exports = mongoose.model('OnlineExam', onlineExamSchema);
