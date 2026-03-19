import Evaluation from '../models/Evaluation.js';
import Internship from '../models/Internship.js';
import { notify } from './notificationController.js';

// @desc    Submit evaluation for an internship
// @route   POST /api/evaluations/submit
// @access  Private/Supervisor
export const submitEvaluation = async (req, res) => {
  try {
    const { internship_id, company_rating, skills_rating, comments } = req.body;

    // 1. Verify internship exists
    const internship = await Internship.findById(internship_id);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // 2. Check if already evaluated
    const existingEvaluation = await Evaluation.findOne({ internship_id });
    if (existingEvaluation) {
      return res.status(400).json({ success: false, message: 'This internship has already been evaluated' });
    }

    // 3. Create evaluation
    // We use req.user info (Supervisor info)
    const evaluation = await Evaluation.create({
      internship_id,
      supervisor_name: req.user.name,
      supervisor_email: req.user.email,
      company_rating,
      skills_rating,
      comments
    });

    // Notify student & advisor
    const populatedInternship = await internship.populate('student');
    if (populatedInternship.student && populatedInternship.student.user) {
        await notify(
            populatedInternship.student.user, 
            'evaluation_submitted', 
            `Company supervisor ${req.user.name} has submitted your evaluation.`,
            `/internships/${internship._id}`
        );
    }
    if (internship.advisor_id) {
        await notify(
            internship.advisor_id, 
            'evaluation_submitted', 
            `Evaluation submitted for student ${populatedInternship.student?.name || 'assigned to you'} by ${req.user.name}.`,
            `/api/evaluations/internship/${internship._id}`
        );
    }

    res.status(201).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: evaluation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get evaluation for a specific internship
// @route   GET /api/evaluations/internship/:id
// @access  Private/Advisor/Admin
export const getInternshipEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({ internship_id: req.params.id });

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found for this internship' });
    }

    // Authorization check for advisor
    if (req.user.role === 'advisor') {
      const internship = await Internship.findById(req.params.id);
      if (!internship || internship.advisor_id?.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized: This student is not assigned to you' });
      }
    }

    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get all evaluations
// @route   GET /api/evaluations/all
// @access  Private/Admin
export const getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate({
        path: 'internship_id',
        populate: { path: 'student' }
      })
      .sort({ submitted_at: -1 });

    res.status(200).json({ success: true, count: evaluations.length, data: evaluations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
