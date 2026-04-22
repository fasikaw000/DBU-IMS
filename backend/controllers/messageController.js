import Message from '../models/Message.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { normalizeRole } from '../utils/roles.js';

const ADMIN_ROLES = ['Admin', 'college_admin', 'admin'];
const DEAN_ROLES = ['Dean', 'department_dean', 'dean'];
const ADVISOR_ROLES = ['Advisor', 'advisor'];

const getAllowedContactIds = async (currentUser) => {
  const Internship = (await import('../models/Internship.js')).default;
  const Student = (await import('../models/Student.js')).default;
  const role = normalizeRole(currentUser.role);
  const currentUserId = currentUser._id.toString();
  const currentDept = currentUser.department?.toString();
  const allowedIds = new Set();

  if (role === 'Admin') {
    const staff = await User.find({
      _id: { $ne: currentUserId },
      role: { $in: [...DEAN_ROLES, ...ADVISOR_ROLES] },
      isActive: { $ne: false }
    }).select('_id');
    staff.forEach((u) => allowedIds.add(u._id.toString()));
  } else if (role === 'Dean') {
    const admins = await User.find({
      _id: { $ne: currentUserId },
      isActive: { $ne: false },
      role: { $in: ADMIN_ROLES }
    }).select('_id');
    admins.forEach((u) => allowedIds.add(u._id.toString()));

    if (currentDept) {
      const deanContacts = await User.find({
        _id: { $ne: currentUserId },
        isActive: { $ne: false },
        role: { $in: ADVISOR_ROLES },
        department: currentDept
      }).select('_id');
      deanContacts.forEach((u) => allowedIds.add(u._id.toString()));
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[MessagingContacts][Dean] admins', admins.map((a) => a._id?.toString()));
      console.debug(`[MessagingContacts][Dean] dean=${currentUserId} dept=${currentDept || 'none'} admins=${admins.length} totalAllowed=${allowedIds.size}`);
    }
  } else if (role === 'Advisor') {
    const advisorInternships = await Internship.find({ advisor_id: currentUserId })
      .populate({ path: 'student', select: 'user' })
      .select('student');
    advisorInternships.forEach((i) => {
      const studentUserId = i.student?.user?.toString();
      if (studentUserId) allowedIds.add(studentUserId);
    });

    if (currentDept) {
      const dean = await User.findOne({
        role: { $in: DEAN_ROLES },
        department: currentDept,
        isActive: { $ne: false }
      }).select('_id');
      if (dean?._id) allowedIds.add(dean._id.toString());
    }
  } else if (role === 'Student') {
    const studentProfile = await Student.findOne({ user: currentUserId }).select('_id');
    if (studentProfile?._id) {
      const internship = await Internship.findOne({ student: studentProfile._id, advisor_id: { $ne: null } }).select('advisor_id');
      if (internship?.advisor_id) allowedIds.add(internship.advisor_id.toString());
    }
  }

  allowedIds.delete(currentUserId);
  return allowedIds;
};

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
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender not found' });
    }

    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    if (receiver.isActive === false) {
      return res.status(403).json({ success: false, message: 'Cannot message an inactive account.' });
    }

    const allowedIds = await getAllowedContactIds(sender);
    if (!allowedIds.has(receiverId.toString())) {
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

    const allowedIds = await getAllowedContactIds(user);
    const contacts = await User.find({
      _id: { $in: Array.from(allowedIds) },
      isActive: { $ne: false }
    }).select('name username role profilePhoto department');

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[MessagingContacts] resolved contacts', contacts.map((c) => ({
        id: c._id?.toString(),
        role: c.role,
        username: c.username
      })));
    }

    res.status(200).json({ success: true, count: contacts.length, data: contacts });
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
