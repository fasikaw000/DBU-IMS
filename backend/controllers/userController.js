import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Student from '../models/Student.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import { normalizeRole } from '../utils/roles.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('department', 'name code');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    let studentId = null;
    let studentProfile = null;
    if (normalizeRole(user.role) === 'Student') {
      studentProfile = await Student.findOne({ user: user._id }).select('studentId cbeAccount');
      if (studentProfile) studentId = studentProfile.studentId;
    }
    res.status(200).json({ success: true, data: { ...user.toObject(), studentProfile, studentId } });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
      }
      updates.name = trimmed;
    }

    if (req.body.phone !== undefined) {
      const phone = String(req.body.phone || '').trim();
      if (phone && !/^\d{10,15}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Phone number must be between 10 and 15 digits' });
      }
      updates.phone = phone;
    }

    if (typeof email === 'string' && email.trim() !== '') {
      const normalized = email.trim().toLowerCase();
      if (!emailRegex.test(normalized)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      }

      const existing = await User.findOne({
        $or: [{ email: normalized }, { pendingEmail: normalized }]
      });
      if (existing && existing._id.toString() !== req.user.id.toString()) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }

      if (normalized !== (user.email || '').toLowerCase()) {
        const verifyToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
        user.pendingEmail = normalized;
        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpire = Date.now() + 30 * 60 * 1000;
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verifyToken}`;
        await sendEmail({
          to: normalized,
          subject: 'DBU-IMS Email Verification',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e3a5f;">DBU Internship Management System</h2>
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Click the button below to verify your new email address for your account (<strong>${user.username}</strong>).</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Verify Email
                </a>
              </div>
              <p>If the button doesn't work, use this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
              <p style="color: #999; font-size: 12px;">This link expires in 30 minutes.</p>
            </div>
          `
        });
      }
    }

    Object.assign(user, updates);
    await user.save();

    let studentProfile = null;
    if (normalizeRole(user.role) === 'Student') {
      studentProfile = await Student.findOne({ user: user._id });
      if (studentProfile) {
        if (updates.phone) {
          studentProfile.phone = updates.phone;
        }

        // Consolidated CBE Update
        if (req.body.cbeAccount !== undefined) {
          const cbe = String(req.body.cbeAccount || '').trim();
          if (cbe) {
            if (!/^\d{10,16}$/.test(cbe)) {
              return res.status(400).json({ success: false, message: 'CBE account must be between 10 and 16 digits' });
            }

            // Check duplicate
            const existing = await Student.findOne({ cbeAccount: cbe });
            if (existing && existing._id.toString() !== studentProfile._id.toString()) {
              return res.status(400).json({ success: false, message: 'This CBE account is already registered' });
            }
            studentProfile.cbeAccount = cbe;
          } else {
            studentProfile.cbeAccount = undefined;
          }
        }
        
        await studentProfile.save();
      }
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'profile_updated',
      details: 'User updated profile (name/email)',
      ip: req.ip
    });

    if (typeof email === 'string' && email.trim() !== '' && user.pendingEmail && user.pendingEmail === email.trim().toLowerCase()) {
      return res.status(200).json({
        success: true,
        message: 'Profile updated. Please verify your new email from the link sent to your inbox.',
        data: { ...user.toObject(), studentProfile }
      });
    }
    res.status(200).json({ success: true, message: 'Profile updated', data: { ...user.toObject(), studentProfile } });
  } catch (err) {
    next(err);
  }
};

export const verifyEmailChange = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user || !user.pendingEmail) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    const existing = await User.findOne({ email: user.pendingEmail });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'email_verified',
      details: `User verified and updated email to ${user.email}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMyStudentProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'Student') {
      return res.status(403).json({ success: false, message: 'Only students can access student profile details' });
    }
    const student = await Student.findOne({ user: req.user.id }).select('studentId cbeAccount');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        studentId: student.studentId,
        cbeAccount: student.cbeAccount || '',
        cbeEditable: true
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateMyCbeAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'Student') {
      return res.status(403).json({ success: false, message: 'Only students can update CBE account' });
    }
    const cbeAccount = String(req.body.cbeAccount || '').trim();
    if (!/^\d{13}$/.test(cbeAccount)) {
      return res.status(400).json({ success: false, message: 'CBE Account Number must be exactly 13 digits' });
    }
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const existing = await Student.findOne({ cbeAccount });
    if (existing && existing._id.toString() !== student._id.toString()) {
      return res.status(400).json({ success: false, message: 'This CBE account is already registered' });
    }
    const previousCbe = student.cbeAccount || null;
    student.cbeAccount = cbeAccount;
    await student.save();

    await AuditLog.create({
      user: req.user.id,
      action: previousCbe ? 'cbe_account_updated' : 'cbe_account_added',
      details: previousCbe
        ? `Student updated CBE account from ${previousCbe} to ${cbeAccount}`
        : `Student added CBE account: ${cbeAccount}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'CBE account saved successfully',
      data: {
        studentId: student.studentId,
        cbeAccount: student.cbeAccount,
        cbeEditable: true
      }
    });
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

export const getRecentActivity = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user.role);
    let query = {};
    let limit = 3;
    
    // We dynamically load models needed for scoping
    const User = (await import('../models/User.js')).default;
    const Student = (await import('../models/Student.js')).default;
    const Internship = (await import('../models/Internship.js')).default;

    if (role === 'Admin') {
      const allowedActions = [
        'user_created', 'created_student', 'created_staff',
        'user_deactivated', 'user_activated',
        'internship_approved', 'internship_rejected',
        'advisor_assigned',
        'dept_created', 'dept_updated',
        'broadcast_message_sent', 'communication_sent'
      ];
      query = { action: { $in: allowedActions } };
    } 
    else if (role === 'Dean') {
      // Find all users in the dean's department
      const currentUser = await User.findById(req.user.id);
      const deptUsers = await User.find({ department: currentUser.department }).select('_id');
      const deptUserIds = deptUsers.map(u => u._id);

      const allowedActions = [
        'internship_application_submitted', 'internship_pending_approval',
        'internship_approved', 'internship_rejected',
        'advisor_assigned', 'communication_sent'
      ];

      query = { 
        user: { $in: deptUserIds },
        action: { $in: allowedActions } 
      };
    } 
    else if (role === 'Advisor') {
      // Find students assigned to this advisor
      const internships = await Internship.find({ advisor_id: req.user.id });
      const studentIds = internships.map(i => i.student);
      const students = await Student.find({ _id: { $in: studentIds } });
      const studentUserIds = students.map(s => s.user);

      const allowedActions = [
        'advisor_assigned', 
        'report_submitted', 
        'message_sent', 'new_message', 'message_received'
      ];

      query = {
        $or: [
          { user: req.user.id }, // e.g., advisor assigned to themselves, or messages
          { user: { $in: studentUserIds }, action: 'report_submitted' }
        ],
        action: { $in: allowedActions }
      };
    } 
    else if (role === 'Student') {
      const allowedActions = [
        'internship_application_submitted', 'internship_pending_approval',
        'advisor_assigned', 
        'report_submitted', 
        'profile_updated', 'cbe_account_added', 'cbe_account_updated'
      ];

      const student = await Student.findOne({ user: req.user.id });
      const internship = student ? await Internship.findOne({ student: student._id }) : null;
      
      query = {
        $or: [
          { user: req.user.id },
          { 'targetResource.documentId': internship?._id }
        ],
        action: { $in: allowedActions }
      };
    } 
    else {
      // Fallback for any other role
      query = { 
        user: req.user.id,
        action: { $ne: 'login' } 
      };
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const translate = (log) => {
      const { action, details } = log;
      switch (action) {
        case 'profile_updated': return 'Profile updated successfully';
        case 'cbe_account_added': 
        case 'cbe_account_updated': return 'Profile updated (CBE account)';
        case 'report_submitted': return 'Report uploaded successfully';
        case 'internship_pending_approval':
        case 'internship_application_submitted': return 'Internship application submitted';
        case 'internship_approved': return 'Internship application approved';
        case 'internship_rejected': return 'Internship application rejected';
        case 'advisor_assigned': 
          if (role === 'Student') return 'Advisor assigned to you';
          return 'Advisor assigned';
        case 'user_created':
        case 'created_student':
        case 'created_staff': return 'New user account created';
        case 'user_deactivated': return 'User account deactivated';
        case 'dept_created': return 'New department created';
        case 'dept_updated': return 'Department updated';
        case 'broadcast_message_sent':
        case 'communication_sent': return 'Broadcast message sent';
        case 'message_sent':
        case 'new_message':
        case 'message_received': return 'Message received';
        default: return details || action.replace(/_/g, ' ');
      }
    };

    const formatted = logs.map(log => ({
      id: log._id,
      message: translate(log),
      time: log.createdAt,
      type: log.action
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};
