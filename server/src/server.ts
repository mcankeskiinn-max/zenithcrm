import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import cron from 'node-cron';
import { NotificationJob } from './jobs/notification.job';
import { NotificationService } from './services/notification.service';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Run notification checks daily at 08:00
    cron.schedule('0 8 * * *', async () => {
        console.log('🔔 Running daily notification checks...');
        await NotificationJob.runAll();
    });

    // Run cleanup weekly on Sunday at 02:00
    cron.schedule('0 2 * * 0', async () => {
        console.log('🧹 Running notification cleanup...');
        await NotificationService.cleanup();
    });

    console.log('✅ Cron jobs scheduled: Notifications (08:00 daily), Cleanup (02:00 Sunday)');
});
