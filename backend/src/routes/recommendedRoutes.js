const express = require('express');
const { getRecommendedCourses, setRecommendedCourses } = require('../controllers/recommendedController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(getRecommendedCourses).put(protect, authorizeRoles('admin'), setRecommendedCourses);

module.exports = router;
