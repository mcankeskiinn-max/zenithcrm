import { Request, Response } from 'express';
import prisma from '../prisma';
import { CommissionEngine } from '../services/commission.service';

const engine = new CommissionEngine();

export const calculateCommission = async (req: Request, res: Response) => {
    const { saleId } = req.params;
    try {
        const currentUser = req.user!;
        const sale = await prisma.sale.findFirst({
            where: { id: saleId, tenantId: currentUser.tenantId }
        });
        if (!sale) throw new Error('Sale not found');

        const amount = await engine.calculateAndLog(
            currentUser.tenantId,
            saleId,
            sale.amount.toNumber(),
            sale.branchId,
            sale.policyTypeId,
            sale.employeeId,
            sale.createdAt
        );
        res.json({ success: true, amount });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: message });
    }
};

export const simulateCommission = async (req: Request, res: Response) => {
    const { amount, branchId, policyTypeId, date } = req.body;
    try {
        const currentUser = req.user!;
        const result = await engine.simulate(
            currentUser.tenantId,
            Number(amount),
            branchId,
            policyTypeId,
            date ? new Date(date) : new Date()
        );
        res.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: message });
    }
};

export const createRule = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { name, branchId, policyTypeId, formula, validFrom, validTo, conditions } = req.body;

        const rule = await prisma.commissionRule.create({
            data: {
                name: name || `Rule - ${formula}`,
                branchId: branchId || null,
                policyTypeId: policyTypeId || null,
                formula,
                validFrom: new Date(validFrom),
                validTo: validTo ? new Date(validTo) : null,
                conditions: conditions || {},
                tenantId: currentUser.tenantId
            }
        });
        res.json(rule);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to create rule', details: message });
    }
};

export const getRules = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const rules = await prisma.commissionRule.findMany({
            where: { tenantId: currentUser.tenantId },
            include: {
                branch: { select: { name: true } },
                policyType: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};

export const deleteRule = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const currentUser = req.user!;
        const existing = await prisma.commissionRule.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Rule not found' });

        await prisma.commissionRule.delete({ where: { id } });
        res.json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete rule' });
    }
};
