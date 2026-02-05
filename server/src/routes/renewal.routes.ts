import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getRenewals, createRenewalTask } from '../controllers/renewal.controller';

const router = Router();

router.use(authenticate);

router.get('/', getRenewals);
router.post('/:saleId/task', createRenewalTask);

export default router;
