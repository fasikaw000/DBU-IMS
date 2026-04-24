import express from 'express';
import { 
  submitLogbook, 
  getStudentLogbooks, 
  getAssignedStudentLogbooks,
  addLogbookComment
} from '../controllers/logbookController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student routes
router.post('/submit', authorize('Student'), submitLogbook);
router.get('/my-logbooks', authorize('Student'), getStudentLogbooks);

// Advisor routes
router.get('/assigned-logbooks', authorize('Advisor'), getAssignedStudentLogbooks);
router.post('/:id/comment', authorize('Advisor'), addLogbookComment);

export default router;
