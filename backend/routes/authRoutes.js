import express from 'express';
import { registerUser, registerStudent, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/register-student', registerStudent);
router.post('/login', loginUser);

export default router;
