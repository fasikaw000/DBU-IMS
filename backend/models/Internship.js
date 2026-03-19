import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true // A student can only have 1 active internship workflow
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  field: {
    type: String,
    required: [true, 'Internship field is required (e.g., Web Dev, Cybersecurity)']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  companySupervisorName: {
    type: String,
    required: true
  },
  companySupervisorPhone: {
    type: String,
    required: true
  },
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to ADVISOR role
  },
  status: {
    type: String,
    enum: ['NOT_APPLIED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ONGOING', 'COMPLETED', 'GRADED'],
    default: 'PENDING_APPROVAL'
  },
  finalGrade: {
    advisorScore: { type: Number, min: 0, max: 100 },
    companyScore: { type: Number, min: 0, max: 100 },
    total: { type: Number, min: 0, max: 100 }
  }
}, {
  timestamps: true // Tracks exactly when the internship transitions state
});

export default mongoose.model('Internship', internshipSchema);
