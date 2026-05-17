const express = require('express');
const router = express.Router();
const { getCycle, updateCycle } = require('../controllers/cycleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCycle)
  .put(protect, updateCycle);

module.exports = router;
