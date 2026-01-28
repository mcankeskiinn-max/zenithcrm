import { Router } from 'express';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branch.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

// Everyone can list branches (for dropdowns etc)
router.get('/', getBranches);

// Only Admins can manage branches
router.post('/', authorize(Role.ADMIN), createBranch);
router.put('/:id', authorize(Role.ADMIN), updateBranch);
router.delete('/:id', authorize(Role.ADMIN), deleteBranch);

export default router;
