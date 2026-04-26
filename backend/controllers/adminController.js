import mongoose from 'mongoose';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Department from '../models/Department.js';
import Internship from '../models/Internship.js';
import ValidStudentId from '../models/ValidStudentId.js';
import bcrypt from 'bcryptjs';
import { normalizeRole } from '../utils/roles.js';
import xlsx from 'xlsx';
import Staff from '../models/Staff.js';
import Settings from '../models/Settings.js';
import Company from '../models/Company.js';
import Placement from '../models/Placement.js';
import Student from '../models/Student.js';

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
import { generateUsername } from '../utils/generateUsername.js';

const IMPORTANT_ACTIVITY_ACTIONS = [
  'created_student',
  'created_staff',
  'bulk_students_uploaded',
  'bulk_staff_uploaded',
  'account_activated',
  'user_status_toggled',
  'dept_created',
  'advisor_assigned',
  'report_submitted',
  'grade_assigned',
  'student_evaluated' // legacy grade action
];

let hasStandardizedAdminRoles = false;
const standardizeAdminRolesOnce = async () => {
  if (hasStandardizedAdminRoles) return;
  await User.updateMany(
    { role: { $in: ['admin', 'ADMIN', 'college_admin'] } },
    { $set: { role: 'Admin' } }
  );
  hasStandardizedAdminRoles = true;
};

const DEFAULT_GRADING_SYSTEM = [
  { minScore: 90, maxScore: 100, letterGrade: 'A+', gradePoint: 4.0, status: 'Excellent', description: 'Outstanding performance' },
  { minScore: 85, maxScore: 89, letterGrade: 'A', gradePoint: 4.0, status: 'Excellent', description: 'Excellent performance' },
  { minScore: 80, maxScore: 84, letterGrade: 'A-', gradePoint: 3.75, status: 'Excellent', description: 'Strong and consistent performance' },
  { minScore: 75, maxScore: 79, letterGrade: 'B+', gradePoint: 3.5, status: 'Very Good', description: 'Very good achievement' },
  { minScore: 70, maxScore: 74, letterGrade: 'B', gradePoint: 3.0, status: 'Very Good', description: 'Good overall achievement' },
  { minScore: 65, maxScore: 69, letterGrade: 'B-', gradePoint: 2.75, status: 'Good', description: 'Above satisfactory performance' },
  { minScore: 60, maxScore: 64, letterGrade: 'C+', gradePoint: 2.5, status: 'Good', description: 'Satisfactory with notable gaps' },
  { minScore: 50, maxScore: 59, letterGrade: 'C', gradePoint: 2.0, status: 'Satisfactory', description: 'Minimum satisfactory standard' },
  { minScore: 45, maxScore: 49, letterGrade: 'C-', gradePoint: 1.75, status: 'Unsatisfactory', description: 'Below minimum expectation' },
  { minScore: 40, maxScore: 44, letterGrade: 'D', gradePoint: 1.0, status: 'Very Poor', description: 'Very weak performance' },
  { minScore: 30, maxScore: 39, letterGrade: 'Fx', gradePoint: 0, status: 'Fail (Re-exam)', description: 'Failed; re-exam required' },
  { minScore: 0, maxScore: 29, letterGrade: 'F', gradePoint: 0, status: 'Fail (Repeat course)', description: 'Failed; course must be repeated' }
];

const validateGradingSystem = (rules = []) => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return 'Grading system must contain at least one rule.';
  }

  const normalized = rules
    .map((rule) => ({
      minScore: Number(rule.minScore),
      maxScore: Number(rule.maxScore)
    }))
    .sort((a, b) => a.minScore - b.minScore);

  for (let i = 0; i < normalized.length; i += 1) {
    const current = normalized[i];
    if (!Number.isFinite(current.minScore) || !Number.isFinite(current.maxScore)) {
      return 'Each grading row must include valid numeric min and max scores.';
    }
    if (current.minScore < 0 || current.maxScore > 100 || current.minScore > current.maxScore) {
      return 'Grading score intervals must stay within 0-100 and min must be <= max.';
    }
    if (i > 0) {
      const previous = normalized[i - 1];
      if (current.minScore <= previous.maxScore) {
        return 'Grading score intervals overlap. Please use non-overlapping ranges.';
      }
      if (current.minScore !== previous.maxScore + 1) {
        return 'Grading intervals must be continuous and cover every score without gaps.';
      }
    }
  }

  if (normalized[0].minScore !== 0 || normalized[normalized.length - 1].maxScore !== 100) {
    return 'Grading system must fully cover scores from 0 to 100.';
  }

  return null;
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Create a new student account
// @route   POST /api/admin/student
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const createStudent = async (req, res, next) => {
  try {
    const { name, department, studentId, year } = req.body;

    if (!name || !department || !studentId || !year) {
      return res.status(400).json({ success: false, message: 'Name, Department, Student ID, and Year are required.' });
    }

    const normalizedStudentId = studentId.toUpperCase();

    // Check if Student ID already exists
    const existingStudent = await Student.findOne({ studentId: normalizedStudentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student ID has already been registered' });
    }

    // Generate unique DBU username
    const username = await generateUsername('student');

    // Make sure department exists
    const dept = await Department.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(department) ? department : null },
        { code: department },
        { name: department }
      ]
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Create User record
    const user = await User.create({
      name,
      username,
      department: dept._id,
      role: 'student',
      isActivated: false,
      activationStatus: 'Pending',
      isActive: true
    });

    // Create corresponding Student profile
    const student = await Student.create({
      user: user._id,
      username,
      studentId: normalizedStudentId,
      department: dept._id,
      year
    });

    // Handle ValidStudentId seeding if it exists
    const authorizedId = await ValidStudentId.findOne({ studentId: normalizedStudentId });
    if (authorizedId) {
      authorizedId.isRegistered = true;
      await authorizedId.save();
    } else {
      await ValidStudentId.create({ studentId: normalizedStudentId, isRegistered: true });
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'created_student',
      details: `Created student account for ${studentId} with username ${username}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { username, studentId, name, year }
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
    const { name, department, role } = req.body;

    if (!name || !department || !role) {
      return res.status(400).json({ success: false, message: 'Name, Department, and Role are required.' });
    }

    const normalizedRole = normalizeRole(role);
    if (!['Advisor', 'Dean'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Only Dean and Advisor are supported for staff accounts.' });
    }

    // Generate unique STF username
    const username = await generateUsername(normalizedRole);

    // Make sure department exists
    const dept = await Department.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(department) ? department : null },
        { code: department },
        { name: department }
      ]
    });

    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Create User record
    const user = await User.create({
      name,
      username,
      department: dept._id,
      role: normalizedRole,
      isActivated: false,
      activationStatus: 'Pending',
      isActive: true
    });

    // Create corresponding Staff profile
    const staff = await Staff.create({
      user: user._id,
      username,
      fullName: name,
      department: dept._id,
      role: normalizedRole === 'Dean' ? 'dean' : 'advisor'
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'created_staff',
      details: `Created staff account for ${name} with username ${username} (${role})`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      data: { username, name, role: normalizedRole }
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
    res.status(200).json({
      success: true,
      data: users.map((u) => ({ ...u.toObject(), role: normalizeRole(u.role) }))
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Fetch all students with detailed profiles
// @route   GET /api/admin/students
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find({})
      .populate('user', 'name email isActivated activationStatus isActive status phoneNumber')
      .populate('department', 'name code')
      .populate({
        path: 'internship',
        populate: { path: 'company', select: 'name' }
      });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students.map(s => ({
        _id: s._id,
        userId: s.user?._id,
        name: s.user?.name,
        email: s.user?.email,
        phoneNumber: s.user?.phoneNumber || s.phone,
        username: s.username,
        studentId: s.studentId,
        department: s.department,
        year: s.year,
        cbeAccount: s.cbeAccount,
        isActivated: s.user?.isActivated,
        activationStatus: s.user?.isActivated ? 'Activated' : 'Pending',
        status: s.user?.status || 'active',
        isActive: s.user?.isActive !== false,
        internshipStatus: s.internship?.status || 'NOT_APPLIED',
        companyName: s.internship?.company?.name || 'N/A',
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStaff = async (req, res, next) => {
  try {
    const staffMembers = await Staff.find({})
      .populate('user', 'name email isActivated activationStatus isActive status phoneNumber')
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      count: staffMembers.length,
      data: staffMembers.map(s => ({
        _id: s._id,
        userId: s.user?._id,
        name: s.fullName,
        email: s.user?.email,
        phoneNumber: s.user?.phoneNumber,
        username: s.username,
        department: s.department,
        role: s.role, // 'dean' or 'advisor'
        isActivated: s.user?.isActivated,
        activationStatus: s.user?.isActivated ? 'Activated' : 'Pending',
        status: s.user?.status || 'active',
        isActive: s.user?.isActive !== false,
        createdAt: s.createdAt
      }))
    });
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
    const { name, code, college, description, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required' });
    }

    const department = await Department.create({
      name,
      code,
      college,
      description,
      status: status || 'Active'
    });

    await AuditLog.create({
      user: req.user.id,
      action: 'dept_created',
      details: `Created department: ${name} (${code})`,
      ip: req.ip
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Department name or code already exists' });
    }
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, college, description } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    department.name = name || department.name;
    department.code = (code || department.code).toUpperCase();
    department.college = college !== undefined ? college : department.college;
    department.description = description !== undefined ? description : department.description;

    await department.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'dept_updated',
      details: `Updated department: ${department.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Department name or code already exists' });
    }
    next(error);
  }
};

export const toggleDepartmentStatus = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    department.status = department.status === 'Active' ? 'Inactive' : 'Active';
    await department.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'dept_status_toggled',
      details: `${department.status === 'Active' ? 'Activated' : 'Deactivated'} department: ${department.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};
// ─────────────────────────────────────────────────────────────
// @desc    Admin: Get Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const getAdminStats = async (req, res, next) => {
  try {
    await standardizeAdminRolesOnce();
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalAdmins = await User.countDocuments({ role: 'Admin' });
    const totalDeans = await User.countDocuments({ role: 'Dean' });
    const totalAdvisors = await User.countDocuments({ role: 'Advisor' });
    const totalStaff = totalDeans + totalAdvisors;
    const totalDepartments = await Department.countDocuments();
    const activeInternships = await Internship.countDocuments({ status: { $in: ['APPROVED', 'ONGOING', 'SUBMITTED', 'EVALUATED'] } });
    const completedInternships = await Internship.countDocuments({ status: 'COMPLETED' });

    // Aggregate Department distribution
    const departmentStats = await Department.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'users'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          studentsCount: {
            $size: { $filter: { input: '$users', as: 'u', cond: { $eq: ['$$u.role', 'Student'] } } }
          },
          advisorsCount: {
            $size: { $filter: { input: '$users', as: 'u', cond: { $eq: ['$$u.role', 'Advisor'] } } }
          },
          deansCount: {
            $size: { $filter: { input: '$users', as: 'u', cond: { $eq: ['$$u.role', 'Dean'] } } }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Get recent activity from AuditLog
    const recentActivity = await AuditLog.find({
      action: { $in: IMPORTANT_ACTIVITY_ACTIONS }
    })
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalAdmins,
        totalDeans,
        totalAdvisors,
        totalStaff,
        totalDepartments,
        activeInternships,
        completedInternships,
        departmentStats,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Seed Student IDs
// @route   POST /api/admin/seed-ids
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const seedStudentIds = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'Invalid IDs provided' });
    }

    const normalizedIds = studentIds.map((id) => id.toUpperCase());
    const docs = normalizedIds.map(id => ({ studentId: id }));
    // Use insertMany with ordered: false to skip duplicates
    try {
      await ValidStudentId.insertMany(docs, { ordered: false });
    } catch (err) {
      // Ignore 11000 duplicate key error
      if (err.code !== 11000) throw err;
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'seeded_ids',
      details: `Authorized ${normalizedIds.length} student IDs`,
      ip: req.ip
    });

    res.status(201).json({ success: true, message: 'Student IDs authorized.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Bulk upload students via CSV/Excel
// @route   POST /api/admin/students/bulk-upload
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const bulkUploadStudents = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(firstSheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Uploaded file is empty.' });
    }

    const seenStudentIds = new Set();
    const errors = [];
    const created = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNo = index + 2; // header row is 1

      const name = String(row['Full Name'] || row.Name || row.name || '').trim();
      const studentId = String(row['Student ID'] || row.studentId || row.student_id || '').trim().toUpperCase();
      const departmentValue = String(row.Department || row.department || '').trim();
      const year = String(row.Year || row.year || '').trim();

      if (!name || !studentId || !departmentValue || !year) {
        errors.push({ row: rowNo, message: 'Name, Student ID, Department, and Year are required.' });
        continue;
      }
      if (!/^DBU\d{7}$/.test(studentId)) {
        errors.push({ row: rowNo, message: 'Student ID must be in format DBU1234567.' });
        continue;
      }
      if (seenStudentIds.has(studentId)) {
        errors.push({ row: rowNo, message: 'Duplicate Student ID in upload file.' });
        continue;
      }
      seenStudentIds.add(studentId);

      const existingStudent = await Student.findOne({ studentId });
      if (existingStudent) {
        errors.push({ row: rowNo, message: 'Student ID already exists.' });
        continue;
      }

      const department = await Department.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(departmentValue) ? departmentValue : null },
          { code: departmentValue },
          { name: departmentValue }
        ]
      });

      if (!department) {
        errors.push({ row: rowNo, message: `Department "${departmentValue}" not found.` });
        continue;
      }

      try {
        const username = await generateUsername('student');
        const user = await User.create({
          name,
          username,
          department: department._id,
          role: 'student',
          isActivated: false,
          activationStatus: 'Pending',
          isActive: true
        });

        await Student.create({
          user: user._id,
          username,
          studentId,
          department: department._id,
          year
        });

        // Sync ValidStudentId
        await ValidStudentId.findOneAndUpdate(
          { studentId },
          { isRegistered: true },
          { upsert: true }
        );

        created.push({ row: rowNo, name, studentId, username, year });
      } catch (error) {
        errors.push({ row: rowNo, message: error.message || 'Failed to create student row.' });
      }
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'bulk_students_uploaded',
      details: `Bulk upload completed. Created: ${created.length}, Failed: ${errors.length}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Bulk upload completed. Created ${created.length} student(s).`,
      data: {
        createdCount: created.length,
        failedCount: errors.length,
        created,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Bulk upload staff via CSV/Excel
// @route   POST /api/admin/staff/bulk-upload
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const bulkUploadStaff = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(firstSheet, { defval: '' });

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Uploaded file is empty.' });
    }

    const errors = [];
    const created = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNo = index + 2;

      const name = String(row['Full Name'] || row.Name || row.name || '').trim();
      const departmentValue = String(row.Department || row.department || '').trim();
      const roleRaw = String(row.Role || row.role || '').trim().toLowerCase();

      if (!name || !departmentValue || !roleRaw) {
        errors.push({ row: rowNo, message: 'Full Name, Department, and Role are required.' });
        continue;
      }

      const role = normalizeRole(roleRaw);
      if (!['Advisor', 'Dean'].includes(role)) {
        errors.push({ row: rowNo, message: `Invalid role "${roleRaw}". Use "Dean" or "Advisor".` });
        continue;
      }

      const department = await Department.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(departmentValue) ? departmentValue : null },
          { code: departmentValue },
          { name: departmentValue }
        ]
      });

      if (!department) {
        errors.push({ row: rowNo, message: `Department "${departmentValue}" not found.` });
        continue;
      }

      try {
        const username = await generateUsername(role);
        const user = await User.create({
          name,
          username,
          department: department._id,
          role,
          isActivated: false,
          activationStatus: 'Pending',
          isActive: true
        });

        await Staff.create({
          user: user._id,
          username,
          fullName: name,
          department: department._id,
          role: role === 'Dean' ? 'dean' : 'advisor'
        });

        created.push({ row: rowNo, name, username, role });
      } catch (error) {
        errors.push({ row: rowNo, message: error.message || 'Failed to create staff row.' });
      }
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'bulk_staff_uploaded',
      details: `Bulk staff upload completed. Created: ${created.length}, Failed: ${errors.length}`,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Bulk staff upload completed. Created ${created.length} staff member(s).`,
      data: {
        createdCount: created.length,
        failedCount: errors.length,
        created,
        errors
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: List authorized student IDs
// @route   GET /api/admin/authorized-ids
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const getAuthorizedStudentIds = async (req, res, next) => {
  try {
    const ids = await ValidStudentId.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: ids });
  } catch (error) {
    next(error);
  }
};
// ─────────────────────────────────────────────────────────────
// INTERNSHIP MANAGEMENT
// ─────────────────────────────────────────────────────────────

export const getAllInternships = async (req, res, next) => {
  try {
    const internships = await Internship.find({})
      .populate({
        path: 'student',
        populate: { path: 'department', select: 'name code' }
      })
      .populate('company', 'name email location')
      .populate('advisor_id', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: internships.length, data: internships });
  } catch (error) {
    next(error);
  }
};

export const updateInternshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const internship = await Internship.findById(req.params.id);

    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

    internship.status = status;
    await internship.save();

    // Point 2: DEAN APPROVAL (CRITICAL FIX)
    if (status === 'APPROVED') {
      const studentProfile = await Student.findOne({ user: internship.student });
      
      // A. CREATE PLACEMENT RECORD
      await Placement.create({
        student: studentProfile?._id || internship.student,
        company: internship.company,
        department: internship.student_department || studentProfile?.department,
        status: 'ACTIVE',
        startDate: internship.startDate,
        endDate: internship.endDate
      });

      // Point 3: LINK STUDENT TO COMPANY
      await Company.findByIdAndUpdate(internship.company, {
        $addToSet: { students: studentProfile?._id || internship.student }
      });
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'internship_status_updated',
      details: `Updated internship for student ${internship.student} to ${status}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Assign advisor to internship
// @route   PATCH /api/admin/internships/:id/assign-advisor
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const assignAdvisor = async (req, res, next) => {
  try {
    const { advisorId } = req.body;
    const internship = await Internship.findById(req.params.id);

    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

    // Update Internship
    internship.advisor_id = advisorId;
    await internship.save();

    const studentProfile = await Student.findOne({ user: internship.student });

    // Point 6: ASSIGN ADVISOR
    // Update placement
    await Placement.findOneAndUpdate(
      { student: studentProfile?._id || internship.student, company: internship.company },
      { advisor: advisorId }
    );

    // Update student
    if (studentProfile) {
      studentProfile.assignedAdvisor = advisorId;
      await studentProfile.save();
    }

    await AuditLog.create({
      user: req.user.id,
      action: 'advisor_assigned',
      details: `Assigned advisor ${advisorId} to student ${internship.student}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Advisor assigned successfully', data: internship });
  } catch (error) {
    next(error);
  }
};

export const getInternshipDashboardStats = async (req, res, next) => {
  try {
    const total = await Internship.countDocuments();
    const active = await Internship.countDocuments({ status: { $in: ['APPROVED', 'ONGOING'] } });
    const completed = await Internship.countDocuments({ status: 'COMPLETED' });
    const pending = await Internship.countDocuments({ status: 'PENDING_APPROVAL' });

    res.status(200).json({
      success: true,
      data: { total, active, completed, pending }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// SYSTEM REPORTS
// ─────────────────────────────────────────────────────────────

export const getReportAnalytics = async (req, res, next) => {
  try {
    // 1. Student Distribution by Department
    const distribution = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', count: 1, _id: 0 } }
    ]);

    // 2. Internship Status Summary
    const statusSummary = await Internship.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3. Advisor Workload
    const workload = await Internship.aggregate([
      { $match: { advisor_id: { $ne: null } } },
      { $group: { _id: '$advisor_id', studentCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'advisor' } },
      { $unwind: '$advisor' },
      { $project: { name: '$advisor.name', count: '$studentCount', _id: 0 } }
    ]);

    // 4. Grade Distribution
    const grades = await Internship.aggregate([
      { $match: { 'finalGrade.total': { $exists: true } } },
      {
        $bucket: {
          groupBy: '$finalGrade.total',
          boundaries: [0, 50, 60, 75, 85, 101],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { distribution, statusSummary, workload, grades }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// USER UPDATES & DEACTIVATION
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Admin: Update student profile
 * @route   PUT /api/admin/students/:id
 */
export const updateStudent = async (req, res, next) => {
  try {
    const { name, department, year } = req.body;
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Update User record
    const user = await User.findById(student.user);
    if (user) {
      user.name = name || user.name;
      if (department) {
        const dept = await Department.findById(department);
        if (dept) {
          user.department = department;
          student.department = department;
        }
      }
      await user.save();
    }

    // Update Student record
    student.year = year || student.year;
    await student.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'student_updated',
      details: `Updated student ${student.studentId} (${user.name})`,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Update staff profile
 * @route   PUT /api/admin/staff/:id
 */
export const updateStaff = async (req, res, next) => {
  try {
    const { name, department, role } = req.body;
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff profile not found' });
    }

    // Update User record
    const user = await User.findById(staff.user);
    if (user) {
      user.name = name || user.name;
      if (department) {
        const dept = await Department.findById(department);
        if (dept) {
          user.department = department;
          staff.department = department;
        }
      }
      if (role) {
        const normRole = normalizeRole(role);
        if (['Advisor', 'Dean'].includes(normRole)) {
          user.role = normRole;
          staff.role = normRole === 'Dean' ? 'dean' : 'advisor';
        }
      }
      await user.save();
    }

    staff.fullName = name || staff.fullName;
    await staff.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'staff_updated',
      details: `Updated staff ${staff.username} (${user.name})`,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Staff updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Deactivate/Activate ANY user
 * @route   PATCH /api/admin/users/:id/status
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (normalizeRole(user.role) === 'Admin' && user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
    }

    user.isActive = user.isActive === false;
    user.status = user.isActive ? 'active' : 'deactivated';
    await user.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'user_status_toggled',
      details: `${user.status === 'active' ? 'Activated' : 'Deactivated'} user: ${user.username}`,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        status: user.status,
        activationStatus: user.activationStatus || (user.isActivated ? 'Activated' : 'Pending'),
        isActive: user.isActive !== false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Delete Department (with safety check)
 */
export const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    // Check if students or staff exist in this department
    const userCount = await User.countDocuments({ department: department._id });

    if (userCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete department: ${userCount} registered users belong to this department. Please deactivate it instead.` 
      });
    }

    await department.deleteOne();

    await AuditLog.create({
      user: req.user.id,
      action: 'dept_deleted',
      details: `Permanently deleted empty department: ${department.name}`,
      ip: req.ip
    });

    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// SYSTEM SETTINGS
// ─────────────────────────────────────────────────────────────

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // One-time compatibility migration: old default duration 3 -> new default 2.
    if (settings?.academicSettings?.defaultInternshipDurationMonths === 3) {
      settings.academicSettings.defaultInternshipDurationMonths = 2;
      await settings.save();
    }

    // Ensure a valid fallback if the value is missing/invalid in older records.
    if (!Number.isFinite(settings?.academicSettings?.defaultInternshipDurationMonths)) {
      settings.academicSettings.defaultInternshipDurationMonths = 2;
      await settings.save();
    }

    if (!Array.isArray(settings?.academicSettings?.gradingSystem) || settings.academicSettings.gradingSystem.length === 0) {
      settings.academicSettings.gradingSystem = DEFAULT_GRADING_SYSTEM;
      await settings.save();
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    // Backend default/fallback: when duration is omitted, keep/set default to 2.
    const duration = Number(settings?.academicSettings?.defaultInternshipDurationMonths) || 2;
    settings.academicSettings = settings.academicSettings || {};
    settings.academicSettings.defaultInternshipDurationMonths = duration;

    if (!Array.isArray(settings.academicSettings.gradingSystem) || settings.academicSettings.gradingSystem.length === 0) {
      settings.academicSettings.gradingSystem = DEFAULT_GRADING_SYSTEM;
    }

    const gradingValidationError = validateGradingSystem(settings.academicSettings.gradingSystem);
    if (gradingValidationError) {
      return res.status(400).json({ success: false, message: gradingValidationError });
    }

    await settings.save();

    await AuditLog.create({
      user: req.user.id,
      action: 'settings_updated',
      details: 'System-wide settings updated.',
      ip: req.ip
    });

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Admin: Get System Audit Logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────
export const getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const includeAll = req.query.includeAll === 'true';
    
    // Construct search filter
    const searchFilter = {
      ...(includeAll ? {} : { action: { $in: IMPORTANT_ACTIVITY_ACTIONS } }),
      ...(search
        ? {
            $or: [
              { action: { $regex: search, $options: 'i' } },
              { details: { $regex: search, $options: 'i' } }
            ]
          }
        : {})
    };

    const totalLogs = await AuditLog.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalLogs / limit) || 1;

    const logs = await AuditLog.find(searchFilter)
      .populate('user', 'name role username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        logs,
        page,
        totalPages,
        totalLogs
      }
    });
  } catch (error) {
    next(error);
  }
};
