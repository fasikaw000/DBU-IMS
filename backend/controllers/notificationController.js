import Notification from '../models/Notification.js';

// @desc    Create a notification (System/Admin)
// @route   POST /api/notifications
// @access  Private/Admin
export const createNotification = async (req, res) => {
  try {
    const { recipient_id, type, message, link } = req.body;

    const notification = await Notification.create({
      recipient_id,
      type,
      message,
      link
    });

    if (res) {
      res.status(201).json({ success: true, data: notification });
    }
    return notification;
  } catch (error) {
    console.error(error);
    if (res) {
      res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
  }
};

/**
 * Internal utility to create notifications
 * @param {string} recipient_id - User ID receiving the notification
 * @param {string} type - 'internship_approved', 'report_submitted', etc.
 * @param {string} message - Notification text
 * @param {string} link - Optional frontend link
 */
export const notify = async (recipient_id, type, message, link = null) => {
    try {
        await Notification.create({
            recipient_id,
            type,
            message,
            link
        });
    } catch (error) {
        console.error('Notification Error:', error);
    }
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user.id }).sort({ created_at: -1 });
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
