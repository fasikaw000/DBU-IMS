import express from 'express';
import { 
  submitLogbook, 
  getStudentLogbooks, 
  getAssignedStudentLogbooks 
} from '../controllers/logbookController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student routes
router.post('/submit', authorize('student'), submitLogbook);
router.get('/my-logbooks', authorize('student'), getStudentLogbooks);

// Advisor routes
router.get('/assigned-logbooks', authorize('advisor'), getAssignedStudentLogbooks);

export default router;
