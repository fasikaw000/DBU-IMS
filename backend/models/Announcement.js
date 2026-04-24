import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  targetRoles: [{
    type: String,
    enum: ['Student', 'Advisor', 'Dean']
  }],
  targetDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  targetFilters: {
    type: mongoose.Schema.Types.Mixed // e.g., { hasCbe: false, isActivated: false }
  },
  isBroadcast: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Announcement', AnnouncementSchema);
