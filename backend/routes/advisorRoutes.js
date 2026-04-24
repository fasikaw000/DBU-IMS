import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getAssignedStudents,
  getAdvisorStats,
  getReportsByStudent,
  reviewReport,
  evaluateStudent
} from '../controllers/advisorController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Advisor'));

router.get('/students', getAssignedStudents);
router.get('/stats', getAdvisorStats);
router.get('/reports/:internshipId', getReportsByStudent);
router.put('/report/:reportId', reviewReport);
router.post('/internship/:internshipId/evaluate', evaluateStudent);

export default router;
