import { bypassAbuseDetector, BypassAbuseDetector } from '../src/monitoring/bypass-abuse-detector';

describe('bypass abuse detector', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-02-09T02:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('flags frequent use', async () => {
        const detector = new BypassAbuseDetector();
        for (let i = 0; i < 11; i++) {
            detector.register({ userId: 'u1', allowed: true, timestamp: Date.now() });
        }
        const alert = await detector.checkAbuse('u1');
        expect(alert?.type).toBe('FREQUENT_USE');
    });

    it('flags unauthorized attempts', async () => {
        const detector = new BypassAbuseDetector();
        for (let i = 0; i < 3; i++) {
            detector.register({ userId: 'u2', allowed: false, timestamp: Date.now() });
        }
        const alert = await detector.checkAbuse('u2');
        expect(alert?.type).toBe('UNAUTHORIZED_ATTEMPT');
    });

    it('flags off-hours usage', async () => {
        const detector = new BypassAbuseDetector();
        detector.register({ userId: 'u3', allowed: true, timestamp: Date.now() });
        const alert = await detector.checkAbuse('u3');
        expect(alert?.type).toBe('OFF_HOURS_USE');
    });

    it('flags frequent use before suspicious pattern', async () => {
        const detector = new BypassAbuseDetector();
        for (let i = 0; i < 51; i++) {
            detector.register({ userId: 'u4', allowed: true, reason: 'same', timestamp: Date.now() });
        }
        const alert = await detector.checkAbuse('u4', 'same');
        expect(alert?.type).toBe('FREQUENT_USE');
    });

    it('returns null when normal usage', async () => {
        const detector = new BypassAbuseDetector();
        jest.setSystemTime(new Date('2026-02-09T12:00:00Z'));
        detector.register({ userId: 'u5', allowed: true, reason: 'ok', timestamp: Date.now() });
        const alert = await detector.checkAbuse('u5', 'ok');
        expect(alert).toBeNull();
    });

    it('trims old events outside time window', async () => {
        const detector = new BypassAbuseDetector();
        const oldTime = new Date('2026-02-09T00:00:00Z').getTime();
        jest.setSystemTime(new Date('2026-02-09T12:00:00Z'));
        detector.register({ userId: 'u6', allowed: true, timestamp: oldTime });
        detector.register({ userId: 'u6', allowed: true, timestamp: Date.now() });
        const alert = await detector.checkAbuse('u6');
        expect(alert).toBeNull();
    });

    it('shared singleton works', () => {
        expect(bypassAbuseDetector).toBeInstanceOf(BypassAbuseDetector);
    });
});
