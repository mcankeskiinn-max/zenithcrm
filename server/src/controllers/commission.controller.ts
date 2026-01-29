import { Request, Response } from 'express';
import prisma from '../prisma';
import { CommissionEngine } from '../services/commission.service';

const engine = new CommissionEngine();

export const calculateCommission = async (req: Request, res: Response) => {
    const { saleId } = req.params;
    try {
        const sale = await prisma.sale.findUnique({ where: { id: saleId } });
        if (!sale) throw new Error('Sale not found');

        const amount = await engine.calculateAndLog(
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
        const result = await engine.simulate(
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
        const { name, branchId, policyTypeId, formula, validFrom, validTo, conditions } = req.body;

        const rule = await prisma.commissionRule.create({
            data: {
                name: name || `Rule - ${formula}`,
                branchId: branchId || null,
                policyTypeId: policyTypeId || null,
                formula,
                validFrom: new Date(validFrom),
                validTo: validTo ? new Date(validTo) : null,
                conditions: conditions || {}
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
        const rules = await prisma.commissionRule.findMany({
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
        await prisma.commissionRule.delete({ where: { id } });
        res.json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete rule' });
    }
};
