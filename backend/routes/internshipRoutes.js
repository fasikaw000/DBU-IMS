import express from 'express';
import { 
  applyInternship, 
  approveInternship, 
  rejectInternship, 
  getPendingInternships,
  assignAdvisor
} from '../controllers/internshipController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/internships/apply
// @desc    Allow student to submit internship details
// @access  Private (Student only)
router.post('/apply', protect, authorize('student'), applyInternship);

// @route   GET /api/internships/pending
// @desc    Get all pending internships
// @access  Private (Department Head only)
router.get('/pending', protect, authorize('department_head'), getPendingInternships);

// @route   PUT /api/internships/:id/approve
// @desc    Approve internship
// @access  Private (Department Head only)
router.put('/:id/approve', protect, authorize('department_head'), approveInternship);

// @route   PUT /api/internships/:id/reject
// @desc    Reject internship
// @access  Private (Department Head only)
router.put('/:id/reject', protect, authorize('department_head'), rejectInternship);

// @route   PUT /api/internships/:id/assign-advisor
// @desc    Assign advisor to internship
// @access  Private (Department Head only)
router.put('/:id/assign-advisor', protect, authorize('department_head'), assignAdvisor);

export default router;
