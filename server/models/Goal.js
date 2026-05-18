const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  thrustArea: { type: String },
  uom: { type: String }, // Unit of Measurement
  target: { type: Number, required: true },
  weightage: { type: Number, required: true, min: 10, max: 100 },
  type: {
    type: String,
    enum: ['Min', 'Max', 'Timeline', 'Zero-Based'],
    required: true
  },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Returned', 'Approved', 'Locked'],
    default: 'Draft'
  },
  submissionText: { type: String },
  submissionFile: { type: String },
  submissionDate: { type: Date },
  isAchieved: { type: Boolean, default: false },
  assignedTeam: { type: String },
  isShared: { type: Boolean, default: false },
  sharedFromId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Pre-save schema validation
goalSchema.pre('save', async function () {
  if (this.isNew) {
    const Goal = mongoose.model('Goal');
    const count = await Goal.countDocuments({ ownerId: this.ownerId });
    if (count >= 8) {
      throw new Error('Maximum number of goals per employee is 8.');
    }
  }
});

module.exports = mongoose.model('Goal', goalSchema);
