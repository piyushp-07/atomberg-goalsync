const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { calculateScore } = require('../utils/scoring');
const { sendNotification } = require('../utils/notifier');

const createCheckIn = async (req, res) => {
  try {
    const { goalId, hrResponsibility, quarter, plannedTarget, actualAchievement, employeeComments, status } = req.body;

    let score = 0;

    if (hrResponsibility || req.user.role === 'Admin') {
      // HR responsibility check-in: non-technical, simple status-based scoring
      if (status === 'Completed') {
        score = 100;
      } else if (status === 'On Track') {
        score = 80;
      } else {
        score = 0;
      }

      const checkIn = await CheckIn.create({
        hrResponsibility: hrResponsibility || 'General HR Responsibilities',
        ownerId: req.user._id,
        quarter,
        status: status || 'Not Started',
        employeeComments,
        score
      });

      return res.status(201).json(checkIn);
    }

    // Normal technical goal check-in
    const goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.ownerId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    score = calculateScore(goal.type, Number(plannedTarget), Number(actualAchievement));

    const checkIn = await CheckIn.create({
      goalId,
      ownerId: req.user._id,
      quarter,
      plannedTarget,
      actualAchievement,
      status: status || 'Not Started',
      employeeComments,
      score
    });

    // Real-time achievement sync for shared goals from primary owner to linked targets
    if (goal.isShared && !goal.sharedFromId) {
      const linkedGoals = await Goal.find({ sharedFromId: goal._id });
      for (const linkedG of linkedGoals) {
        const linkedScore = calculateScore(linkedG.type, Number(plannedTarget), Number(actualAchievement));
        let linkedCheckIn = await CheckIn.findOne({ goalId: linkedG._id, quarter });
        
        if (linkedCheckIn) {
          linkedCheckIn.plannedTarget = Number(plannedTarget);
          linkedCheckIn.actualAchievement = Number(actualAchievement);
          linkedCheckIn.status = status;
          linkedCheckIn.score = linkedScore;
          await linkedCheckIn.save();
        } else {
          await CheckIn.create({
            goalId: linkedG._id,
            ownerId: linkedG.ownerId,
            quarter,
            plannedTarget: Number(plannedTarget),
            actualAchievement: Number(actualAchievement),
            status: status || 'Not Started',
            employeeComments: `[Automatic Shared Sync from Primary Owner ${req.user.name}]`,
            score: linkedScore
          });
        }
      }
    }

    // Trigger automated simulated progress alerts to manager
    if (req.user.managerId) {
      const manager = await User.findById(req.user.managerId);
      if (manager) {
        await sendNotification({
          recipientEmail: manager.email,
          recipientName: manager.name,
          type: 'Email',
          event: 'Progress Update',
          subject: `Alert: Q${quarter} Progress Check-in by ${req.user.name}`,
          content: `Hello ${manager.name},\n\nYour direct report, ${req.user.name} (${req.user.employeeId}), has logged a new Q${quarter} check-in for their goal "${goal.title}".\n\n- Status: ${status || 'Not Started'}\n- Planned Target: ${plannedTarget} ${goal.uom}\n- Actual Achievement: ${actualAchievement} ${goal.uom}\n- Calculated Score: ${score.toFixed(1)}%\n- Comments: "${employeeComments || 'None'}"\n\nPlease log in to review their progress.\n\nBest regards,\nAtomberg HR System`
        });
      }
    }

    res.status(201).json(checkIn);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getCheckIns = async (req, res) => {
  try {
    const { scope } = req.query;
    let query = {};

    if (scope === 'team') {
      if (req.user.role === 'Manager') {
        const reports = await User.find({ managerId: req.user._id });
        const reportIds = reports.map(r => r._id);
        
        const managedGoals = await Goal.find({ managerId: req.user._id });
        const managedGoalIds = managedGoals.map(g => g._id);

        query = { 
          $or: [
            { ownerId: { $in: reportIds } },
            { goalId: { $in: managedGoalIds } }
          ]
        };
      } else if (req.user.role === 'Admin') {
        query = {}; // Admin sees all
      } else {
        return res.status(403).json({ message: 'Employees are not authorized to view team check-ins.' });
      }
    } else {
      // Default scope: 'self'
      query = { ownerId: req.user._id };
    }

    const checkIns = await CheckIn.find(query)
      .populate('goalId', 'title type target uom')
      .populate('ownerId', 'name email employeeId department role')
      .sort({ createdAt: -1 });

    res.json(checkIns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addManagerComment = async (req, res) => {
  try {
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only managers and HR Admins can post comments.' });
    }

    const checkIn = await CheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found.' });
    }

    checkIn.managerComments = req.body.managerComments;
    const saved = await checkIn.save();

    // Trigger feedback notification to employee
    const employee = await User.findById(checkIn.ownerId);
    if (employee) {
      await sendNotification({
        recipientEmail: employee.email,
        recipientName: employee.name,
        type: 'Email',
        event: 'Progress Update',
        subject: `Feedback Remarks Logged on your Q${checkIn.quarter} Check-in`,
        content: `Hello ${employee.name},\n\nYour manager, ${req.user.name}, has logged review feedback remarks on your Q${checkIn.quarter} check-in:\n\n"${req.body.managerComments}"\n\nBest regards,\nAtomberg HR System`
      });
    }

    res.json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createCheckIn, getCheckIns, addManagerComment };
