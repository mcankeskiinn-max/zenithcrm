import { Router } from 'express';
import { getPreferences, updatePreferences } from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, updatePreferences);

export default router;
