import { Router } from 'express';
import { exportSalesToExcel, exportCustomerPDF } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

// Everyone authenticated can export (visibility filtered in controller)
router.get('/export/sales', exportSalesToExcel);
router.get('/export/customer/:id/pdf', exportCustomerPDF);

export default router;
