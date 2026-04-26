import User from '../models/User.js';
import Student from '../models/Student.js';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Internship from '../models/Internship.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Send broadcast or group message (Admin/Dean)
// @route   POST /api/communication/send
// @access  Private (Admin/Dean)
export const sendCommunication = async (req, res, next) => {
  try {
    const { 
      type, // 'broadcast', 'group', 'direct'
      title, 
      content, 
      filters, // { hasCbe, isActivated, internshipStatus }
      targetRoles, 
      receiverId 
    } = req.body;

    const senderId = req.user.id;
    const isDean = req.user.role === 'Dean';
    const isAdmin = req.user.role === 'Admin';

    if (!isAdmin && !isDean) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (type === 'direct') {
      if (!receiverId) return res.status(400).json({ success: false, message: 'Receiver ID required' });
      
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content
      });

      await Notification.create({
        user: receiverId,
        sender: senderId,
        type: 'NEW_MESSAGE',
        message: `Admin/Dean: ${content.substring(0, 50)}`,
        link: '/messages'
      });

      return res.status(201).json({ success: true, data: message });
    }

    // Broadcast or Group
    let query = { role: 'Student', isActive: true };
    
    if (isDean) {
      query.department = req.user.department;
    }

    // Apply filters
    if (filters) {
      if (filters.isActivated === false) {
        query.isActivated = false;
      }
      
      if (filters.hasCbe === false || filters.internshipStatus) {
        const studentQuery = {};
        if (isDean) studentQuery.department = req.user.department;
        const students = await Student.find(studentQuery).select('user cbeAccount _id');
        let filteredUserIds = [];

        for (let s of students) {
          let match = true;
          if (filters.hasCbe === false && s.cbeAccount) match = false;
          
          if (filters.internshipStatus) {
            const internship = await Internship.findOne({ student: s._id });
            if (filters.internshipStatus === 'not_applied' && internship) match = false;
            if (filters.internshipStatus === 'pending' && (!internship || internship.status !== 'PENDING_APPROVAL')) match = false;
            if (filters.internshipStatus === 'approved' && (!internship || internship.status !== 'APPROVED')) match = false;
          }

          if (match) filteredUserIds.push(s.user);
        }
        query._id = { $in: filteredUserIds };
      }
    }

    const recipients = await User.find(query).select('_id');
    
    // Create Announcement record
    const announcement = await Announcement.create({
      sender: senderId,
      title: title || 'Announcement',
      content,
      targetRoles: isAdmin ? (targetRoles || ['Student']) : ['Student'],
      targetDepartment: isDean ? req.user.department : null,
      targetFilters: filters,
      isBroadcast: type === 'broadcast'
    });

    // Notify all recipients
    const notifications = recipients.map(r => ({
      user: r._id,
      sender: senderId,
      type: 'ANNOUNCEMENT',
      message: `${isDean ? 'Department' : 'System'} Announcement: ${title || content.substring(0, 30)}`,
      link: '/notifications'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    await AuditLog.create({
      user: senderId,
      action: 'communication_sent',
      details: `${type} sent to ${recipients.length} users. Title: ${title}`,
      ip: req.ip
    });

    res.status(201).json({ 
      success: true, 
      message: `Message sent to ${recipients.length} recipients.`,
      recipientCount: recipients.length 
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get announcements for current user
// @route   GET /api/communication/announcements
// @access  Private
export const getMyAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    next(error);
  }
};
