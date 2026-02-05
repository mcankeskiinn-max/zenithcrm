import { Request, Response } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import { Role } from '../utils/constants';

const canAccessSale = (user: NonNullable<Request['user']>, sale: { branchId: string; employeeId: string }) => {
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.MANAGER) {
        return Boolean(user.branchId) && sale.branchId === user.branchId;
    }
    return sale.employeeId === user.id;
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

        console.log('[UPLOAD] Creating database record for:', req.file.originalname);
        const document = await prisma.document.create({
            data: {
                filename: req.file.originalname,
                path: req.file.filename,
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
