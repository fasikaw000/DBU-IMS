import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^DBU\d{7}$/, 'Username must follow the format DBU0000001']
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^DBU\d{7}$/, 'Student ID must map the format DBU1234567']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false
  },
  phone: {
    type: String,
    required: false,
    match: [/^\d{10,15}$/, 'Phone number must be between 10 and 15 digits']
  },
  cbeAccount: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\d{13}$/, 'CBE Account Number must be exactly 13 digits']
  },
  year: {
    type: String,
    required: [true, 'Student year is required'],
    trim: true
  },
  assignedAdvisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

studentSchema.virtual('internship', {
  ref: 'Internship',
  localField: '_id',
  foreignField: 'student',
  justOne: true
});

export default mongoose.model('Student', studentSchema);
