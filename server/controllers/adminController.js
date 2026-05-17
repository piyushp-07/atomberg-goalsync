const Goal = require('../models/Goal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const CheckIn = require('../models/CheckIn');

const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const goals = await Goal.find();

    const totalGoals = goals.length;
    const approvedGoals = goals.filter(g => g.status === 'Approved' || g.status === 'Locked').length;
    const draftedGoals = goals.filter(g => g.status === 'Draft').length;
    
    const statusDistribution = [
      { name: 'Draft', value: draftedGoals },
      { name: 'Submitted', value: goals.filter(g => g.status === 'Submitted').length },
      { name: 'Approved', value: approvedGoals },
      { name: 'Returned', value: goals.filter(g => g.status === 'Returned').length }
    ].filter(d => d.value > 0);

    res.json({
      totalUsers,
      totalGoals,
      approvedGoals,
      statusDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate({
        path: 'goalId',
        select: 'title ownerId',
        populate: { path: 'ownerId', select: 'name employeeId department' }
      })
      .populate('changedBy', 'name email employeeId role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unlockEmployeeSheet = async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    if (!employeeId || !reason) {
      return res.status(400).json({ message: 'Employee ID and unlock reason are required.' });
    }

    const goals = await Goal.find({ ownerId: employeeId, status: { $in: ['Approved', 'Locked'] } });
    if (goals.length === 0) {
      return res.status(400).json({ message: 'No locked/approved goals found for this employee to unlock.' });
    }

    // Lock Override Audit Trail Logging
    for (const goal of goals) {
      await AuditLog.create({
        goalId: goal._id,
        changedBy: req.user._id,
        fieldChanged: 'status',
        oldValue: goal.status,
        newValue: 'Draft',
        reason: reason
      });
    }

    await Goal.updateMany(
      { ownerId: employeeId, status: { $in: ['Approved', 'Locked'] } },
      { $set: { status: 'Draft', isAchieved: false } }
    );

    res.json({ message: 'Employee Goal Sheet successfully unlocked and reverted to Draft.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, employeeId, password, role, department, managerId } = req.body;

    if (!name || !email || !employeeId || !password) {
      return res.status(400).json({ message: 'Name, email, employeeId, and password are required.' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const empIdExists = await User.findOne({ employeeId });
    if (empIdExists) {
      return res.status(400).json({ message: 'Employee ID already registered.' });
    }

    const user = await User.create({
      name,
      email,
      employeeId,
      password,
      role: role || 'Employee',
      department,
      managerId: managerId || undefined
    });

    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, employeeId, role, department, managerId, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use.' });
      }
      user.email = email;
    }

    if (employeeId && employeeId !== user.employeeId) {
      const empIdExists = await User.findOne({ employeeId });
      if (empIdExists) {
        return res.status(400).json({ message: 'Employee ID already in use.' });
      }
      user.employeeId = employeeId;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (managerId !== undefined) user.managerId = managerId || null;

    if (password) {
      user.password = password;
    }

    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const directReports = await User.find({ managerId: user._id });
    if (directReports.length > 0) {
      await User.updateMany({ managerId: user._id }, { $set: { managerId: null } });
    }

    await Goal.deleteMany({ ownerId: user._id });
    await CheckIn.deleteMany({ ownerId: user._id });

    await user.deleteOne();
    res.json({ message: 'User and all associated goals/check-ins removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const NotificationLog = require('../models/NotificationLog');

const getNotificationLogs = async (req, res) => {
  try {
    const logs = await NotificationLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getSystemAnalytics, 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getAuditLogs, 
  unlockEmployeeSheet,
  getNotificationLogs
};
