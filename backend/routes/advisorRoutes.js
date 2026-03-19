import express from 'express';
import { 
  getAssignedStudents, 
  commentOnLogbook, 
  gradeReport,
  getAdvisorInternships
} from '../controllers/advisorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.use(authorize('advisor'));

router.get('/students', getAssignedStudents);
router.get('/internships', getAdvisorInternships);
router.put('/logbook/:id/comment', commentOnLogbook);
router.put('/report/:id/grade', gradeReport);

export default router;
