const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  type: { type: String, enum: ['Email', 'Teams'], default: 'Email' },
  event: { 
    type: String, 
    enum: ['Goal Submission', 'Goal Approval', 'Goal Rework', 'Check-in Reminder', 'Nearing Deadline', 'Progress Update'],
    required: true 
  },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
