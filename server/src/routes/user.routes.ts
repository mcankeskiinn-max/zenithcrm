import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

// List users: Admin sees all, Managers see their branch
router.get('/', authorize(Role.ADMIN, Role.MANAGER), getUsers);

// Create user: Admin or Manager
router.post('/', authorize(Role.ADMIN, Role.MANAGER), createUser);

// Update/Delete: Admin only
router.put('/:id', authorize(Role.ADMIN), updateUser);
router.delete('/:id', authorize(Role.ADMIN), deleteUser);

export default router;
