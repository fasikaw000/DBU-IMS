import mongoose from 'mongoose';

const logbookSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  tasks_completed: {
    type: String,
    required: [true, 'Please describe your tasks completed'],
    trim: true
  },
  hours_spent: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  remarks: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Logbook', logbookSchema);
