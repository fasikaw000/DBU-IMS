import Message from '../models/Message.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { normalizeRole } from '../utils/roles.js';

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

    const senderRole = normalizeRole(sender.role);
    const receiverRole = normalizeRole(receiver.role);

    // --- Strict Communication Rules ---
    let isAllowed = false;

    if (senderRole === 'college_admin') {
      // Admin: Allowed -> Everyone
      isAllowed = true;
    } else if (senderRole === 'department_dean') {
      // Dept Dean: Allowed -> Students, Advisors, Admin
      if (['student', 'advisor', 'college_admin'].includes(receiverRole)) {
        isAllowed = true;
      }
    } else if (senderRole === 'advisor') {
      // Advisor: Allowed -> Assigned Students, Dept Dean
      if (receiverRole === 'department_dean') {
        isAllowed = true;
      } else if (receiverRole === 'student') {
        // Check if student is assigned to this advisor
        const Internship = (await import('../models/Internship.js')).default;
        const Student = (await import('../models/Student.js')).default;
        const studentProfile = await Student.findOne({ user: receiverId });
        if (studentProfile) {
          const isAssigned = await Internship.findOne({ student: studentProfile._id, advisor: senderId });
          if (isAssigned) isAllowed = true;
        }
      }
    } else if (senderRole === 'student') {
      // Student: Allowed -> Advisor, Dept Dean
      if (receiverRole === 'department_dean') {
        isAllowed = true;
      } else if (receiverRole === 'advisor') {
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

    // Generate system notification for the receiver
    await Notification.create({
      user: receiverId,
      type: 'new_message',
      message: `You have a new message from ${sender.name}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      link: '/messages'
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

// ─────────────────────────────────────────────────────────────
// @desc    Get contacts for the current user
// @route   GET /api/messages/contacts
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getContacts = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const user = await User.findById(senderId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const senderRole = normalizeRole(user.role);

    let contacts = [];

    if (senderRole === 'college_admin') {
      // Admin: Allowed -> Everyone
      contacts = await User.find({ _id: { $ne: senderId } }).select('name username role');
    } else if (senderRole === 'department_dean') {
      // Dept Dean: Allowed -> Students, Advisors, Admin
      contacts = await User.find({
        role: { $in: ['student', 'advisor', 'college_admin'] },
        _id: { $ne: senderId }
      }).select('name username role');
    } else if (senderRole === 'advisor') {
      // Advisor: Allowed -> Assigned Students, Dept Dean
      const deans = await User.find({ role: 'department_dean' }).select('name username role');

      const Internship = (await import('../models/Internship.js')).default;
      const Student = (await import('../models/Student.js')).default;

      const assignedInternships = await Internship.find({ advisor: senderId }).populate({
        path: 'student',
        populate: { path: 'user', select: 'name username role' }
      });

      const students = assignedInternships
        .map(i => i.student && i.student.user)
        .filter(u => u != null);

      contacts = [...deans, ...students];
    } else if (senderRole === 'student') {
      // Student: Allowed -> Advisor, Dept Dean
      const deans = await User.find({ role: 'department_dean' }).select('name username role');

      const Internship = (await import('../models/Internship.js')).default;
      const Student = (await import('../models/Student.js')).default;

      const studentProfile = await Student.findOne({ user: senderId });
      if (studentProfile) {
        const assignedInternships = await Internship.find({ student: studentProfile._id }).populate({
          path: 'advisor',
          select: 'name username role'
        });

        const advisors = assignedInternships
          .map(i => i.advisor)
          .filter(u => u != null);

        contacts = [...deans, ...advisors];
      } else {
        contacts = deans;
      }
    }

    // De-duplicate contacts just in case
    const uniqueContacts = Array.from(new Map(contacts.map(c => [c._id.toString(), c])).values());

    res.status(200).json({ success: true, count: uniqueContacts.length, data: uniqueContacts });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get conversation between current user and another user
// @route   GET /api/messages/conversation/:userId
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
      .populate('sender', 'name username role')
      .populate('receiver', 'name username role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};
