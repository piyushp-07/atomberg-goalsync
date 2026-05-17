const express = require('express');
const router = express.Router();
const { 
  getGoals, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  submitGoals,
  submitGoalResponse,
  verifyGoal,
  lockTeamGoal,
  reviewEmployeeSheet,
  shareGoal
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitGoals);
router.post('/review-sheet', protect, reviewEmployeeSheet);
router.post('/share', protect, shareGoal);
router.put('/:id/submit', protect, submitGoalResponse);
router.put('/:id/verify', protect, verifyGoal);
router.put('/team-lock', protect, lockTeamGoal);

router.route('/').get(protect, getGoals).post(protect, createGoal);
router.route('/:id').put(protect, updateGoal).delete(protect, deleteGoal);

module.exports = router;
