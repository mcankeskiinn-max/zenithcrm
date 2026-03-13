import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';
import { applySaleScope, canAccessCustomerBySales } from '../utils/access.util';
import { getNaceAccountSuggestions } from '../services/nace-account-suggestion.service';

const normalizeNaceCode = (value?: string | null): string | null => {
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length < 4) return null;
    const normalized = digits.length >= 6 ? digits.slice(0, 6) : digits.padEnd(6, '0');
    return `${normalized.slice(0, 2)}.${normalized.slice(2, 4)}.${normalized.slice(4, 6)}`;
};

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { search } = req.query;
        const where: any = {
            tenantId: currentUser.tenantId
        };

        if (currentUser.role !== Role.ADMIN) {
            const saleScope: any = {};
            applySaleScope(saleScope, currentUser);
            where.sales = { some: saleScope };
        }

        if (search && typeof search === 'string') {
            const searchClause = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { identityNo: { contains: search, mode: 'insensitive' } },
                { naceCode: { contains: search, mode: 'insensitive' } }
            ];
            if (where.sales) {
                where.AND = [{ sales: where.sales }, { OR: searchClause }];
                delete where.sales;
            } else {
                where.OR = searchClause;
            }
        }

        const customers = await prisma.customer.findMany({
            where,
            include: {
                _count: {
                    select: { sales: true }
                }
            },
            orderBy: { firstName: 'asc' }
        });

        const mappedCustomers = customers.map((c) => ({
            ...c,
            name: `${c.firstName} ${c.lastName}`.trim(),
            identityNumber: c.identityNo,
            naceCode: c.naceCode
        }));

        res.json(mappedCustomers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getCustomerProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user!;
    try {
        const customer = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId },
            include: {
                sales: {
                    include: {
                        policyType: true,
                        employee: { select: { name: true } }
                    },
                    orderBy: { saleDate: 'desc' }
                },
                documents: true,
                tasks: {
                    include: { assignedTo: { select: { name: true } } },
                    orderBy: { dueDate: 'asc' }
                },
                _count: {
                    select: {
                        sales: true,
                        documents: true,
                        tasks: true
                    }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Musteri bulunamadi.' });
        }

        if (currentUser.role !== Role.ADMIN) {
            const sales = (customer.sales || []).map((s) => ({ branchId: s.branchId, employeeId: s.employeeId }));
            if (sales.length === 0 || !canAccessCustomerBySales(currentUser, sales)) {
                return res.status(403).json({ error: 'Bu musteri bilgilerini goruntuleme yetkiniz yok.' });
            }
        }

        const score = Math.min((customer.sales?.length || 0) * 10, 100);

        const responseData = {
            ...customer,
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Isimsiz Musteri',
            identityNumber: customer.identityNo || null,
            naceCode: customer.naceCode || null,
            accountSuggestions: getNaceAccountSuggestions(customer.naceCode),
            loyaltyScore: score,
            _count: {
                sales: customer.sales?.length || 0,
                documents: customer.documents?.length || 0,
                tasks: customer.tasks?.length || 0
            }
        };

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getCustomerAccountSuggestions = async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user!;
    try {
        const customer = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId },
            select: { id: true, firstName: true, lastName: true, naceCode: true }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Musteri bulunamadi.' });
        }

        return res.json({
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`.trim(),
            naceCode: customer.naceCode || null,
            suggestions: getNaceAccountSuggestions(customer.naceCode)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    const { name, email, phone, identityNumber, naceCode, address, notes } = req.body;
    const currentUser = req.user!;

    const nameParts = name ? name.split(' ') : [''];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
        const customer = await prisma.customer.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                identityNo: identityNumber,
                naceCode: normalizeNaceCode(naceCode),
                address,
                notes,
                tenantId: currentUser.tenantId
            }
        });
        res.status(201).json(customer);
    } catch (error: unknown) {
        if ((error as any).code === 'P2002') {
            return res.status(400).json({ error: 'Bu TCKN ile kayitli baska bir musteri bulunmaktadir.' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, identityNumber, naceCode, ...otherData } = req.body;
    const currentUser = req.user!;
    try {
        const existing = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Musteri bulunamadi.' });

        const updateData: any = { ...otherData };

        if (name) {
            const nameParts = name.split(' ');
            updateData.firstName = nameParts[0];
            updateData.lastName = nameParts.slice(1).join(' ') || '';
        }

        if (identityNumber) {
            updateData.identityNo = identityNumber;
        }
        if (typeof naceCode !== 'undefined') {
            updateData.naceCode = normalizeNaceCode(naceCode);
        }

        const result = await prisma.customer.updateMany({
            where: { id, tenantId: currentUser.tenantId },
            data: updateData
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Musteri bulunamadi.' });
        }

        const customer = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user!;
    try {
        const customer = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId },
            include: {
                _count: {
                    select: { sales: true }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Musteri bulunamadi.' });
        }

        if (customer._count.sales > 0 && currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGER) {
            return res.status(400).json({ error: 'Satis kaydi bulunan musteriler sadece yonetici tarafindan silinebilir.' });
        }

        const result = await prisma.customer.deleteMany({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Musteri bulunamadi.' });
        }

        res.json({ message: 'Musteri basariyla silindi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
