import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  internship_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: false,
    unique: true,
    sparse: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: false
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false
  },
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  supervisor_name: {
    type: String,
    required: false
  },
  supervisor_email: {
    type: String,
    required: false
  },
  company_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  skills_rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    trim: true
  },
  scores: {
    companyGrade: { type: Number, min: 0, max: 100 },
    documentationGrade: { type: Number, min: 0, max: 100 },
    implementationGrade: { type: Number, min: 0, max: 100 },
    presentationGrade: { type: Number, min: 0, max: 100 }
  },
  advisorFeedback: {
    type: String,
    trim: true
  },
  advisorScore: {
    type: Number,
    min: 0,
    max: 100
  },
  finalGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  letterGrade: {
    type: String,
    trim: true
  },
  gradePoint: {
    type: Number,
    min: 0,
    max: 4
  },
  gradeStatus: {
    type: String,
    trim: true
  },
  submitted_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Evaluation', evaluationSchema);
