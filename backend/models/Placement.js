import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  status: {
    type: String,
    enum: ['AWAITING_ASSIGNMENT', 'ASSIGNED', 'ACTIVE', 'COMPLETED', 'TERMINATED'],
    default: 'AWAITING_ASSIGNMENT'
  },
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  supervisorName: {
    type: String
  },
  supervisorEmail: {
    type: String
  },
  supervisorPhone: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Placement', placementSchema);
