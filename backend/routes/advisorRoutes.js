import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAssignedStudents,
  reviewReport,
  evaluateStudent
} from '../controllers/advisorController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('advisor'));

router.get('/students', getAssignedStudents);
router.put('/report/:reportId', reviewReport);
router.post('/internship/:internshipId/evaluate', evaluateStudent);

export default router;
