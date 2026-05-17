const Cycle = require('../models/Cycle');

const getCycle = async (req, res) => {
  try {
    let cycle = await Cycle.findOne();
    if (!cycle) {
      cycle = await Cycle.create({ activeCycle: 'Goal Setting' });
    }
    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCycle = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only HR Admins can override organizational cycles.' });
    }
    const { activeCycle } = req.body;
    let cycle = await Cycle.findOne();
    if (!cycle) {
      cycle = await Cycle.create({ activeCycle });
    } else {
      cycle.activeCycle = activeCycle;
      await cycle.save();
    }
    res.json(cycle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getCycle, updateCycle };
