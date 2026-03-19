import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  internship_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship',
    required: true,
    unique: true
  },
  supervisor_name: {
    type: String,
    required: true
  },
  supervisor_email: {
    type: String,
    required: true
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
  submitted_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Evaluation', evaluationSchema);
