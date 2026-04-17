import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  markMessageAsRead
} from '../controllers/messageController.js';

const router = express.Router();

router.use(protect); // any authenticated user

router.route('/')
  .post(sendMessage)
  .get(getMessages);

router.put('/:id/read', markMessageAsRead);

export default router;
