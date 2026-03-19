import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    match: [/^DBU\d{7}$/, 'Student ID must map the format DBU1234567']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['CS', 'IS', 'IT', 'DS', 'SE']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  }
}, {
  timestamps: true
});

export default mongoose.model('Student', studentSchema);
