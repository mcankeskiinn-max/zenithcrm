import { Router } from 'express';
import {
    getMonthlyPerformance,
    getBranchComparison,
    getPolicyTypeDistribution,
    getEmployeePerformance,
    getTargetProgress,
    getYearlyPerformance
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.get('/monthly', authenticate, getMonthlyPerformance);
router.get('/branches', authenticate, authorize(Role.ADMIN), getBranchComparison);
router.get('/policy-distribution', authenticate, getPolicyTypeDistribution);
router.get('/performance', authenticate, authorize(Role.ADMIN), getEmployeePerformance);
router.get('/targets', authenticate, getTargetProgress);
router.get('/yearly', authenticate, getYearlyPerformance);

export default router;
