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
        /** Stored filename under uploads/exam-syllabi/ (not exposed to client) */
        syllabusFileName: {
            type: String,
            default: null,
        },
        syllabusOriginalName: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

academicExamSchema.set('toJSON', {
    transform(_doc, ret) {
        ret.hasSyllabus = Boolean(ret.syllabusFileName);
        delete ret.syllabusFileName;
        delete ret.syllabusOriginalName;
        return ret;
    },
});

module.exports = mongoose.model('AcademicExam', academicExamSchema);
