import express from 'express';
import { 
  submitEvaluation, 
  getInternshipEvaluation, 
  getAllEvaluations 
} from '../controllers/evaluationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Supervisor route to submit
router.post('/submit', authorize('supervisor'), submitEvaluation);

// Advisor/Admin route to view evaluation for a specific internship
router.get('/internship/:id', authorize('advisor', 'admin'), getInternshipEvaluation);

// Admin route to view all evaluations
router.get('/all', authorize('admin'), getAllEvaluations);

export default router;
