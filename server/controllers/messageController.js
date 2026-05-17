const Message = require('../models/Message');
const User = require('../models/User');

// HR sends a personalized message/complaint/warning to a Manager
const sendMessage = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only HR Admin can send corporate alerts' });
    }

    const { receiverId, subject, content, type } = req.body;

    const manager = await User.findOne({ _id: receiverId, role: 'Manager' });
    if (!manager) {
      return res.status(400).json({ message: 'Recipient must be a registered manager' });
    }

    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      subject,
      content,
      type
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manager gets their personalized inbox from HR
const getMyInbox = async (req, res) => {
  try {
    const messages = await Message.find({ receiverId: req.user._id })
      .populate('senderId', 'name email employeeId role')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// HR gets historical sent messages log
const getSentMessages = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only HR Admin can access historical logs' });
    }

    const messages = await Message.find({ senderId: req.user._id })
      .populate('receiverId', 'name email employeeId role department')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMyInbox,
  getSentMessages
};
