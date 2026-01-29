import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Endpoint to generate comparison PDF
// Protected by auth middleware
router.post('/compare/pdf', authorize(), QuoteController.compareQuotesPDF);

// Endpoint for bulk quote upload (OCR)
router.post('/upload', authorize(), upload.array('files', 5), QuoteController.bulkUploadQuotes);

export default router;
