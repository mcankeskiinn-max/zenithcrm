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
            const tenants = await prisma.tenant.findMany();
            let totalTasksCreated = 0;

            for (const tenant of tenants) {
                // Find active sales expiring soon for this tenant
                const expiringSales = await prisma.sale.findMany({
                    where: {
                        tenantId: tenant.id,
                        status: 'ACTIVE',
                        endDate: {
                            gt: now,
                            lte: futureLimit
                        },
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

                for (const sale of expiringSales) {
                    await prisma.task.create({
                        data: {
                            title: `Yenileme: ${sale.customer?.name || 'Müşteri'} - ${sale.policyType.name}`,
                            description: `${sale.policyNumber || 'Bilinmeyen'} nolu poliçe ${sale.endDate?.toLocaleDateString()} tarihinde sona eriyor. Lütfen yenileme için iletişime geçin.`,
                            dueDate: sale.endDate || futureLimit,
                            priority: 'HIGH',
                            assignedToId: sale.employeeId,
                            saleId: sale.id,
                            customerId: sale.customerId,
                            tenantId: tenant.id
                        }
                    });
                    totalTasksCreated++;
                }
            }

            console.log(`[RenewalService] Finished. Created ${totalTasksCreated} renewal tasks across all tenants.`);
            return { totalTasksCreated };
        } catch (error) {
            console.error('[RenewalService] Error:', error);
            throw error;
        }
    }
}
