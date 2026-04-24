import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
  sendCommunication, 
  getMyAnnouncements 
} from '../controllers/communicationController.js';

const router = express.Router();

router.use(protect);

router.get('/announcements', getMyAnnouncements);
router.post('/send', authorize('Admin', 'Dean'), sendCommunication);

export default router;
