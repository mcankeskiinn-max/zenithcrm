// Use require to avoid module hoisting so Sentry.init runs before Express loads.
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sentry = require('@sentry/node');
const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
        defaultIntegrations: false,
        integrations: [Sentry.httpIntegration()]
    });
}

// Load app after Sentry.init to ensure Express is instrumented
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('./app').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cron = require('node-cron');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NotificationJob } = require('./jobs/notification.job');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NotificationService } = require('./services/notification.service');

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // Run notification checks daily at 08:00
    cron.schedule('0 8 * * *', async () => {
        console.log('ğŸ”” Running daily notification checks...');
        await NotificationJob.runAll();
    });

    // Run cleanup weekly on Sunday at 02:00
    cron.schedule('0 2 * * 0', async () => {
        console.log('ğŸ§¹ Running notification cleanup...');
        await NotificationService.cleanup();
    });

    console.log('âœ… Cron jobs scheduled: Notifications (08:00 daily), Cleanup (02:00 Sunday)');
});
