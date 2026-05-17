const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: false },
  hrResponsibility: { type: String, required: false },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quarter: { 
    type: String, 
    enum: ['Q1', 'Q2', 'Q3', 'Q4'], 
    required: true 
  },
  plannedTarget: { type: Number, required: false },
  actualAchievement: { type: Number, required: false },
  status: {
    type: String,
    enum: ['Not Started', 'On Track', 'Completed'],
    default: 'Not Started'
  },
  employeeComments: { type: String },
  managerComments: { type: String },
  score: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
