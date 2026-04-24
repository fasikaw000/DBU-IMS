import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  markMessageAsRead,
  getContacts,
  getConversation,
  markConversationAsRead
} from '../controllers/messageController.js';

const router = express.Router();

router.use(protect); // any authenticated user

router.route('/')
  .post(sendMessage)
  .get(getMessages);

router.get('/contacts', getContacts);
router.get('/conversation/:userId', getConversation);
router.put('/conversation/:userId/read', markConversationAsRead);
router.put('/:id/read', markMessageAsRead);

export default router;
