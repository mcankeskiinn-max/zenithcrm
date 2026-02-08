import { NotificationService } from '../services/notification.service';
import prisma from '../prisma';
import { addDays, isToday } from 'date-fns';

export class NotificationJob {
    /**
     * Check for policy renewals (run daily)
     */
    static async checkPolicyRenewals() {
        console.log('?? Checking policy renewals...');

        const expiringDays = [30, 15, 7, 3, 1];
        let totalCreated = 0;

        const tenants = await prisma.tenant.findMany({
            where: { isActive: true },
            select: { id: true }
        });

        for (const tenant of tenants) {
            for (const days of expiringDays) {
                const targetDate = addDays(new Date(), days);
                const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

                const sales = await prisma.sale.findMany({
                    where: {
                        tenantId: tenant.id,
                        endDate: {
                            gte: startOfDay,
                            lte: endOfDay
                        },
                        status: 'ACTIVE'
                    },
                    include: {
                        customer: { select: { firstName: true, lastName: true } },
                        policyType: { select: { name: true } },
                        employee: { select: { id: true } }
                    }
                });

                for (const sale of sales) {
                    if (!sale.customer) continue;
                    const customerName = `${sale.customer.firstName} ${sale.customer.lastName}`;
                    const policyName = sale.policyType.name;

                    await NotificationService.create({
                        tenantId: sale.tenantId,
                        userId: sale.employee?.id,
                        type: 'POLICY_RENEWAL',
                        title: 'Poliçe Yenileme Uyarýsý',
                        message: `${customerName}'ýn ${policyName} poliçesi ${days} gün sonra sona eriyor`,
                        link: `/customers/${sale.customerId}`,
                        relatedId: sale.id,
                        relatedType: 'sale',
                        priority: days <= 7 ? 'HIGH' : 'NORMAL',
                        expiresAt: addDays(new Date(), days + 7)
                    });
                    totalCreated++;
                }
            }
        }

        console.log(`? Created ${totalCreated} policy renewal notifications`);
    }

    /**
     * Check for task deadlines (run daily)
     */
    static async checkTaskDeadlines() {
        console.log('?? Checking task deadlines...');

        const today = new Date();
        const tomorrow = addDays(today, 1);
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

        const tenants = await prisma.tenant.findMany({
            where: { isActive: true },
            select: { id: true }
        });

        let totalCreated = 0;
        for (const tenant of tenants) {
            const tasks = await prisma.task.findMany({
                where: {
                    tenantId: tenant.id,
                    dueDate: {
                        gte: startOfToday,
                        lte: endOfTomorrow
                    },
                    isCompleted: false
                },
                include: {
                    customer: { select: { firstName: true, lastName: true } }
                }
            });

            for (const task of tasks) {
                const isUrgent = isToday(task.dueDate);
                const daysText = isUrgent ? 'bugün' : 'yarýn';

                await NotificationService.create({
                    tenantId: task.tenantId,
                    userId: task.assignedToId,
                    type: 'TASK_DEADLINE',
                    title: 'Görev Deadline Uyarýsý',
                    message: `"${task.title}" görevi ${daysText} bitiyor`,
                    link: `/tasks`,
                    relatedId: task.id,
                    relatedType: 'task',
                    priority: isUrgent ? 'URGENT' : 'HIGH'
                });
                totalCreated++;
            }
        }

        console.log(`? Created ${totalCreated} task deadline notifications`);
    }

    /**
     * Check for customer birthdays (run daily)
     */
    static async checkBirthdays() {
        console.log('?? Checking customer birthdays...');

        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        const tenants = await prisma.tenant.findMany({
            where: { isActive: true },
            select: { id: true }
        });

        let totalCreated = 0;
        for (const tenant of tenants) {
            const customers = await prisma.customer.findMany({
                where: {
                    tenantId: tenant.id,
                    birthDate: {
                        not: null
                    }
                },
                include: {
                    sales: {
                        where: { status: 'ACTIVE' },
                        include: { employee: { select: { id: true } } },
                        take: 1
                    }
                }
            });

            const birthdayCustomers = customers.filter(customer => {
                if (!customer.birthDate) return false;
                const birthDate = new Date(customer.birthDate);
                return birthDate.getMonth() + 1 === month && birthDate.getDate() === day;
            });

            for (const customer of birthdayCustomers) {
                const employeeId = customer.sales[0]?.employee?.id;

                await NotificationService.create({
                    tenantId: customer.tenantId,
                    userId: employeeId,
                    type: 'CUSTOMER_BIRTHDAY',
                    title: 'Müþteri Doðum Günü',
                    message: `${customer.firstName} ${customer.lastName}'ýn bugün doðum günü! ??`,
                    link: `/customers/${customer.id}`,
                    relatedId: customer.id,
                    relatedType: 'customer',
                    priority: 'NORMAL'
                });
                totalCreated++;
            }
        }

        console.log(`? Created ${totalCreated} birthday notifications`);
    }

    /**
     * Run all notification checks
     */
    static async runAll() {
        try {
            console.log('?? Starting notification jobs...');
            await this.checkPolicyRenewals();
            await this.checkTaskDeadlines();
            await this.checkBirthdays();
            await NotificationService.cleanup();
            console.log('? All notification jobs completed');
        } catch (error) {
            console.error('? Notification job error:', error);
        }
    }
}
