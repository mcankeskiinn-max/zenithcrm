import prisma from '../prisma';
import { Sale, CommissionRule } from '@prisma/client';
// @ts-ignore
// import { evaluate } from 'mathjs';

interface CommissionResult {
    ruleId: string;
    ruleName: string;
    amount: number;
}

export class CommissionEngine {

    /**
     * Calculate commission for a given sale and LOG it.
     */
    async calculateAndLog(saleId: string, amount: number, branchId: string, policyTypeId: string, employeeId: string, createdAt: Date = new Date()): Promise<number> {
        const result = await this.evaluate(amount, branchId, policyTypeId, createdAt);

        if (result.amount > 0) {
            // Using delete and create to avoid unique constraint issues if id was manually set before
            await prisma.commissionLog.deleteMany({ where: { saleId } });
            await prisma.commissionLog.create({
                data: {
                    saleId,
                    amount: Number(result.amount),
                    employeeId
                }
            });
        } else {
            await prisma.commissionLog.deleteMany({ where: { saleId } });
        }

        return result.amount;
    }

    /**
     * Simulate commission calculation without side effects.
     */
    async simulate(amount: number, branchId: string, policyTypeId: string, date: Date = new Date()): Promise<any> {
        return this.evaluate(amount, branchId, policyTypeId, date);
    }

    /**
     * Internal logic to find rule and calculate amount.
     */
    private async evaluate(amount: number, branchId: string, policyTypeId: string, dateInput: Date): Promise<{ amount: number, ruleId?: string, ruleName?: string, source: 'RULE' | 'BRANCH' | 'NONE' }> {
        // Normalize date to handle day-based logic without time issues
        const date = new Date(dateInput);
        date.setHours(0, 0, 0, 0);

        // 1. Fetch all potentially matching rules
        // We'll filter and sort them in memory to ensure strict priority
        const potentialRules = await prisma.commissionRule.findMany({
            where: {
                AND: [
                    { validFrom: { lte: new Date(dateInput.getTime() + 24 * 60 * 60 * 1000) } }, // Broad check
                    { OR: [{ validTo: null }, { validTo: { gte: date } }] },
                    { isActive: true }
                ]
            },
            include: {
                policyType: true,
                branch: true
            }
        });

        // 2. Filter rules that strictly match the criteria
        const matchingRules = potentialRules.filter(rule => {
            // Check dates strictly (ignoring time for start/end if they are day-based)
            const from = new Date(rule.validFrom);
            from.setHours(0, 0, 0, 0);
            if (from > date) return false;

            if (rule.validTo) {
                const to = new Date(rule.validTo);
                to.setHours(23, 59, 59, 999);
                if (to < date) return false;
            }

            // Check targeting
            const branchMatches = !rule.branchId || rule.branchId === branchId;
            const policyTypeMatches = !rule.policyTypeId || rule.policyTypeId === policyTypeId;

            return branchMatches && policyTypeMatches;
        });

        // 3. Sort by specificity
        // Priority: (Branch AND PolicyType) > (PolicyType Only) > (Branch Only) > Global
        matchingRules.sort((a, b) => {
            const scoreA = (a.branchId ? 2 : 0) + (a.policyTypeId ? 1 : 0);
            const scoreB = (b.branchId ? 2 : 0) + (b.policyTypeId ? 1 : 0);

            if (scoreA !== scoreB) return scoreB - scoreA;

            // Latest created rule wins for same specificity level
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (matchingRules.length > 0) {
            const rule = matchingRules[0];
            const commissionAmount = this.calculateFromFormula(amount, rule.formula);
            return { amount: commissionAmount, ruleId: rule.id, ruleName: rule.name, source: 'RULE' };
        }

        // 4. Fallback to branch settings
        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (branch && branch.settings) {
            try {
                const settings = typeof branch.settings === 'string' ? JSON.parse(branch.settings) : branch.settings;
                if (settings && (settings.commissionRate || settings.commissionRate === 0)) {
                    return { amount: amount * settings.commissionRate, source: 'BRANCH' };
                }
            } catch (e) {
                // Settings parsing failure handled silently
            }
        }

        return { amount: 0, source: 'NONE' };
    }

    private calculateFromFormula(amount: number, formula: string): number {
        const cleanFormula = formula.trim().toLowerCase();

        if (cleanFormula.startsWith('ratio:')) {
            const ratio = parseFloat(cleanFormula.replace('ratio:', ''));
            return isNaN(ratio) ? 0 : amount * ratio;
        }

        if (cleanFormula.startsWith('raw:')) {
            const raw = parseFloat(cleanFormula.replace('raw:', ''));
            return isNaN(raw) ? 0 : raw;
        }

        // Default legacy fallback: if it's a small number assume ratio, if large assume raw
        const val = parseFloat(cleanFormula);
        if (isNaN(val)) return 0;

        if (val < 1) {
            return amount * val;
        } else {
            return val;
        }
    }
}
