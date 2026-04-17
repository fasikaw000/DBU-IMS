import Message from '../models/Message.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// ─────────────────────────────────────────────────────────────
// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
// ─────────────────────────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver and content are required' });
    }

    // Role-based logic can be expanded here to restrict who can message whom 
    // e.g. Student cannot message College Admin.
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // --- Strict Communication Rules ---
    let isAllowed = false;

    if (sender.role === 'college_admin') {
      // Admin: Allowed -> Everyone
      isAllowed = true;
    } else if (sender.role === 'department_dean') {
      // Dept Dean: Allowed -> Students, Advisors, Admin
      if (['student', 'advisor', 'college_admin'].includes(receiver.role)) {
        isAllowed = true;
      }
    } else if (sender.role === 'advisor') {
      // Advisor: Allowed -> Assigned Students, Dept Dean
      if (receiver.role === 'department_dean') {
        isAllowed = true;
      } else if (receiver.role === 'student') {
        // Check if student is assigned to this advisor
        const Internship = (await import('../models/Internship.js')).default;
        const Student = (await import('../models/Student.js')).default;
        const studentProfile = await Student.findOne({ user: receiverId });
        if (studentProfile) {
          const isAssigned = await Internship.findOne({ student: studentProfile._id, advisor: senderId });
          if (isAssigned) isAllowed = true;
        }
      }
    } else if (sender.role === 'student') {
      // Student: Allowed -> Advisor, Dept Dean
      if (receiver.role === 'department_dean') {
        isAllowed = true;
      } else if (receiver.role === 'advisor') {
        // Check if this advisor is assigned to the student
        const Internship = (await import('../models/Internship.js')).default;
        const Student = (await import('../models/Student.js')).default;
        const studentProfile = await Student.findOne({ user: senderId });
        if (studentProfile) {
          const isAssigned = await Internship.findOne({ student: studentProfile._id, advisor: receiverId });
          if (isAssigned) isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'Communication with this user is restricted.' });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get user's messages
// @route   GET /api/messages
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name username role')
      .populate('receiver', 'name username role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Mark a message as read
// @route   PUT /api/messages/:id/read
// @access  Private
// ─────────────────────────────────────────────────────────────
export const markMessageAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.id;

    const message = await Message.findOne({ _id: messageId, receiver: req.user.id });
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};
