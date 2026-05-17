const Goal = require('../models/Goal');
const User = require('../models/User');

const getTeamGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ managerId: req.user._id }).populate('ownerId', 'name email');
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewGoal = async (req, res) => {
  try {
    const { status, comments, weightage, target } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.managerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    goal.status = status;
    if (weightage) goal.weightage = weightage;
    if (target) goal.target = target;

    const updatedGoal = await goal.save();
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDirectReports = async (req, res) => {
  try {
    const reports = await User.find({ managerId: req.user._id, role: 'Employee' });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTeamGoals, reviewGoal, getDirectReports };
