import dotenv from 'dotenv';
dotenv.config();

import { NotificationJob } from '../src/jobs/notification.job';

async function testNotifications() {
    console.log('🧪 Testing Notification System...\n');

    try {
        console.log('📋 Running all notification checks...');
        await NotificationJob.runAll();

        console.log('\n✅ Test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

testNotifications();
