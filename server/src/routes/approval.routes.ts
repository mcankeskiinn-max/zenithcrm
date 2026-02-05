import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listApprovals, requestApproval, approveRequest, rejectRequest } from '../controllers/approval.controller';

const router = Router();

router.use(authenticate);

router.get('/', listApprovals);
router.post('/request', requestApproval);
router.post('/:id/approve', approveRequest);
router.post('/:id/reject', rejectRequest);

export default router;
