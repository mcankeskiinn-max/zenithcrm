import { Request, Response } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        console.log('[UPLOAD] Initializing upload for saleId:', req.body?.saleId);

        if (!req.file) {
            console.error('[UPLOAD] No file received by multer');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { saleId } = req.body;
        if (!saleId) {
            console.error('[UPLOAD] saleId missing in request body');
            // Clean up file if no saleId
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Sale ID is required' });
        }

        console.log('[UPLOAD] Creating database record for:', req.file.originalname);
        const document = await prisma.document.create({
            data: {
                filename: req.file.originalname,
                path: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                saleId
            }
        });

        console.log('[UPLOAD] Success:', document.id);
        res.status(201).json(document);
    } catch (error: unknown) {
        console.error('[UPLOAD] Critical error:', error);
        // Clean up file on error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('[UPLOAD] Failed to cleanup file after error:', unlinkError);
            }
        }
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to upload document: ' + message });
    }
};

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { saleId } = req.params;
        const documents = await prisma.document.findMany({
            where: { saleId },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json(documents);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const document = await prisma.document.findUnique({
            where: { id }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete from file system
        const uploadDir = path.resolve(process.cwd(), 'uploads');
        const filePath = path.join(uploadDir, document.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from DB
        await prisma.document.delete({
            where: { id }
        });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};
