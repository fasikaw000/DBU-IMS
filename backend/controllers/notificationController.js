import Notification from '../models/Notification.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) { next(error); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    notification.is_read = true;
    await notification.save();
    res.status(200).json({ success: true, data: notification });
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user.id, is_read: false }, { is_read: true });
    res.status(200).json({ success: true, message: 'Done' });
  } catch (error) { next(error); }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const notify = async (userId, type, message, link = "") => {
  try {
    return await Notification.create({ user: userId, type, message, link });
  } catch (error) { console.error(error); return null; }
};
