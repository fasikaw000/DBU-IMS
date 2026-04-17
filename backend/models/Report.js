import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true
  },
  type: {
    type: String,
    enum: ['WEEKLY', 'MONTHLY', 'FINAL'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  isLate: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  approved: {
    type: Boolean,
    default: null // null = pending, true = approved, false = rejected
  },
  feedback: {
    comment: String,
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateAdded: Date
  }
}, {
  timestamps: true
});

// Middleware to check if submission is late
reportSchema.pre('save', function (next) {
    if (this.isModified('fileUrl') || this.isNew) {
        if (this.dueDate && new Date() > this.dueDate) {
            this.isLate = true;
        }
    }
    next();
});

export default mongoose.model('Report', reportSchema);
