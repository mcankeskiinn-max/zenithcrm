import prisma from '../prisma';

export class RenewalService {
    /**
     * Scans for active sales that are expiring within the next `days` and creates tasks for agents.
     */
    static async checkAndCreateRenewalTasks(days: number = 30) {
        console.log(`[RenewalService] Checking for policies expiring within ${days} days...`);

        const now = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(now.getDate() + days);

        try {
            // Find active sales expiring soon
            const expiringSales = await prisma.sale.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gt: now,
                        lte: futureLimit
                    },
                    // Ensure we don't already have an open renewal task for this sale
                    tasks: {
                        none: {
                            title: { contains: 'Yenileme' },
                            isCompleted: false
                        }
                    }
                },
                include: {
                    customer: true,
                    employee: true,
                    policyType: true
                }
            });

            console.log(`[RenewalService] Found ${expiringSales.length} policies for renewal.`);

            const tasks = [];
            for (const sale of expiringSales) {
                const task = await prisma.task.create({
                    data: {
                        title: `Yenileme: ${sale.customer?.name || 'Müşteri'} - ${sale.policyType.name}`,
                        description: `${sale.policyNumber || 'Bilinmeyen'} nolu poliçe ${sale.endDate?.toLocaleDateString()} tarihinde sona eriyor. Lütfen yenileme için iletişime geçin.`,
                        dueDate: sale.endDate || futureLimit,
                        priority: 'HIGH',
                        assignedToId: sale.employeeId,
                        saleId: sale.id,
                        customerId: sale.customerId
                    }
                });
                tasks.push(task);
            }

            return tasks;
        } catch (error) {
            console.error('[RenewalService] Error:', error);
            throw error;
        }
    }
}
