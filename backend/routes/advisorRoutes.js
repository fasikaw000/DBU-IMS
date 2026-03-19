import express from 'express';
import { getAssignedStudents, commentOnLogbook, gradeReport } from '../controllers/advisorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);
router.use(authorize('advisor'));

router.get('/students', getAssignedStudents);
router.put('/logbook/:id/comment', commentOnLogbook);
router.put('/report/:id/grade', gradeReport);

export default router;
