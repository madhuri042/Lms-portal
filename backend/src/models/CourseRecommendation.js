const mongoose = require('mongoose');

const courseRecommendationSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.ObjectId,
            ref: 'Course',
            required: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CourseRecommendation', courseRecommendationSchema);
