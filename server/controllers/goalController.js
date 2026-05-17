const Goal = require('../models/Goal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../utils/notifier');

// Fetch goals based on role scopes
const getGoals = async (req, res) => {
  try {
    let query = {};
    const { owner } = req.query;

    if (owner === 'self') {
      query = { ownerId: req.user._id };
    } else {
      if (req.user.role === 'Employee') {
        query = { ownerId: req.user._id };
      } else if (req.user.role === 'Manager') {
        // Manager can see their own goals AND goals they manage for direct reports
        query = { $or: [{ ownerId: req.user._id }, { managerId: req.user._id }] };
      } else if (req.user.role === 'Admin') {
        // HR sees all system goals
        query = {};
      }
    }

    const goals = await Goal.find(query)
      .populate('ownerId', 'name email employeeId department role')
      .populate('managerId', 'name email employeeId role')
      .sort({ createdAt: -1 });

    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Goal creation supporting Employee draft sheets and Manager team delegation
const createGoal = async (req, res) => {
  try {
    // If user is Employee (or Manager/Admin creating goal for self): Create draft goal for self
    if (req.user.role === 'Employee' || (!req.body.assignedTo && !req.body.assignedTeam)) {
      const { title, description, thrustArea, uom, target, weightage, type, deadline } = req.body;

      const activeGoalsCount = await Goal.countDocuments({ ownerId: req.user._id });
      if (activeGoalsCount >= 8) {
        return res.status(400).json({ message: 'Maximum number of goals per employee is 8.' });
      }

      if (Number(weightage) < 10) {
        return res.status(400).json({ message: 'Minimum weightage per individual goal is 10%.' });
      }

      const newGoal = await Goal.create({
        title,
        description,
        thrustArea,
        uom,
        target,
        weightage,
        type,
        deadline,
        status: 'Draft',
        ownerId: req.user._id,
        managerId: req.user.managerId || null,
        assignedTeam: req.user.department
      });

      return res.status(201).json(newGoal);
    }

    // Manager / Admin assignment flow
    const { title, description, thrustArea, uom, target, weightage, type, deadline, assignedTo, assignedTeam } = req.body;

    let targetUsers = [];

    if (assignedTeam) {
      // Assign to all employees in the selected department/team WHO report to this manager
      targetUsers = await User.find({ department: assignedTeam, role: 'Employee', managerId: req.user._id });
    } else if (assignedTo) {
      // Assign to a specific employee WHO reports to this manager
      const user = await User.findOne({ _id: assignedTo, managerId: req.user._id });
      if (user) targetUsers.push(user);
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ message: 'No valid employees found under your management in the selected department.' });
    }

    const createdGoals = [];

    // Create goal instances
    for (const user of targetUsers) {
      const activeGoalsCount = await Goal.countDocuments({ ownerId: user._id });
      if (activeGoalsCount >= 8) {
        continue; // Skip if employee already has maximum goals
      }

      const newGoal = await Goal.create({
        title,
        description,
        thrustArea,
        uom,
        target,
        weightage,
        type,
        deadline,
        status: 'Draft', // Created as Draft so employee can adjust weightage and submit
        isShared: true,
        ownerId: user._id,
        managerId: req.user._id,
        assignedTeam: assignedTeam || user.department
      });
      createdGoals.push(newGoal);
    }

    res.status(201).json(createdGoals[0] || { message: 'Goals setting processed successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Goal parameters with Admin lock-override audit logs
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Authorizations
    if (goal.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(401).json({ message: 'Not authorized to update this goal' });
    }

    // Lock rule: approved/locked goals cannot be edited by employees or managers without Admin unlock/override
    if ((goal.status === 'Approved' || goal.status === 'Locked') && req.user.role !== 'Admin') {
      return res.status(400).json({ message: 'Approved or Locked goals cannot be edited without Admin intervention.' });
    }

    // Validation rules
    if (req.body.weightage && Number(req.body.weightage) < 10) {
      return res.status(400).json({ message: 'Minimum weightage per individual goal is 10%.' });
    }

    // If Admin overrides/edits a locked goal: Log to AuditTrail
    if ((goal.status === 'Approved' || goal.status === 'Locked') && req.user.role === 'Admin') {
      const fields = ['title', 'target', 'weightage', 'thrustArea'];
      for (const field of fields) {
        if (req.body[field] !== undefined && req.body[field] !== goal[field]) {
          await AuditLog.create({
            goalId: goal._id,
            changedBy: req.user._id,
            fieldChanged: field,
            oldValue: goal[field],
            newValue: req.body[field],
            reason: req.body.reason || 'HR Admin override adjustment'
          });
        }
      }
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete goal instance
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(401).json({ message: 'Not authorized to delete this goal' });
    }

    if ((goal.status === 'Approved' || goal.status === 'Locked') && req.user.role !== 'Admin') {
      return res.status(400).json({ message: 'Approved or Locked goals cannot be deleted without Admin intervention.' });
    }

    await goal.deleteOne();
    res.json({ message: 'Goal removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee response submission (With file proof)
const submitGoalResponse = async (req, res) => {
  try {
    const { submissionText, submissionFile } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the goal owner can submit a completion response' });
    }

    goal.status = 'Submitted';
    goal.submissionText = submissionText;
    goal.submissionFile = submissionFile || 'proof_document.pdf';
    goal.submissionDate = new Date();

    const savedGoal = await goal.save();
    res.json(savedGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager tick verification
const verifyGoal = async (req, res) => {
  try {
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only managers can verify goal completion' });
    }

    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.status = 'Approved';
    goal.isAchieved = true;

    const savedGoal = await goal.save();
    res.json(savedGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager completing/locking entire team goal
const lockTeamGoal = async (req, res) => {
  try {
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only managers can complete and lock team goals' });
    }

    const { title, assignedTeam } = req.body;

    await Goal.updateMany(
      { title, assignedTeam, managerId: req.user._id },
      { $set: { status: 'Locked' } }
    );

    res.json({ message: 'Team goal successfully completed and closed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Employee bulk goal sheet submission validation
const submitGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ ownerId: req.user._id });
    
    const draftGoals = goals.filter(g => g.status === 'Draft' || g.status === 'Returned');
    if (draftGoals.length === 0) {
      return res.status(400).json({ message: 'No draft or returned goals to submit.' });
    }

    if (goals.length > 8) {
      return res.status(400).json({ message: 'Maximum number of goals per employee is 8.' });
    }

    const totalWeightage = goals.reduce((acc, goal) => acc + goal.weightage, 0);
    if (totalWeightage !== 100) {
      return res.status(400).json({ message: `Total weightage across all goals must equal exactly 100% (currently ${totalWeightage}%).` });
    }

    const hasLowWeightage = goals.some(goal => goal.weightage < 10);
    if (hasLowWeightage) {
      return res.status(400).json({ message: 'Minimum weightage per individual goal is 10%.' });
    }

    await Goal.updateMany(
      { ownerId: req.user._id, status: { $in: ['Draft', 'Returned'] } },
      { $set: { status: 'Submitted' } }
    );

    // Trigger automated simulated notifications to manager
    if (req.user.managerId) {
      const manager = await User.findById(req.user.managerId);
      if (manager) {
        // Email Notification
        await sendNotification({
          recipientEmail: manager.email,
          recipientName: manager.name,
          type: 'Email',
          event: 'Goal Submission',
          subject: `Action Required: Goal Sheet Submitted by ${req.user.name}`,
          content: `Hello ${manager.name},\n\nYour direct report, ${req.user.name} (${req.user.employeeId}), has submitted their goal sheet containing ${goals.length} goals for approval.\n\nPlease log into the Atomberg Goal Tracker to review, inline-edit, or return their sheet for rework.\n\nBest regards,\nAtomberg HR System`
        });

        // Teams Notification
        await sendNotification({
          recipientEmail: manager.email,
          recipientName: manager.name,
          type: 'Teams',
          event: 'Goal Submission',
          subject: `Goal Sheet Submission Notification`,
          content: `📢 **Goal Sheet Submitted**\n\n**Employee**: ${req.user.name} (${req.user.employeeId})\n**Total Goals**: ${goals.length}\n\n[Click here to review inline and take action](http://localhost:5173/manager/team-goals)`
        });
      }
    }

    res.json({ message: 'Goals sheet submitted successfully to manager' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager bulk Goal Sheet review actions: Approve Sheet or Return for Rework
const reviewEmployeeSheet = async (req, res) => {
  try {
    const { employeeId, action } = req.body; // action: 'Approve' or 'Rework'
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only managers and HR Admins can review goal sheets' });
    }

    const goals = await Goal.find({ ownerId: employeeId, status: 'Submitted' });
    if (goals.length === 0) {
      return res.status(400).json({ message: 'No submitted goals found for this employee.' });
    }

    const newStatus = action === 'Approve' ? 'Approved' : 'Returned';
    await Goal.updateMany(
      { ownerId: employeeId, status: 'Submitted' },
      { $set: { status: newStatus } }
    );

    // Trigger automated notification to employee
    const employee = await User.findById(employeeId);
    if (employee) {
      const isApproved = action === 'Approve';
      await sendNotification({
        recipientEmail: employee.email,
        recipientName: employee.name,
        type: 'Email',
        event: isApproved ? 'Goal Approval' : 'Goal Rework',
        subject: isApproved ? `Congratulations: Your Goal Sheet is Approved!` : `Action Required: Your Goal Sheet was Returned for Rework`,
        content: isApproved
          ? `Hello ${employee.name},\n\nYour manager, ${req.user.name}, has APPROVED your quarterly goal sheet. Your goals are now locked. You can view them and start logging progress updates in your dashboard.\n\nBest regards,\nAtomberg HR System`
          : `Hello ${employee.name},\n\nYour manager, ${req.user.name}, has returned your goal sheet for rework. Please log in, review their comments, adjust the targets/weightages accordingly, and re-submit your sheet.\n\nBest regards,\nAtomberg HR System`
      });

      // Teams Notification
      await sendNotification({
        recipientEmail: employee.email,
        recipientName: employee.name,
        type: 'Teams',
        event: isApproved ? 'Goal Approval' : 'Goal Rework',
        subject: `Goal Sheet Review Status`,
        content: isApproved
          ? `✅ **Goal Sheet Approved!**\n\nYour manager ${req.user.name} has approved and locked your goal sheet.\n\n[Go to Dashboard](http://localhost:5173/employee)`
          : `⚠️ **Goal Sheet Returned for Rework**\n\nYour manager ${req.user.name} requested changes on your sheet.\n\n[Review & Resubmit Goals](http://localhost:5173/employee/goals)`
      });
    }

    res.json({ message: `Employee goal sheet successfully ${action === 'Approve' ? 'approved' : 'returned for rework'}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin or Manager pushing departmental KPI to multiple employees as a Shared Goal
const shareGoal = async (req, res) => {
  try {
    const { title, description, thrustArea, uom, type, target, weightage, primaryOwnerId, recipientIds } = req.body;

    if (!title || !target || !type || !primaryOwnerId || !recipientIds || recipientIds.length === 0) {
      return res.status(400).json({ message: 'Missing required parameters for shared goals.' });
    }

    // 1. Create the primary/master Goal
    const primaryGoal = await Goal.create({
      title,
      description,
      thrustArea,
      uom,
      type,
      target,
      weightage,
      isShared: true,
      ownerId: primaryOwnerId,
      status: 'Approved' // Shared goals start as approved
    });

    // 2. Propagate linked targets to each recipient employee
    const createdGoals = [primaryGoal];
    for (const recipientId of recipientIds) {
      const linkedGoal = await Goal.create({
        title,
        description,
        thrustArea,
        uom,
        type,
        target,
        weightage,
        isShared: true,
        sharedFromId: primaryGoal._id,
        ownerId: recipientId,
        status: 'Draft' // Recipients start as draft to adjust their weightage
      });
      createdGoals.push(linkedGoal);
    }

    res.status(201).json({ 
      message: `Successfully propagated Shared Departmental KPI to primary owner and ${recipientIds.length} recipient employees!`,
      goals: createdGoals 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
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
};
