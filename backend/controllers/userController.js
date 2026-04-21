import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const updates = {};
    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
      }
      updates.name = trimmed;
    }

    if (typeof email === 'string' && email.trim() !== '') {
      const normalized = email.trim().toLowerCase();
      if (!emailRegex.test(normalized)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      }

      const existing = await User.findOne({ email: normalized });
      if (existing && existing._id.toString() !== req.user.id.toString()) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
      updates.email = normalized;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select('-password');

    await AuditLog.create({
      user: req.user.id,
      action: 'profile_updated',
      details: 'User updated profile (name/email)',
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    next(err);
  }
};

export const uploadMyPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const relativePath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePhoto: relativePath } },
      { new: true }
    ).select('-password');

    await AuditLog.create({
      user: req.user.id,
      action: 'profile_photo_updated',
      details: 'User updated profile photo',
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Profile photo updated', data: user });
  } catch (err) {
    next(err);
  }
};

export const changeMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const isPrev = await user.isPreviousPassword(newPassword);
    if (isPrev) {
      return res.status(400).json({ success: false, message: 'You cannot reuse a previously used password. Please choose a new password.' });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'password_changed',
      details: 'User changed password',
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

