
import { Router } from 'express';
import { uploadDocument, getDocuments, deleteDocument, downloadDocument } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Routes
router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.get('/download/:id', authenticate, downloadDocument);
router.get('/:saleId', authenticate, getDocuments);
router.delete('/:id', authenticate, deleteDocument);

export default router;
