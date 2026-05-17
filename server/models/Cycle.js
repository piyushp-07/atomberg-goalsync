const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema({
  activeCycle: { 
    type: String, 
    enum: ['Goal Setting', 'Q1', 'Q2', 'Q3', 'Q4'], 
    default: 'Goal Setting' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Cycle', cycleSchema);
