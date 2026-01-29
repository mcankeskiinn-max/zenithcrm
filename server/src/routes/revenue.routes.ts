import { Router } from 'express';
import { RevenueController } from '../controllers/revenue.controller';
import { authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

// Tüm revenue endpoint'leri ADMIN veya MANAGER yetkisi gerektirmeli
router.get('/trends', authorize(Role.ADMIN, Role.MANAGER), RevenueController.getRevenueTrends);
router.get('/profitability', authorize(Role.ADMIN, Role.MANAGER), RevenueController.getCustomerProfitability);
router.get('/churn-risks', authorize(Role.ADMIN, Role.MANAGER), RevenueController.getChurnRisks);
router.get('/targets', authorize(Role.ADMIN, Role.MANAGER), RevenueController.getTargetRealization);

export default router;
