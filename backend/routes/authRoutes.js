import express from 'express';
import {
  loginUser,
  activateAccount,
  forgotPassword,
  resetPassword,
  logoutUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.post('/activate', activateAccount);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
