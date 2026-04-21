import express from 'express';
import {
  applyInternship,
  approveInternship,
  rejectInternship,
  getPendingInternships,
  assignAdvisor,
  getStudentInternship,
  uploadEvaluation
} from '../controllers/internshipController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route   POST /api/internships/apply
// @desc    Allow student to submit internship details
// @access  Private (Student only)
router.post('/apply', protect, authorize('Student'), applyInternship);

// @route   GET /api/internships/pending
// @desc    Get all pending internships
// @access  Private (Department Head only)
router.get('/pending', protect, authorize('Dean'), getPendingInternships);

// @route   PUT /api/internships/:id/approve
// @desc    Approve internship
// @access  Private (Department Head only)
router.put('/:id/approve', protect, authorize('Dean'), approveInternship);
router.put('/:id/reject', protect, authorize('Dean'), rejectInternship);
router.put('/:id/assign-advisor', protect, authorize('Dean'), assignAdvisor);

// @route   GET /api/internships/my-internship
// @desc    Get logged-in student's internship
// @access  Private (Student only)
router.get('/my-internship', protect, authorize('Student'), getStudentInternship);

// @route   POST /api/internships/upload-evaluation
// @access  Private (Student)
router.post('/upload-evaluation', protect, authorize('Student'), upload.single('evaluation'), uploadEvaluation);

export default router;
