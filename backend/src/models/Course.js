const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a course title'],
            trim: true,
            maxlength: [100, 'Course title cannot be more than 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
            maxlength: [1000, 'Description cannot be more than 1000 characters'],
        },
        instructor: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
        materials: [
            {
                title: String,
                fileUrl: String,
            },
        ],
        videos: [
            {
                title: String,
                videoUrl: String, // Can be YouTube link, S3, or local upload path
            },
        ],
        enrolledStudents: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
