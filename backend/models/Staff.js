import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
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
    match: [/^STF\d{6}$/, 'Username must follow the format STF000001']
  },
  fullName: {
    type: String,
    required: [true, 'Full Name is required'],
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  role: {
    type: String,
    enum: ['dean', 'advisor', 'admin'],
    required: [true, 'Role is required']
  }
}, {
  timestamps: true
});

export default mongoose.model('Staff', staffSchema);
