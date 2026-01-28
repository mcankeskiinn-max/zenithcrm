import { Router } from 'express';
import { getPolicyTypes, createPolicyType, deletePolicyType, updatePolicyType } from '../controllers/policyType.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

router.get('/', getPolicyTypes);
router.post('/', authorize(Role.ADMIN), createPolicyType);
router.put('/:id', authorize(Role.ADMIN), updatePolicyType);
router.delete('/:id', authorize(Role.ADMIN), deletePolicyType);

export default router;
