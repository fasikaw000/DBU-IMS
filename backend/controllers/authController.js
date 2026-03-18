const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Login user (Handles both Student DBU ID & Staff Email/ID)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Validate request
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide identifier and password', data: null });
    }

    // Check for user by userId (DBU ID) OR Email
    const user = await User.findOne({
      $or: [{ userId: identifier }, { email: identifier }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Register a Student User (Self-Service)
// @route   POST /api/auth/register/student
// @access  Public
exports.registerStudent = async (req, res, next) => {
  try {
    const { studentId, password, name, department, phone, email } = req.body;

    // Validate DBU Format
    const dbuRegex = /^DBU\d{7}$/;
    if (!dbuRegex.test(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID format. Expected DBU1234567', data: null });
    }

    // Create User account first
    const user = await User.create({
      userId: studentId,
      name,
      email,
      password,
      role: 'STUDENT'
    });

    // Create linked Student profile
    const student = await Student.create({
      user: user._id,
      studentId: studentId,
      department,
      phone
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// Helper to send formatted token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    message: 'Authentication successful',
    data: {
      _id: user._id,
      name: user.name,
      role: user.role,
      token
    }
  });
};
