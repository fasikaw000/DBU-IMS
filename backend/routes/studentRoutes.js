import express from 'express';
import {
    applyForInternship,
    submitLogbook,
    submitReport,
    getMyLogbooks,
    getMyReports,
    getMyActivity,
    updateProfile
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Student'));

router.post('/apply', applyForInternship);

router.route('/logbook')
    .post(submitLogbook)
    .get(getMyLogbooks);

router.route('/reports')
    .post(upload.single('file'), submitReport)
    .get(getMyReports);

router.get('/activity', getMyActivity);
router.put('/profile', updateProfile);

export default router;
