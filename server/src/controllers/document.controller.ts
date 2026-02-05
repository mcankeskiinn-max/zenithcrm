import { Request, Response } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import { canAccessSale } from '../utils/access.util';

const isAllowedSignature = (filePath: string, mimetype: string) => {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8);
        fs.readSync(fd, buffer, 0, 8, 0);
        fs.closeSync(fd);

        const pdf = buffer.slice(0, 5).toString('ascii') === '%PDF-';
        const png = buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
        const jpg = buffer.slice(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]));

        if (mimetype.includes('pdf')) return pdf;
        if (mimetype.includes('png')) return png;
        if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return jpg;
        return false;
    } catch {
        return false;
    }
};

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

        const currentUser = req.user!;
        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                tenantId: currentUser.tenantId
            },
            select: {
                id: true,
                branchId: true,
                employeeId: true
            }
        });

        if (!sale) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Sale not found' });
        }

        if (!canAccessSale(currentUser, sale)) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (!isAllowedSignature(req.file.path, req.file.mimetype)) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid file content' });
        }

        const uploadRoot = path.resolve(process.cwd(), 'uploads');
        const tenantDir = path.join(uploadRoot, currentUser.tenantId);
        if (!fs.existsSync(tenantDir)) {
            fs.mkdirSync(tenantDir, { recursive: true });
        }

        const finalPath = path.join(tenantDir, req.file.filename);
        fs.renameSync(req.file.path, finalPath);
        const storedPath = path.join(currentUser.tenantId, req.file.filename);

        console.log('[UPLOAD] Creating database record for:', req.file.originalname);
        const document = await prisma.document.create({
            data: {
                filename: req.file.originalname,
                path: storedPath,
                mimetype: req.file.mimetype,
                size: req.file.size,
                saleId,
                tenantId: currentUser.tenantId
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
            try {
                const tenantPath = path.join(process.cwd(), 'uploads', req.user?.tenantId || '', req.file.filename);
                if (fs.existsSync(tenantPath)) {
                    fs.unlinkSync(tenantPath);
                }
            } catch (unlinkError) {
                console.error('[UPLOAD] Failed to cleanup moved file after error:', unlinkError);
            }
        }
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: 'Failed to upload document: ' + message });
    }
};

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { saleId } = req.params;
        const currentUser = req.user!;
        const sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                tenantId: currentUser.tenantId
            },
            select: {
                id: true,
                branchId: true,
                employeeId: true
            }
        });

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        if (!canAccessSale(currentUser, sale)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const documents = await prisma.document.findMany({
            where: {
                saleId,
                tenantId: currentUser.tenantId
            },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json(documents);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

export const downloadDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user!;
        const document = await prisma.document.findFirst({
            where: {
                id,
                tenantId: currentUser.tenantId
            },
            include: {
                sale: {
                    select: {
                        id: true,
                        branchId: true,
                        employeeId: true
                    }
                }
            }
        });

        if (!document || !document.sale) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (!canAccessSale(currentUser, document.sale)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const uploadDir = path.resolve(process.cwd(), 'uploads');
        const filePath = path.join(uploadDir, document.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.setHeader('Content-Type', document.mimetype);
        res.setHeader('Content-Disposition', `inline; filename=\"${document.filename}\"`);
        return res.sendFile(filePath);
    } catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user!;
        const document = await prisma.document.findFirst({
            where: {
                id,
                tenantId: currentUser.tenantId
            },
            include: {
                sale: {
                    select: {
                        id: true,
                        branchId: true,
                        employeeId: true
                    }
                }
            }
        });

        if (!document || !document.sale) {
            return res.status(404).json({ error: 'Document not found' });
        }

        if (!canAccessSale(currentUser, document.sale)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
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
