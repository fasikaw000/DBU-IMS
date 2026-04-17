import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Department from '../models/Department.js';
import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────
// @desc    Emergency Admin Password Reset
// @route   POST /api/admin/reset-admin
// @access  Public (protected by ENV secret)
// ─────────────────────────────────────────────────────────────
export const emergencyAdminReset = async (req, res, next) => {
  try {
    const { secret, newPassword } = req.body;

    if (!secret || secret !== process.env.ADMIN_RECOVERY_SECRET) {
      await AuditLog.create({ action: 'emergency_reset_failed', details: 'Invalid secret provided', ip: req.ip });
      return res.status(403).json({ success: false, message: 'Invalid recovery secret' });
    }

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.' });
    }

    const admin = await User.findOne({ role: 'college_admin' });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'No admin user found in system to reset.' });
    }

    admin.password = newPassword;
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    await admin.save();

    await AuditLog.create({ user: admin._id, action: 'emergency_admin_reset', details: 'Admin password recovered via secret', ip: req.ip });

    res.status(200).json({ success: true, message: 'Admin password successfully reset. You can now login.' });
  } catch (err) {
    next(err);
  }
};
import Student from '../models/Student.js';
import { generateUsername } from '../utils/generateUsername.js';

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Create a new student account
// @route   POST /api/admin/student
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const createStudent = async (req, res, next) => {
  try {
    const { name, email, department, studentId, cbeAccount } = req.body;

    if (!name || !email || !department || !studentId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Generate unique DBU username
    const username = await generateUsername('student');

    // Make sure department exists
    const dept = await Department.findOne({ _id: department });
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Create User record
    const user = await User.create({
      name,
      email,
      username,
      department: dept._id,
      role: 'student',
      isActivated: false
    });

    // Create corresponding Student profile
    const student = await Student.create({
      user: user._id,
      username,
      studentId,
      department: dept._id,
      cbeAccount: cbeAccount || null
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'created_student',
      details: `Created student account for ${studentId} with username ${username}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { username, studentId, name }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Create a staff member (Advisor / Department Dean)
// @route   POST /api/admin/staff
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, department, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
    }

    if (!['advisor', 'department_dean', 'college_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const username = await generateUsername(role);

    const userObj = {
      name,
      email,
      username,
      role,
      isActivated: false
    };

    if (department) {
      const dept = await Department.findOne({ _id: department });
      if (dept) userObj.department = dept._id;
    }

    const user = await User.create(userObj);

    await AuditLog.create({
      user: req.user.id,
      action: 'created_staff',
      details: `Created ${role} account with username ${username}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: { username, name, role }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Fetch all users
// @route   GET /api/admin/users
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).populate('department', 'name code').select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Manage Departments (Create)
// @route   POST /api/admin/departments
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, dean } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const deptObj = { name, code, description };
    if (dean) deptObj.dean = dean; // Optional dean ID

    const department = await Department.create(deptObj);

    await AuditLog.create({
      user: req.user.id,
      action: 'created_department',
      details: `Created department: ${name}`,
      ip: req.ip
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Manage Departments (Get All)
// @route   GET /api/admin/departments
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const getDepartments = async (req, res, next) => {
  try {
    const depts = await Department.find({}).populate('dean', 'name username email');
    res.status(200).json({ success: true, count: depts.length, data: depts });
  } catch (error) {
    next(error);
  }
};
