
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.get('/:saleId', authenticate, getDocuments);
router.delete('/:id', authenticate, deleteDocument);

export default router;
