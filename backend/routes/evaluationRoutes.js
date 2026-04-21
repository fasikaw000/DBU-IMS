import express from 'express';
import {
  getInternshipEvaluation,
  getAllEvaluations
} from '../controllers/evaluationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Advisor/Admin route to view evaluation for a specific internship
router.get('/internship/:id', authorize('Advisor', 'Admin'), getInternshipEvaluation);

// Admin route to view all evaluations
router.get('/all', authorize('Admin'), getAllEvaluations);

export default router;
