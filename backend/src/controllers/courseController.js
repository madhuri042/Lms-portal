const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('instructor', 'name email');
        res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email')
            .populate('enrolledStudents', 'name email');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin, Instructor)
exports.createCourse = async (req, res) => {
    try {
        // Add user to req.body as instructor
        req.body.instructor = req.user.id;

        const course = await Course.create(req.body);

        res.status(201).json({ success: true, data: course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin, Instructor)
exports.updateCourse = async (req, res) => {
    try {
        let course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Make sure user is course instructor or admin
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'User not authorized to update this course' });
        }

        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin, Instructor)
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Make sure user is course instructor or admin
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'User not authorized to delete this course' });
        }

        await course.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
exports.enrollCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if student is already enrolled
        if (course.enrolledStudents.includes(req.user.id)) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        // Add student to the course document
        course.enrolledStudents.push(req.user.id);
        await course.save();

        res.status(200).json({ success: true, message: 'Successfully enrolled in course' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
