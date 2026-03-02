const express = require('express');

const {
    getCourseProgress,
    markVideoWatched,
} = require('../controllers/progressController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(protect, getCourseProgress);

router
    .route('/video')
    .post(protect, authorizeRoles('student'), markVideoWatched);

module.exports = router;
