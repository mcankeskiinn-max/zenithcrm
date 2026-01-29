import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role, SaleStatus } from '../utils/constants';
import { logAudit } from '../utils/audit.util';
import { CommissionEngine } from '../services/commission.service';

const commissionEngine = new CommissionEngine();

// Helper to determine commission amount based on rules
const determineCommission = async (saleId: string, amount: number, branchId: string, policyTypeId: string, employeeId: string, createdAt: Date = new Date()) => {
    return commissionEngine.calculateAndLog(saleId, amount, branchId, policyTypeId, employeeId, createdAt);
};

// List sales
export const getSales = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const isAdmin = user.role === Role.ADMIN;
        const isManager = user.role === Role.MANAGER;

        const { branchId, policyTypeId } = req.query;

        const where: { branchId?: string; policyTypeId?: string; employeeId?: string } = {};
        if (branchId && typeof branchId === 'string' && branchId.length > 10) where.branchId = branchId;
        if (policyTypeId && typeof policyTypeId === 'string' && policyTypeId.length > 10) where.policyTypeId = policyTypeId;

        // Branch Manager/Employee restriction: only their own branch
        if (!isAdmin) {
            if (isManager || user.role === Role.EMPLOYEE) {
                if (user.branchId) {
                    where.branchId = user.branchId;
                } else if (user.role === Role.EMPLOYEE) {
                    // Employees without branch see only their own
                    where.employeeId = user.id;
                }
            }

            // Employee restriction: only their own sales
            if (user.role === Role.EMPLOYEE) {
                where.employeeId = user.id;
            }
        }

        const sales = await prisma.sale.findMany({
            where,
            include: {
                employee: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
                policyType: { select: { id: true, name: true } },
                customer: { select: { id: true, name: true, phone: true, email: true } },
                _count: {
                    select: { documents: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create a new sale
export const createSale = async (req: Request, res: Response) => {
    const { amount, policyNumber, customerName, customerPhone, customerEmail, branchId, policyTypeId, employeeId, status, cancelReason, customerId } = req.body;
    const currentUser = req.user!;

    // Default to logged-in user
    let sellerId = currentUser.id;
    let sellerBranchId = currentUser.branchId;

    if (employeeId) {
        sellerId = employeeId;
    }

    try {
        // Enforce branch for non-admins
        let targetBranchId = branchId || sellerBranchId;

        if (currentUser.role === Role.MANAGER || currentUser.role === Role.EMPLOYEE) {
            targetBranchId = currentUser.branchId;
        }

        if (!targetBranchId) {
            return res.status(400).json({ error: 'Satışın hangi şubeye ait olduğu belirtilmelidir.' });
        }

        if (!policyTypeId) {
            return res.status(400).json({ error: 'Poliçe tipi (Branş) seçilmelidir.' });
        }

        // Create or find customer
        let finalCustomerId = customerId;

        if (!finalCustomerId && customerName) {
            // Check if customer exists
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    name: customerName,
                    OR: [
                        { email: customerEmail || undefined },
                        { phone: customerPhone || undefined }
                    ]
                }
            });

            if (existingCustomer) {
                finalCustomerId = existingCustomer.id;
            } else {
                const newCustomer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone
                    }
                });
                finalCustomerId = newCustomer.id;
            }
        }

        if (!finalCustomerId) {
            return res.status(400).json({ error: 'Müşteri bilgisi (ID veya isim) gereklidir.' });
        }

        // Automatic Date Calculation for Renewals
        const sDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
        const eDate = req.body.endDate ? new Date(req.body.endDate) : new Date(sDate.getTime() + 365 * 24 * 60 * 60 * 1000);

        const saleData: {
            customerId: string;
            customerName: string;
            customerPhone?: string | null;
            customerEmail?: string | null;
            amount: number;
            status: SaleStatus;
            employeeId: string;
            branchId: string;
            policyTypeId: string;
            cancelReason: string | null;
            startDate: Date;
            endDate: Date;
            saleDate: Date;
        } = {
            customerId: finalCustomerId,
            customerName: customerName || (await prisma.customer.findUnique({ where: { id: finalCustomerId } }))?.name || 'Unknown',
            customerPhone: customerPhone || null,
            customerEmail: customerEmail || null,
            amount: Number(amount),
            status: (status as SaleStatus) || 'ACTIVE',
            employeeId: sellerId,
            branchId: targetBranchId,
            policyTypeId,
            cancelReason: cancelReason || null,
            startDate: sDate,
            endDate: eDate,
            saleDate: req.body.saleDate ? new Date(req.body.saleDate) : new Date()
        };

        let sale;
        const targetPolicyNumber = policyNumber && policyNumber.trim() !== "" ? policyNumber.trim() : null;

        if (targetPolicyNumber) {
            // Check if policy number already exists to avoid P2002 error
            const existingSale = await prisma.sale.findUnique({ where: { policyNumber: targetPolicyNumber } });
            if (existingSale) {
                // Update existing record
                sale = await prisma.sale.update({
                    where: { id: existingSale.id },
                    data: saleData
                });
            } else {
                // Create new record with policy number
                sale = await prisma.sale.create({
                    data: { ...saleData, policyNumber: targetPolicyNumber }
                });
            }
        } else {
            // Create new record without policy number (Prisma will use null)
            sale = await prisma.sale.create({
                data: saleData
            });
        }

        // 2. Calculate and Log Commission (Dynamic logic)
        const saleAmount = typeof sale.amount === 'number' ? sale.amount : Number(sale.amount);
        const commissionAmount = await determineCommission(sale.id, saleAmount, sale.branchId, sale.policyTypeId, sale.employeeId);

        // 3. Audit Log
        await logAudit({
            userId: currentUser.id,
            action: 'CREATE',
            resource: 'Sale',
            resourceId: sale.id,
            details: { amount, customerName, policyNumber }
        });

        res.status(201).json({ ...sale, commission: commissionAmount });
    } catch (error: unknown) {
        console.error('[CreateSale] Critical Failure:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        const code = (error as any)?.code;
        res.status(500).json({
            error: 'Failed to create sale',
            details: message,
            code
        });
    }
};

// Update sale
export const updateSale = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { customerName, customerPhone, customerEmail, policyNumber, amount, employeeId, branchId, policyTypeId, status, cancelReason, customerId } = req.body;
    const currentUser = req.user!;

    try {
        const updateData: {
            policyNumber?: string;
            amount?: number;
            employeeId?: string;
            policyTypeId?: string;
            status?: SaleStatus;
            cancelReason?: string | null;
            customerId?: string;
            branchId?: string;
        } = {};

        if (customerName !== undefined) {
            // For now, allow updating the customer record linked to this sale
            // but in a more robust system, we might just link to a different CustomerId
            const sale = await prisma.sale.findUnique({ where: { id }, include: { customer: true } });
            if (sale?.customerId) {
                await prisma.customer.update({
                    where: { id: sale.customerId },
                    data: {
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone
                    }
                });
            }
        }
        if (policyNumber !== undefined) updateData.policyNumber = policyNumber;
        if (amount !== undefined) updateData.amount = Number(amount);
        if (employeeId) updateData.employeeId = employeeId;
        if (policyTypeId) updateData.policyTypeId = policyTypeId;
        if (status !== undefined) updateData.status = status as SaleStatus;
        if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
        if (customerId) updateData.customerId = customerId;

        // Restriction: Non-admins cannot change branch
        if (currentUser.role === Role.ADMIN) {
            if (branchId) updateData.branchId = branchId;
        }

        // Restriction: Non-admins can only update sales in their own branch
        const existingSale = await prisma.sale.findUnique({ where: { id } });
        if (!existingSale) return res.status(404).json({ error: 'Sale not found' });

        if (currentUser.role !== Role.ADMIN && existingSale.branchId !== currentUser.branchId) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (Farklı şube).' });
        }

        const sale = await prisma.sale.update({
            where: { id },
            data: updateData
        });

        // RECALCULATE COMMISSION ON UPDATE
        const commissionAmount = await determineCommission(sale.id, Number(sale.amount), sale.branchId, sale.policyTypeId, sale.employeeId);

        // Audit Log
        await logAudit({
            userId: currentUser.id,
            action: 'UPDATE',
            resource: 'Sale',
            resourceId: id,
            details: { updates: updateData }
        });

        res.json({ ...sale, commission: commissionAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update sale' });
    }
};

// Delete sale
export const deleteSale = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // First delete related commission logs (Foreign key constraint)
        await prisma.commissionLog.deleteMany({
            where: { saleId: id }
        });

        // Check permissions
        const currentUser = req.user!;
        const existingSale = await prisma.sale.findUnique({ where: { id } });

        if (!existingSale) return res.status(404).json({ error: 'Sale not found' });

        if (currentUser.role !== Role.ADMIN) {
            if (currentUser.role === Role.MANAGER) {
                if (existingSale.branchId !== currentUser.branchId) {
                    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok (Farklı şube).' });
                }
            } else {
                return res.status(403).json({ error: 'Satış silme yetkiniz bulunmamaktadır.' });
            }
        }

        // Then delete the sale
        await prisma.sale.delete({
            where: { id }
        });

        // Audit Log
        await logAudit({
            userId: currentUser.id,
            action: 'DELETE',
            resource: 'Sale',
            resourceId: id
        });

        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete sale' });
    }
};
