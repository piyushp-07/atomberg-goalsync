const express = require('express');
const router = express.Router();
const { 
  getSystemAnalytics, 
  getAllUsers, 
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs, 
  unlockEmployeeSheet,
  getNotificationLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.get('/analytics', getSystemAnalytics);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/audit-logs', getAuditLogs);
router.post('/unlock-sheet', unlockEmployeeSheet);
router.get('/notifications', getNotificationLogs);

module.exports = router;
