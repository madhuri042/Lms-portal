const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    answerGiven: {
        type: String,
    },
    marksAwarded: {
        type: Number,
        default: 0,
    }
});

const examSubmissionSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.ObjectId,
            ref: 'OnlineExam',
            required: true,
        },
        student: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        answers: [answerSchema],
        totalScore: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['Submitted', 'Evaluated', 'Pending Evaluation'],
            default: 'Submitted',
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('ExamSubmission', examSubmissionSchema);
