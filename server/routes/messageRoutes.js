const express = require('express');
const router = express.Router();
const { sendMessage, getMyInbox, getSentMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/inbox', protect, getMyInbox);
router.get('/sent', protect, getSentMessages);

module.exports = router;
