import express from 'express';
import { applyInternship } from '../controllers/internshipController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/internships/apply
// @desc    Allow student to submit internship details
// @access  Private (Student only)
router.post('/apply', protect, authorize('student'), applyInternship);

export default router;
