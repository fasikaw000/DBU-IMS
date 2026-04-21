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
router.post('/upload', authorize('Student'), upload.single('file'), uploadReport);
router.get('/my-reports', authorize('Student'), getStudentReports);

// Advisor routes
router.get('/advisor-reports', authorize('Advisor'), getAdvisorReports);
router.put('/:id/approve', authorize('Advisor'), approveReport);
router.put('/:id/reject', authorize('Advisor'), rejectReport);

export default router;
