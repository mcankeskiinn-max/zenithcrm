import { BypassPermission, BYPASS_TIME_WINDOW_MINUTES, MAX_BYPASS_ATTEMPTS } from '../types/bypass.types';

export type BypassAlert = {
    type: 'FREQUENT_USE' | 'UNAUTHORIZED_ATTEMPT' | 'OFF_HOURS_USE' | 'SUSPICIOUS_PATTERN';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    action: 'LOG' | 'NOTIFY_ADMIN' | 'TEMP_BLOCK';
    userId: string;
    count: number;
};

type Event = {
    userId: string;
    allowed: boolean;
    reason?: string;
    permission?: BypassPermission;
    timestamp: number;
};

const events: Event[] = [];

export class BypassAbuseDetector {
    register(event: Event) {
        events.push(event);
        this.trim();
    }

    async checkAbuse(userId: string, reason?: string): Promise<BypassAlert | null> {
        this.trim();
        const recent = events.filter((e) => e.userId === userId);
        const allowedCount = recent.filter((e) => e.allowed).length;
        const deniedCount = recent.filter((e) => !e.allowed).length;

        if (allowedCount > MAX_BYPASS_ATTEMPTS) {
            return {
                type: 'FREQUENT_USE',
                severity: 'HIGH',
                message: `User ${userId} used bypass ${allowedCount} times in 1h`,
                action: 'NOTIFY_ADMIN',
                userId,
                count: allowedCount
            };
        }

        if (deniedCount >= 3) {
            return {
                type: 'UNAUTHORIZED_ATTEMPT',
                severity: 'MEDIUM',
                message: `User ${userId} attempted unauthorized bypass ${deniedCount} times`,
                action: 'NOTIFY_ADMIN',
                userId,
                count: deniedCount
            };
        }

        const hour = new Date().getHours();
        if (hour < 9 || hour > 18) {
            return {
                type: 'OFF_HOURS_USE',
                severity: 'MEDIUM',
                message: `Bypass used off-hours by user ${userId}`,
                action: 'LOG',
                userId,
                count: 1
            };
        }

        if (reason) {
            const reasonCount = recent.filter((e) => e.reason === reason).length;
            if (reasonCount > 50) {
                return {
                    type: 'SUSPICIOUS_PATTERN',
                    severity: 'CRITICAL',
                    message: `Same reason used ${reasonCount} times`,
                    action: 'TEMP_BLOCK',
                    userId,
                    count: reasonCount
                };
            }
        }

        return null;
    }

    private trim() {
        const cutoff = Date.now() - BYPASS_TIME_WINDOW_MINUTES * 60 * 1000;
        while (events.length && events[0].timestamp < cutoff) {
            events.shift();
        }
    }
}
