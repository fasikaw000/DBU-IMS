import mongoose from 'mongoose';

const logbookSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    default: Date.now
  },
  activity: {
    type: String,
    required: [true, 'Please describe your activity'],
    trim: true
  },
  tasksCompleted: {
    type: String,
    required: false
  },
  problemsFaced: {
    type: String,
    required: false
  },
  attachments: [{
    type: String
  }],
  hoursWorked: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  comment: {
    text: String,
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateAdded: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Logbook', logbookSchema);
