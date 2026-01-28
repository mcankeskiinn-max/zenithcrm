import { Router } from 'express';
import { calculateCommission, createRule, getRules, deleteRule, simulateCommission } from '../controllers/commission.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

// Admin only for management
router.post('/rules', authorize(Role.ADMIN), createRule);
router.get('/rules', authorize(Role.ADMIN, Role.MANAGER), getRules);
router.delete('/rules/:id', authorize(Role.ADMIN), deleteRule);

// Simulation & Calculation
router.post('/simulate', authorize(Role.ADMIN, Role.MANAGER), simulateCommission);
router.post('/calculate/:saleId', authorize(Role.ADMIN), calculateCommission);

export default router;
