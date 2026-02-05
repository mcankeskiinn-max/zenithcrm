import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';
import { logoutAllSessions, listSessions } from '../controllers/session.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(Role.ADMIN));

router.get('/', listSessions);
router.post('/logout-all', logoutAllSessions);

export default router;
