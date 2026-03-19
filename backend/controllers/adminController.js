import User from '../models/User.js';

// @desc    Admin Provisions a Staff Member (Advisor or Dept Head)
// @route   POST /api/admin/provision
// @access  Private (COLLEGE_DEAN Only)
export const provisionStaff = async (req, res, next) => {
  try {
    const { userId, email, password, name, role } = req.body;

    // Validate role
    const validRoles = ['ADVISOR', 'DEPARTMENT_HEAD', 'COLLEGE_DEAN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for staff provisioning', data: null });
    }

    const user = await User.create({
      userId,
      email,
      password,
      name,
      role
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
