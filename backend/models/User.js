import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
    trim: true
  },
  email: {
    type: String,
    match: [/^\w+([\.-]?\w+)*@dbu\.edu\.et$/, 'Please use a valid Debre Berhan University email (@dbu.edu.et)']
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
    enum: ['student', 'advisor', 'department_dean', 'college_admin'],
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
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving (only when modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(this.password, salt);
  this.password = hash;

  if (!this.previousPasswords) {
    this.previousPasswords = [];
  }
  this.previousPasswords.push(hash);
  next();
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

// Generate secure reset token (15-minute expiry)
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;
