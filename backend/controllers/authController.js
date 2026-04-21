import crypto from 'crypto';
import User from '../models/User.js';
import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';
import { normalizeRole } from '../utils/roles.js';

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ─────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
export const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      await AuditLog.create({ action: 'failed_login', details: `Invalid username: ${username}`, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ success: false, message: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.` });
    }

    if (!user.isActivated) {
      return res.status(401).json({
        success: false,
        message: 'Account not activated. Please activate your account first.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        await user.save({ validateBeforeSave: false });
        await AuditLog.create({ user: user._id, action: 'account_locked', details: `Account locked after 5 failed attempts`, ip: req.ip });
        return res.status(403).json({ success: false, message: 'Account locked due to 5 failed attempts. Please try again in 15 minutes.' });
      } else {
        await user.save({ validateBeforeSave: false });
      }
      await AuditLog.create({ user: user._id, action: 'failed_login', details: `Wrong password for: ${username}`, ip: req.ip });
      return res.status(401).json({ success: false, message: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.` });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);
    let studentId = undefined;

    if (normalizeRole(user.role) === 'student') {
      const student = await Student.findOne({ user: user._id });
      studentId = student?.studentId;
    }

    await AuditLog.create({
      user: user._id,
      action: 'login_success',
      details: `User ${username} logged in`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      token,
      role: normalizeRole(user.role),
      name: user.name,
      username: user.username,
      email: user.email,
      studentId
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user & update activity
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user) {
        // Set last active to 10 mins ago to ensure 'offline' status in UI
        user.lastActive = new Date(Date.now() - 10 * 60 * 1000);
        await user.save({ validateBeforeSave: false });
      }
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Activate Account (First-Time Only)
// @route   POST /api/auth/activate
// @access  Public
// ─────────────────────────────────────────────────────────────
export const activateAccount = async (req, res, next) => {
  try {
    const { username, student_id, email, cbeAccount, password, confirmPassword } = req.body;
    const normalizedUsername = username?.toUpperCase();
    const normalizedStudentId = student_id?.toUpperCase();
    const normalizedEmail = email?.toLowerCase();

    // 1. Validate required fields
    if (!normalizedUsername) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirm Password are required' });
    }

    // 2. Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // 3. Find user by username
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isActivated) {
      return res.status(400).json({ success: false, message: 'Account already activated. Please login.' });
    }

    // Check if email is already in use
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
    }

    // Role-specific validation
    let student = null;
    const role = normalizeRole(user.role);

    if (role === 'student') {
      if (!normalizedStudentId) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
      }
      if (!cbeAccount || !/^\d{13}$/.test(cbeAccount)) {
        return res.status(400).json({ success: false, message: 'A valid 13-digit CBE Account is required' });
      }

      // Check if CBE account is already used
      const existingCbe = await Student.findOne({ cbeAccount });
      if (existingCbe) {
        return res.status(400).json({ success: false, message: 'This CBE Account is already registered in our system' });
      }

      student = await Student.findOne({ user: user._id, studentId: normalizedStudentId });
      if (!student) {
        return res.status(400).json({ success: false, message: 'Student ID does not match this account' });
      }
    }

    // 6. Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
    }

    if (password.toLowerCase() === normalizedUsername.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Password cannot be the same as your username.' });
    }

    // Update User
    user.email = normalizedEmail;
    user.password = password;
    user.isActivated = true;
    await user.save();

    // Update Student if applicable
    if (student) {
      student.cbeAccount = cbeAccount;
      await student.save();
    }

    await AuditLog.create({
      user: user._id,
      action: 'account_activated',
      details: `Account ${normalizedUsername} activated with email ${normalizedEmail}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Account activated successfully. You can now login.'
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Forgot Password — Generate Reset Token & Send Email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const normalizedUsername = username?.toUpperCase();
    const normalizedEmail = email?.toLowerCase();

    if (!normalizedUsername || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Please provide both username and email' });
    }

    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that username' });
    }

    if (!user.isActivated) {
      return res.status(400).json({ success: false, message: 'Account not activated. Please activate your account first.' });
    }

    if (!user.email) {
      return res.status(400).json({ success: false, message: 'No email is associated with this account. Please contact your administrator.' });
    }
    if (user.email.toLowerCase() !== normalizedEmail) {
      return res.status(400).json({ success: false, message: 'The provided email does not match our records for this account.' });
    }

    // Generate token (10-minute expiry set in model method)
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a5f;">DBU Internship Management System</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested a password reset for your account (<strong>${user.username}</strong>).</p>
        <p>Click the button below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset My Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link:<br/><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        <hr/>
        <p style="color: #999; font-size: 12px;">Debre Berhan University — Computing Science College</p>
      </div>
    `;

    try {
      await sendEmail({ to: user.email, subject: 'DBU-IMS Password Reset Request', html });
      res.status(200).json({
        success: true,
        message: `Password reset link sent to the email associated with account "${user.username}"`
      });
    } catch (emailErr) {
      // If email fails, clear the token so the user can try again
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('[EMAIL ERROR]', emailErr.message);
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again later.' });
    }
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Reset Password using Token
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirmPassword are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Hash the incoming raw token to compare with stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please request a new one.' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
    }

    if (user.email && password === user.email) {
      return res.status(400).json({ success: false, message: 'Password cannot be the same as your email address.' });
    }

    if (password.toLowerCase() === user.username.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Password cannot be the same as your username.' });
    }

    const isPrev = await user.isPreviousPassword(password);
    if (isPrev) {
      return res.status(400).json({ success: false, message: 'You cannot reuse a previously used password. Please choose a new password.' });
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'account_activated', // closest matching action
      details: `Password reset for user: ${user.username}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (err) {
    next(err);
  }
};
