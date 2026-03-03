const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema(
    {
        assignment: {
            type: mongoose.Schema.ObjectId,
            ref: 'Assignment',
            required: true,
        },
        student: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        fileUrl: {
            type: String,
            required: false, // Not required for MCQ (answers stored in answers array)
        },
        // For MCQ: [{ questionId, answerGiven }]; marksObtained set on submit
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            answerGiven: String,
        }],
        status: {
            type: String,
            enum: ['Submitted', 'Evaluated', 'Pending'],
            default: 'Submitted',
        },
        marksObtained: {
            type: Number,
        },
        feedback: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
