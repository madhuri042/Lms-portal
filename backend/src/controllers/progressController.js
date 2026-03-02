const Progress = require('../models/Progress');

// @desc    Get user's progress in a specific course
// @route   GET /api/courses/:courseId/progress
// @access  Private
exports.getCourseProgress = async (req, res) => {
    try {
        let progress = await Progress.findOne({
            student: req.user.id,
            course: req.params.courseId,
        }).populate('assignmentsCompleted.assignmentId', 'title totalMarks')
            .populate('examsCompleted.examId', 'title totalMarks');

        if (!progress) {
            // If student hasn't engaged yet but is enrolled, they have 0% progress
            progress = await Progress.create({
                student: req.user.id,
                course: req.params.courseId,
            });
        }

        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update video watched
// @route   POST /api/courses/:courseId/progress/video
// @access  Private (Student)
exports.markVideoWatched = async (req, res) => {
    try {
        const { videoId } = req.body;

        let progress = await Progress.findOne({
            student: req.user.id,
            course: req.params.courseId,
        });

        if (!progress) {
            progress = await Progress.create({
                student: req.user.id,
                course: req.params.courseId,
            });
        }

        // Check if already watched
        const alreadyWatched = progress.videosWatched.find(
            (v) => v.videoId.toString() === videoId
        );

        if (!alreadyWatched) {
            progress.videosWatched.push({ videoId });
            // TODO: Logic to update completionPercentage based on total course videos
            await progress.save();
        }

        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
