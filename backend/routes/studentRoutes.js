import express from 'express';
import { applyForInternship, submitLogbook, submitReport, getMyLogbooks } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('student'));

router.post('/apply', applyForInternship);
router.route('/logbook')
    .post(submitLogbook)
    .get(getMyLogbooks);
router.post('/reports', submitReport);

export default router;
