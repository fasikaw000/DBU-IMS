import express from 'express';
import { provisionStaff, getUsers, seedValidIds, getAnalytics } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are strictly protected 
router.use(protect);

// Users route is accessible by dept heads too (to find advisors)
router.get('/users', authorize('college_head', 'admin', 'department_head'), getUsers);

// Provisioning and Seeding only for High-level admins
router.use(authorize('college_head', 'admin'));

router.post('/provision', provisionStaff);
router.post('/seed-ids', seedValidIds);
router.route('/users').get(getUsers);
router.get('/analytics', getAnalytics);

export default router;
