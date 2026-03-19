import express from 'express';
import { provisionStaff, getUsers } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are strictly protected and only for Dean 
router.use(protect);
router.use(authorize('dean'));

router.post('/provision', provisionStaff);
router.route('/users').get(getUsers);

export default router;
