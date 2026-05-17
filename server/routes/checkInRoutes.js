const express = require('express');
const router = express.Router();
const { createCheckIn, getCheckIns, addManagerComment } = require('../controllers/checkInController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getCheckIns).post(protect, createCheckIn);
router.route('/:id/comment').put(protect, addManagerComment);

module.exports = router;
