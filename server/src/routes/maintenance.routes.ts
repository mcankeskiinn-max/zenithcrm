import { Router } from 'express';
import { cleanupTestData, sentryTest } from '../controllers/maintenance.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.post('/cleanup-test-data', cleanupTestData);
router.get('/sentry-test', sentryTest);

export default router;
