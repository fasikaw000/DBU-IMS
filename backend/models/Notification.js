import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: ['APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'ADVISOR_ASSIGNED', 'NEW_MESSAGE', 'REPORT_SUBMITTED', 'EVALUATION_SUBMITTED', 'INFO', 'FEEDBACK', 'ANNOUNCEMENT', 'internship_approved', 'report_submitted', 'evaluation_submitted', 'advisor_assigned', 'info', 'new_message', 'announcement'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);
