import { Router } from 'express';
import { getPayrollSummary, exportPayrollPDF } from '../controllers/payroll.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.get('/summary', authenticate, authorize(Role.ADMIN, Role.MANAGER), getPayrollSummary);
router.get('/export', authenticate, authorize(Role.ADMIN, Role.MANAGER), exportPayrollPDF);

export default router;
