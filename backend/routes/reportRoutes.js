import express from 'express';
import { 
  uploadReport, 
  getStudentReports, 
  getAdvisorReports, 
  approveReport, 
  rejectReport,
  upload 
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student routes
router.post('/upload', authorize('student'), upload.single('file'), uploadReport);
router.get('/my-reports', authorize('student'), getStudentReports);

// Advisor routes
router.get('/advisor-reports', authorize('advisor'), getAdvisorReports);
router.put('/:id/approve', authorize('advisor'), approveReport);
router.put('/:id/reject', authorize('advisor'), rejectReport);

export default router;
