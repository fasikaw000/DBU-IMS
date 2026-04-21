import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import imageUpload from '../middleware/imageUpload.js';
import { changeMyPassword, getMe, updateMe, uploadMyPhoto } from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);
router.post('/me/photo', imageUpload.single('photo'), uploadMyPhoto);
router.put('/me/password', changeMyPassword);

export default router;

