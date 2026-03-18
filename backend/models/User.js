const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'Please provide an ID for login'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    // Optional because students use studentId
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Exclude password from query results by default
  },
  role: {
    type: String,
    enum: ['STUDENT', 'ADVISOR', 'COMPANY', 'DEPARTMENT_HEAD', 'COLLEGE_DEAN'],
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name']
  }
}, {
  timestamps: true // Automatically creates createdAt and updatedAt fields
});

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
