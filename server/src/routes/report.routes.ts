import { Router } from 'express';
import { exportSalesToExcel } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

// Everyone authenticated can export (visibility filtered in controller)
router.get('/export/sales', exportSalesToExcel);

export default router;
