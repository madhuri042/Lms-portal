const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.ObjectId,
            ref: 'Course',
            required: true,
        },
        videosWatched: [
            {
                videoId: {
                    type: mongoose.Schema.ObjectId,
                },
            },
        ],
        assignmentsCompleted: [
            {
                assignmentId: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'Assignment',
                },
                marks: Number,
            },
        ],
        examsCompleted: [
            {
                examId: {
                    type: mongoose.Schema.ObjectId,
                    ref: 'OnlineExam',
                },
                marks: Number,
            },
        ],
        completionPercentage: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
