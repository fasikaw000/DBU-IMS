import express from 'express';
import { addFeedback, getReportFeedback } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Advisor adds feedback
router.post('/add/:reportId', authorize('Advisor'), addFeedback);

// Student views feedback
router.get('/my-reports/:reportId', authorize('Student'), getReportFeedback);

export default router;
