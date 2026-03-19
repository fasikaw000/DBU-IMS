import User from '../models/User.js';
import ValidStudentId from '../models/ValidStudentId.js';
import Internship from '../models/Internship.js';
import bcrypt from 'bcryptjs';

// @desc    Admin Provisions a Staff Member (Advisor or Dept Head)
// @route   POST /api/admin/provision
// @access  Private (COLLEGE_DEAN Only)
export const provisionStaff = async (req, res, next) => {
  try {
    const { userId, email, password, name, role } = req.body;

    // Validate role
    const validRoles = ['advisor', 'department_head', 'college_head', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role for staff provisioning', data: null });
    }

    const user = await User.create({
      userId,
      email,
      password,
      name,
      role: role.toLowerCase()
    });

    res.status(201).json({
      success: true,
      message: `${role} successfully provisioned`,
      data: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (Paginated list APIs)
// @route   GET /api/admin/users
// @access  Private (COLLEGE_DEAN Only)
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find().skip(startIndex).limit(limit).select('-password');

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        count: users.length,
        total,
        page,
        users
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Seed valid student IDs (Admin only)
// @route   POST /api/admin/seed-ids
// @access  Private (Admin)
export const seedValidIds = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({ success: false, message: 'Please provide an array of studentIds' });
    }

    const docs = studentIds.map(id => ({ studentId: id }));
    await ValidStudentId.insertMany(docs, { ordered: false }); // ordered: false to skip duplicates

    res.status(201).json({
      success: true,
      message: 'Student IDs seeded successfully'
    });
  } catch (err) {
    if (err.code === 11000) {
        return res.status(201).json({ success: true, message: 'Student IDs seeded (some duplicates skipped)' });
    }
    next(err);
  }
};

// @desc    Get College-wide Analytics
// @route   GET /api/admin/analytics
// @access  Private (College Head / Admin)
export const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalStaff = await User.countDocuments({ role: { $ne: 'student' } });
    
    // Aggregate internship status counts
    const internshipStatsRaw = await Internship.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Format for easier frontend use
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    internshipStatsRaw.forEach(item => {
      if (stats.hasOwnProperty(item._id)) {
        stats[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalStaff,
        activeInternships: stats.approved,
        pendingInternships: stats.pending,
        rejectedInternships: stats.rejected,
        totalApplications: stats.approved + stats.pending + stats.rejected
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
