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
            required: [true, 'Please upload a submission file'],
        },
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
