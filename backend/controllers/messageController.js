import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { normalizeRole } from '../utils/roles.js';

const DEAN_ROLES = ['Dean', 'department_dean', 'dean'];
const ADVISOR_ROLES = ['Advisor', 'advisor'];

let hasStandardizedAdminRoles = false;
const standardizeAdminRolesOnce = async () => {
  if (hasStandardizedAdminRoles) return;
  try {
    await User.updateMany(
      { role: { $in: ['admin', 'ADMIN', 'college_admin'] } },
      { $set: { role: 'Admin' } }
    );
    hasStandardizedAdminRoles = true;
  } catch (err) {
    console.error("Standardization failed:", err);
  }
};

const getAllowedContactIds = async (currentUser) => {
  await standardizeAdminRolesOnce();
  const role = normalizeRole(currentUser.role);
  const currentUserId = (currentUser._id || currentUser.id).toString();
  const currentDept = currentUser.department?.toString();
  const allowedIds = new Set();

  if (role === 'Admin') {
    const staff = await User.find({
      _id: { $ne: currentUserId },
      role: { $in: ['Dean', 'Advisor', 'Admin'] },
      isActive: { $ne: false }
    }).select('_id');
    staff.forEach((u) => allowedIds.add(u._id.toString()));
  } else if (role === 'Dean') {
    const admins = await User.find({
      _id: { $ne: currentUserId },
      isActive: { $ne: false },
      role: 'Admin'
    }).select('_id');
    admins.forEach((u) => allowedIds.add(u._id.toString()));

    if (currentDept) {
      const advisors = await User.find({
        _id: { $ne: currentUserId },
        isActive: { $ne: false },
        role: 'Advisor',
        department: currentDept
      }).select('_id');
      advisors.forEach((u) => allowedIds.add(u._id.toString()));
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
        role: 'Dean',
        department: currentDept,
        isActive: { $ne: false }
      }).select('_id');
      if (dean?._id) allowedIds.add(dean._id.toString());
    }
  } else if (role === 'Student') {
    const studentProfile = await Student.findOne({ user: currentUserId }).select('_id');
    if (studentProfile?._id) {
      const internship = await Internship.findOne({ 
        student: studentProfile._id, 
        advisor_id: { $ne: null } 
      }).select('advisor_id');
      if (internship?.advisor_id) allowedIds.add(internship.advisor_id.toString());
    }
  }

  allowedIds.delete(currentUserId);
  return allowedIds;
};

// @desc    Send a new message
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content, message: messageText } = req.body;
    const senderId = req.user._id || req.user.id;
    const finalContent = content || messageText;

    if (!receiverId || !finalContent) {
      return res.status(400).json({ success: false, message: 'Receiver and message content are required' });
    }

    const allowedIds = await getAllowedContactIds(req.user);
    if (!allowedIds.has(receiverId.toString())) {
      return res.status(403).json({ success: false, message: 'Communication with this user is restricted.' });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: finalContent
    });

    await Notification.create({
      user: receiverId,
      sender: senderId,
      type: 'new_message',
      message: `You have a new message from ${req.user.name}: "${finalContent.substring(0, 30)}..."`,
      link: `/messages?userId=${senderId}`
    });

    res.status(201).json({ 
      success: true, 
      data: {
        _id: message._id,
        senderId: message.sender,
        receiverId: message.receiver,
        message: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt
      } 
    });
  } catch (error) { next(error); }
};

// @desc    Get user's messages
export const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    const mapped = messages.map(m => ({
      _id: m._id,
      senderId: m.sender,
      receiverId: m.receiver,
      message: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) { next(error); }
};

// @desc    Mark a message as read
export const markMessageAsRead = async (req, res, next) => {
  try {
    const message = await Message.findOne({ _id: req.params.id, receiver: req.user._id || req.user.id });
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    message.isRead = true;
    await message.save();
    res.status(200).json({ success: true, data: message });
  } catch (error) { next(error); }
};

// @desc    Get contacts for the current user
export const getContacts = async (req, res, next) => {
  try {
    const senderId = req.user._id || req.user.id;
    if (!senderId) return res.status(401).json({ success: false, message: 'Not authorized' });

    const allowedIds = await getAllowedContactIds(req.user);
    const contactObjectIds = Array.from(allowedIds).map(id => new mongoose.Types.ObjectId(id));

    const contacts = await User.find({
      _id: { $in: contactObjectIds },
      isActive: { $ne: false }
    }).select('name username role profilePhoto department').lean();

    const unreadCounts = await Message.aggregate([
      { $match: { receiver: new mongoose.Types.ObjectId(senderId), isRead: false, sender: { $in: contactObjectIds } } },
      { $group: { _id: '$sender', count: { $sum: 1 } } }
    ]);

    const lastMessages = await Message.aggregate([
      { $match: { $or: [{ sender: new mongoose.Types.ObjectId(senderId), receiver: { $in: contactObjectIds } }, { receiver: new mongoose.Types.ObjectId(senderId), sender: { $in: contactObjectIds } }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { $cond: [{ $eq: ['$sender', new mongoose.Types.ObjectId(senderId)] }, '$receiver', '$sender'] }, lastMessage: { $first: '$$ROOT' } } }
    ]);

    const unreadMap = unreadCounts.reduce((acc, curr) => { acc[curr._id.toString()] = curr.count; return acc; }, {});
    const lastMsgMap = lastMessages.reduce((acc, curr) => { acc[curr._id.toString()] = curr.lastMessage; return acc; }, {});

    const contactsWithDetails = contacts.map((contact) => {
      const contactId = contact._id.toString();
      const lastMsg = lastMsgMap[contactId];
      return {
        ...contact,
        lastMessage: lastMsg ? {
          message: lastMsg.content,
          createdAt: lastMsg.createdAt,
          isRead: lastMsg.isRead,
          senderId: lastMsg.sender,
          receiverId: lastMsg.receiver
        } : null,
        unreadCount: unreadMap[contactId] || 0
      };
    });

    contactsWithDetails.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({ success: true, count: contactsWithDetails.length, data: contactsWithDetails });
  } catch (error) { next(error); }
};

// @desc    Get conversation
export const getConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [{ sender: currentUserId, receiver: otherUserId }, { sender: otherUserId, receiver: currentUserId }]
    }).sort({ createdAt: 1 });

    const mapped = messages.map(m => ({
      _id: m._id,
      senderId: m.sender,
      receiverId: m.receiver,
      message: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt
    }));

    res.status(200).json({ success: true, count: mapped.length, data: mapped });
  } catch (error) { next(error); }
};

// @desc    Mark conversation as read
export const markConversationAsRead = async (req, res, next) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const otherUserId = req.params.userId;
    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error) { next(error); }
};
