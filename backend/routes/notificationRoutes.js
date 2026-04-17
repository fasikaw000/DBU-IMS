import express from 'express';
import { 
  createNotification, 
  getUserNotifications, 
  markAsRead 
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Admin can manually create notifications
router.post('/', authorize('college_admin'), createNotification);

// User fetches their own notifications
router.get('/', getUserNotifications);

// User marks notification as read
router.put('/:id/read', markAsRead);

export default router;
