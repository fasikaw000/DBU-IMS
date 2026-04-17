import Evaluation from '../models/Evaluation.js';
import Internship from '../models/Internship.js';
import { notify } from './notificationController.js';

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
// @access  Private/College Admin
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
