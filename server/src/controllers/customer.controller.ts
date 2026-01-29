import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';

// List customers
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const where: any = {};

        if (search && typeof search === 'string') {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { identityNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            include: {
                _count: {
                    select: { sales: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Customer 360 View - Get detailed profile
export const getCustomerProfile = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    include: {
                        policyType: true,
                        employee: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                tasks: {
                    include: {
                        assignedTo: { select: { name: true } }
                    },
                    orderBy: { dueDate: 'desc' }
                },
                documents: true
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Müşteri bulunamadı.' });
        }

        // Calculate loyalty score (dummy logic for now: sales count * 10, max 100)
        const score = Math.min(customer.sales.length * 10, 100);

        res.json({
            ...customer,
            loyaltyScore: score
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create customer
export const createCustomer = async (req: Request, res: Response) => {
    const { name, email, phone, identityNumber, address, notes } = req.body;
    try {
        const customer = await prisma.customer.create({
            data: { name, email, phone, identityNumber, address, notes }
        });
        res.status(201).json(customer);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu TCKN ile kayıtlı başka bir müşteri bulunmaktadır.' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const customer = await prisma.customer.update({
            where: { id },
            data
        });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
