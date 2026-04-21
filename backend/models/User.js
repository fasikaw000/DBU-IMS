import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { normalizeRole, ROLE_VALUES } from '../utils/roles.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    uppercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        if (normalizeRole(this.role) === 'student') {
          return /^DBU\d{7}$/.test(v);
        }
        // staff roles
        return /^STF\d{6}$/.test(v);
      },
      message: 'Username format is invalid for the assigned role (Staff: STF000001, Student: DBU0000001)'
    }
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: false, // Set during activation
    minlength: 6,
    select: false
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  role: {
    type: String,
    enum: ROLE_VALUES,
    set: normalizeRole,
    default: 'student'
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  previousPasswords: [{
    type: String
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  status: {
    type: String,
    enum: ['active', 'deactivated'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Hash password before saving (only when modified)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(this.password, salt);
  this.password = hash;

  if (!this.previousPasswords) {
    this.previousPasswords = [];
  }
  this.previousPasswords.push(hash);
});

// Helper for resetting
userSchema.methods.isPreviousPassword = async function (enteredPassword) {
  if (!this.previousPasswords || this.previousPasswords.length === 0) return false;
  for (let oldHash of this.previousPasswords) {
    const isMatch = await bcrypt.compare(enteredPassword, oldHash);
    if (isMatch) return true;
  }
  return false;
};

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate secure reset token (10-minute expiry)
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;
