import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import imageUpload from '../middleware/imageUpload.js';
import {
  changeMyPassword,
  getMe,
  updateMe,
  uploadMyPhoto,
  verifyEmailChange,
  getMyStudentProfile,
  updateMyCbeAccount
} from '../controllers/userController.js';

const router = express.Router();

router.get('/verify-email/:token', verifyEmailChange);

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.post('/me/photo', imageUpload.single('photo'), uploadMyPhoto);
router.put('/me/password', changeMyPassword);
router.get('/me/student-profile', getMyStudentProfile);
router.put('/me/student-profile/cbe', updateMyCbeAccount);

export default router;

