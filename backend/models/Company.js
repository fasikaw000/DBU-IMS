import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  subcity: {
    type: String
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  createdByStudent: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  departmentApprover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);
