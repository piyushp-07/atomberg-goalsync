const express = require('express');
const router = express.Router();
const { getTeamGoals, reviewGoal, getDirectReports } = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Manager', 'Admin'));

router.get('/goals', getTeamGoals);
router.put('/goals/:id/review', reviewGoal);
router.get('/reports', getDirectReports);

module.exports = router;
