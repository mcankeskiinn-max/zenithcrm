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
                        }
                    },
                    include: {
                        customer: true,
                        employee: true,
                        policyType: true
                    }
                });

                for (const sale of expiringSales) {
                    // Check if renewal task already exists
                    const existingTask = await prisma.task.findFirst({
                        where: {
                            tenantId: tenant.id,
                            title: { contains: `Yenileme: ${sale.policyNumber}` },
                            isCompleted: false
                        }
                    });

                    if (existingTask) continue;

                    await prisma.task.create({
                        data: {
                            title: `Yenileme: ${sale.customer?.firstName || ''} ${sale.customer?.lastName || 'Müşteri'} - ${sale.policyType.name}`,
                            description: `${sale.policyNumber || 'Bilinmeyen'} nolu poliçe ${sale.endDate?.toLocaleDateString()} tarihinde sona eriyor. Lütfen yenileme için iletişime geçin.`,
                            dueDate: sale.endDate || futureLimit,
                            priority: 'HIGH',
                            assignedToId: sale.employeeId,
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
