import { Router } from 'express';
import { getMonthlyPerformance, getBranchComparison } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.get('/monthly', authenticate, getMonthlyPerformance);
router.get('/branches', authenticate, authorize(Role.ADMIN), getBranchComparison);

export default router;
