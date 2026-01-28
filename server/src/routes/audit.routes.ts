import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.MANAGER));

router.get('/', getAuditLogs);

export default router;
