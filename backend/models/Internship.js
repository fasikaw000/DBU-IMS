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
    required: true,
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  companySupervisorName: {
    type: String,
    required: true
  },
  companySupervisorEmail: {
    type: String,
    required: [true, 'Company supervisor email is required'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  companySupervisorPhone: {
    type: String,
    required: [true, 'Company supervisor phone is required'],
    match: [/^\+?[0-9]{10,15}$/, 'Please fill a valid phone number (10-15 digits)']
  },
  advisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to University Advisor
  },
  companyEvaluationUrl: {
    type: String
  },
  presentationCompleted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['NOT_APPLIED', 'PENDING', 'PENDING_APPROVAL', 'RESUBMITTED', 'REVISION_REQUIRED', 'APPROVED', 'ACTIVE', 'ONGOING', 'REJECTED', 'SUBMITTED', 'EVALUATED', 'COMPLETED'],
    default: 'PENDING'
  },
  revisionMessage: {
    type: String,
    trim: true
  },
  finalGrade: {
    advisorGrade: { type: Number, min: 0, max: 100 },
    advisorScore: { type: Number, min: 0, max: 100 },
    companyGrade: { type: Number, min: 0, max: 100 },
    projectGrade: { type: Number, min: 0, max: 100 },
    documentationGrade: { type: Number, min: 0, max: 100 },
    implementationGrade: { type: Number, min: 0, max: 100 },
    presentationGrade: { type: Number, min: 0, max: 100 },
    total: { type: Number, min: 0, max: 100 },
    letterGrade: { type: String, trim: true },
    gradePoint: { type: Number, min: 0, max: 4 },
    status: { type: String, trim: true },
    description: { type: String, trim: true }
  }
}, {
  timestamps: true // Tracks exactly when the internship transitions state
});

export default mongoose.model('Internship', internshipSchema);
