import User from '../models/User.js';
import Student from '../models/Student.js';
import ValidStudentId from '../models/ValidStudentId.js';
import jwt from 'jsonwebtoken';

// Generate JWT
const generateToken = (id, role, studentId = null) => {
  return jwt.sign({ id, role, studentId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register-student
// @access  Public
export const registerStudent = async (req, res) => {
  const { name, email, password, student_id, department, phone } = req.body;

  try {
    // 1. Verify student ID exists and not registered
    const validId = await ValidStudentId.findOne({ studentId: student_id });
    if (!validId) {
      return res.status(400).json({ success: false, message: 'Invalid Student ID provided' });
    }
    if (validId.isRegistered) {
      return res.status(400).json({ success: false, message: 'This Student ID is already registered' });
    }

    // 2. Check if user already exists with this email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // 3. Create User record
    const user = await User.create({
      name,
      email,
      password,
      role: 'student'
    });

    // 4. Create Student record
    const student = await Student.create({
      user: user._id,
      studentId: student_id,
      department,
      phone
    });

    // 5. Mark ID as registered
    validId.isRegistered = true;
    await validId.save();

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: student.studentId,
        token: generateToken(user._id, user.role, student.studentId)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register other roles (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Only allow admin roles to create non-student accounts
    // (Actual role check should be in middleware, but here is a backup)
    if (role === 'student' || role === 'supervisor') {
        return res.status(400).json({ success: false, message: 'Students and Supervisors cannot be created here' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      let student_id = null;
      if (user.role === 'student') {
          const student = await Student.findOne({ user: user._id });
          student_id = student?.studentId;
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          student_id,
          token: generateToken(user._id, user.role, student_id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
