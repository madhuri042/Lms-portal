const CourseRecommendation = require('../models/CourseRecommendation');
const Course = require('../models/Course');

const RECOMMENDED_TARGET = 30;

// @desc    Get recommended courses (for students / public). Returns up to 30: curated list first, then filled from catalog.
// @route   GET /api/recommended-courses
// @access  Public
exports.getRecommendedCourses = async (req, res) => {
    try {
        const recs = await CourseRecommendation.find()
            .sort({ sortOrder: 1 })
            .populate({
                path: 'course',
                select: 'title description coverImage category instructor',
                populate: { path: 'instructor', select: 'firstName lastName' },
            })
            .lean();

        let courses = recs
            .map((r) => r.course)
            .filter(Boolean);

        if (courses.length < RECOMMENDED_TARGET) {
            const haveIds = courses.map((c) => c._id);
            const extra = await Course.find({ _id: { $nin: haveIds } })
                .select('title description coverImage category instructor')
                .populate({ path: 'instructor', select: 'firstName lastName' })
                .limit(RECOMMENDED_TARGET - courses.length)
                .lean();
            courses = courses.concat(extra);
        }

        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Set recommended courses (replace list; admin only)
// @route   PUT /api/recommended-courses
// @access  Private (Admin)
exports.setRecommendedCourses = async (req, res) => {
    try {
        const { courseIds } = req.body;
        if (!Array.isArray(courseIds)) {
            return res.status(400).json({ success: false, message: 'courseIds must be an array' });
        }

        await CourseRecommendation.deleteMany({});

        const docs = courseIds.slice(0, 30).map((courseId, index) => ({
            course: courseId,
            sortOrder: index,
        }));

        if (docs.length > 0) {
            await CourseRecommendation.insertMany(docs);
        }

        const recs = await CourseRecommendation.find()
            .sort({ sortOrder: 1 })
            .populate({
                path: 'course',
                select: 'title description coverImage category instructor',
                populate: { path: 'instructor', select: 'firstName lastName' },
            })
            .lean();

        const courses = recs.map((r) => r.course).filter(Boolean);

        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
