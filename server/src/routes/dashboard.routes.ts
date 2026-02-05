import { Router } from 'express';
import { getDashboardStats, setSalesTarget, getBranchKpi } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/branch-kpi', authorize(Role.ADMIN), getBranchKpi);
router.post('/targets', authorize(Role.ADMIN, Role.MANAGER), setSalesTarget);

export default router;
