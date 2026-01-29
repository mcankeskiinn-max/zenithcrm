
import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { scanPolicy } from '../controllers/ocr.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/ocr/scan
router.post('/scan', authenticate, upload.single('document'), scanPolicy);

export default router;
