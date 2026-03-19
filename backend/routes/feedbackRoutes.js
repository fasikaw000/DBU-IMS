import express from 'express';
import { addFeedback, getReportFeedback } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Advisor adds feedback
router.post('/add/:reportId', authorize('advisor'), addFeedback);

// Student views feedback
router.get('/my-reports/:reportId', authorize('student'), getReportFeedback);

export default router;
