const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['assignment_submitted'],
            default: 'assignment_submitted',
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            default: '',
        },
        link: {
            type: String,
            default: '',
        },
        submission: {
            type: mongoose.Schema.ObjectId,
            ref: 'AssignmentSubmission',
        },
        assignment: {
            type: mongoose.Schema.ObjectId,
            ref: 'Assignment',
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
