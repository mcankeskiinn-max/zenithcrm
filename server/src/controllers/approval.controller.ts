import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role, SaleStatus } from '../utils/constants';
import { NotificationService } from '../services/notification.service';
import { logAudit } from '../utils/audit.util';
import { canAccessSale } from '../utils/access.util';

const APPROVAL_PREFIX = 'Onay:';
const APPROVAL_MARKER = 'APPROVAL|';

type ApprovalType = 'CANCELLATION' | 'COMMISSION';

const parseApprovalDetails = (description?: string | null) => {
    if (!description) return null;
    const idx = description.indexOf(APPROVAL_MARKER);
    if (idx === -1) return null;
    const json = description.slice(idx + APPROVAL_MARKER.length).trim();
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
};

const buildApprovalDescription = (details: Record<string, any>) => {
    return [
        'Onay talebi otomatik olusturuldu.',
        `${APPROVAL_MARKER}${JSON.stringify(details)}`
    ].join('\n');
};

const resolveApprover = async (tenantId: string, branchId?: string) => {
    if (branchId) {
        const manager = await prisma.user.findFirst({
            where: { tenantId, branchId, role: Role.MANAGER, isActive: true }
        });
        if (manager) return manager;
    }
    return prisma.user.findFirst({
        where: { tenantId, role: Role.ADMIN, isActive: true }
    });
};

export const listApprovals = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const where: any = {
            tenantId: user.tenantId,
            isCompleted: false,
            title: { startsWith: APPROVAL_PREFIX }
        };
        if (user.role !== Role.ADMIN) {
            where.assignedToId = user.id;
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const mapped = tasks.map((task) => ({
            ...task,
            approval: parseApprovalDetails(task.description)
        }));

        res.json(mapped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch approvals' });
    }
};

export const requestApproval = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { type, saleId, policyNumber, reason, amount } = req.body as {
            type: ApprovalType;
            saleId?: string;
            policyNumber?: string;
            reason?: string;
            amount?: number;
        };

        if (!type || !['CANCELLATION', 'COMMISSION'].includes(type)) {
            return res.status(400).json({ error: 'Invalid approval request' });
        }

        if (!saleId && !policyNumber) {
            return res.status(400).json({ error: 'Sale reference required' });
        }

        const sale = await prisma.sale.findFirst({
            where: {
                tenantId: user.tenantId,
                ...(saleId ? { id: saleId } : { policyNumber: policyNumber })
            },
            include: { customer: true, policyType: true }
        });
        if (!sale) return res.status(404).json({ error: 'Sale not found' });

        if (!canAccessSale(user, { branchId: sale.branchId, employeeId: sale.employeeId })) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const approver = await resolveApprover(user.tenantId, sale.branchId);
        if (!approver) {
            return res.status(400).json({ error: 'No approver found' });
        }

        const details = {
            type,
            saleId: sale.id,
            policyNumber: sale.policyNumber,
            customerName: sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}`.trim() : null,
            requesterId: user.id,
            reason: reason || null,
            amount: typeof amount === 'number' ? amount : null
        };

        const title = `${APPROVAL_PREFIX} ${type} - ${sale.policyNumber || sale.id.slice(0, 8)}`;
        const task = await prisma.task.create({
            data: {
                title,
                description: buildApprovalDescription(details),
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                priority: 'HIGH',
                assignedToId: approver.id,
                tenantId: user.tenantId
            }
        });

        await NotificationService.create({
            tenantId: user.tenantId,
            userId: approver.id,
            type: 'SYSTEM_ALERT',
            title: 'Onay Bekleyen Islem',
            message: `${title} icin onay bekleniyor`,
            link: '/approvals',
            relatedId: task.id,
            relatedType: 'approval',
            priority: 'HIGH'
        });

        await logAudit({
            userId: user.id,
            action: 'CREATE',
            resource: 'Approval',
            resourceId: task.id,
            details,
            tenantId: user.tenantId
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to request approval' });
    }
};

export const approveRequest = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { id } = req.params;

        const task = await prisma.task.findFirst({
            where: { id, tenantId: user.tenantId }
        });
        if (!task) return res.status(404).json({ error: 'Approval not found' });

        if (user.role !== Role.ADMIN && task.assignedToId !== user.id) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const approval = parseApprovalDetails(task.description);
        if (approval?.type === 'CANCELLATION' && approval.saleId) {
            await prisma.sale.update({
                where: { id: approval.saleId },
                data: {
                    status: SaleStatus.CANCELLED,
                    cancelReason: approval.reason || 'Onay ile iptal',
                    amount: approval.amount ? Number(approval.amount) : undefined
                }
            });
        }

        const updated = await prisma.task.update({
            where: { id: task.id },
            data: { isCompleted: true }
        });

        await logAudit({
            userId: user.id,
            action: 'UPDATE',
            resource: 'Approval',
            resourceId: task.id,
            details: approval,
            tenantId: user.tenantId
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
};

export const rejectRequest = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { id } = req.params;

        const task = await prisma.task.findFirst({
            where: { id, tenantId: user.tenantId }
        });
        if (!task) return res.status(404).json({ error: 'Approval not found' });

        if (user.role !== Role.ADMIN && task.assignedToId !== user.id) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const approval = parseApprovalDetails(task.description);
        const updated = await prisma.task.update({
            where: { id: task.id },
            data: {
                isCompleted: true,
                description: `${task.description}\nREJECTED_BY:${user.id}`
            }
        });

        await logAudit({
            userId: user.id,
            action: 'UPDATE',
            resource: 'Approval',
            resourceId: task.id,
            details: approval,
            tenantId: user.tenantId
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
};
