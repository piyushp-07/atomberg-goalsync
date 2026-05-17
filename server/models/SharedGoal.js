const mongoose = require('mongoose');

const sharedGoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  target: { type: Number, required: true },
  uom: { type: String },
  type: {
    type: String,
    enum: ['Min', 'Max', 'Timeline', 'Zero-Based'],
    required: true
  },
  department: { type: String, required: true },
  primaryOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  actualAchievement: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('SharedGoal', sharedGoalSchema);
