import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';
import { applySaleScope, canAccessCustomerBySales } from '../utils/access.util';

// List customers
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
                { identityNo: { contains: search, mode: 'insensitive' } }
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

        // Map to include 'name' for frontend compatibility
        const mappedCustomers = customers.map(c => ({
            ...c,
            name: `${c.firstName} ${c.lastName}`.trim()
        }));

        res.json(mappedCustomers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Customer 360 View - Get detailed profile
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
            return res.status(404).json({ error: 'Müşteri bulunamadı.' });
        }

        // Access control based on tenant + branch + role
        if (currentUser.role !== Role.ADMIN) {
            const sales = (customer.sales || []).map(s => ({ branchId: s.branchId, employeeId: s.employeeId }));
            if (sales.length === 0 || !canAccessCustomerBySales(currentUser, sales)) {
                return res.status(403).json({ error: 'Bu müşteri bilgilerini görüntüleme yetkiniz yok.' });
            }
        }

        const score = Math.min((customer.sales?.length || 0) * 10, 100);

        const responseData = {
            ...customer,
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'İsimsiz Müşteri',
            identityNumber: customer.identityNo || null,
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

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
    const { name, email, phone, identityNumber, address, notes } = req.body;
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
                address,
                notes,
                tenantId: currentUser.tenantId
            }
        });
        res.status(201).json(customer);
    } catch (error: unknown) {
        if ((error as any).code === 'P2002') {
            return res.status(400).json({ error: 'Bu TCKN ile kayıtlı başka bir müşteri bulunmaktadır.' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, identityNumber, ...otherData } = req.body;
    const currentUser = req.user!;
    try {
        // Enforce tenant isolation
        const existing = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Müşteri bulunamadı.' });

        const updateData: any = { ...otherData };

        if (name) {
            const nameParts = name.split(' ');
            updateData.firstName = nameParts[0];
            updateData.lastName = nameParts.slice(1).join(' ') || '';
        }

        if (identityNumber) {
            updateData.identityNo = identityNumber;
        }

        const result = await prisma.customer.updateMany({
            where: { id, tenantId: currentUser.tenantId },
            data: updateData
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Müşteri bulunamadı.' });
        }

        const customer = await prisma.customer.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete customer
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
            return res.status(404).json({ error: 'Müşteri bulunamadı.' });
        }

        // Only allow deletion if no sales exist OR if user is ADMIN/MANAGER
        if (customer._count.sales > 0 && currentUser.role !== Role.ADMIN && currentUser.role !== Role.MANAGER) {
            return res.status(400).json({ error: 'Satış kaydı bulunan müşteriler sadece yönetici tarafından silinebilir.' });
        }

        const result = await prisma.customer.deleteMany({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Müşteri bulunamadı.' });
        }

        res.json({ message: 'Müşteri başarıyla silindi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};










