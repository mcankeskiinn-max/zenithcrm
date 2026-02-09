const auditMock = jest.fn().mockResolvedValue(undefined);

const setup = async () => {
    jest.resetModules();
    const registerMock = jest.fn();
    const checkAbuseMock = jest.fn().mockResolvedValue({
        type: 'FREQUENT_USE',
        severity: 'HIGH',
        message: 'test',
        action: 'NOTIFY_ADMIN',
        userId: 'u1',
        count: 11
    });

    jest.doMock('../src/utils/audit.util', () => ({
        logAudit: auditMock
    }));

    jest.doMock('../src/monitoring/bypass-abuse-detector', () => ({
        bypassAbuseDetector: {
            register: registerMock,
            checkAbuse: checkAbuseMock
        }
    }));

    const { runWithBypass } = await import('../src/utils/tenant-bypass');
    const { TenantBypassError } = await import('../src/utils/tenant-errors');

    return { runWithBypass, TenantBypassError, registerMock, checkAbuseMock };
};

describe('tenant bypass abuse integration', () => {
    const originalEnv = process.env.BYPASS_ABUSE_DETECTOR_ENABLED;

    afterEach(() => {
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = originalEnv;
        auditMock.mockClear();
    });

    it('registers denied attempt when detector enabled', async () => {
        const { runWithBypass, TenantBypassError, registerMock } = await setup();
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'true';
        await expect(
            runWithBypass({ actorId: 'u1', actorRole: 'USER', reason: 'test' }, async () => 'no')
        ).rejects.toBeInstanceOf(TenantBypassError);
        expect(registerMock).toHaveBeenCalled();
    });

    it('logs abuse alert when detector enabled', async () => {
        const { runWithBypass, registerMock, checkAbuseMock } = await setup();
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'true';
        await runWithBypass(
            { actorId: 'u1', actorRole: 'ADMIN', reason: 'report' },
            async () => 'ok'
        );
        expect(registerMock).toHaveBeenCalled();
        expect(checkAbuseMock).toHaveBeenCalled();
    });

    it('does not register when detector disabled', async () => {
        const { runWithBypass, registerMock } = await setup();
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'false';
        await runWithBypass(
            { actorId: 'u1', actorRole: 'ADMIN', reason: 'report' },
            async () => 'ok'
        );
        expect(registerMock).not.toHaveBeenCalled();
    });

    it('denies role without registering when detector disabled', async () => {
        const { runWithBypass, TenantBypassError, registerMock } = await setup();
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'false';
        await expect(
            runWithBypass({ actorId: 'u2', actorRole: 'USER', reason: 'test' }, async () => 'no')
        ).rejects.toBeInstanceOf(TenantBypassError);
        expect(registerMock).not.toHaveBeenCalled();
    });

    it('handles no alert when detector enabled', async () => {
        const { runWithBypass, checkAbuseMock } = await setup();
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'true';
        checkAbuseMock.mockResolvedValueOnce(null);
        await runWithBypass(
            { actorId: 'u3', actorRole: 'ADMIN', reason: 'report' },
            async () => 'ok'
        );
        expect(checkAbuseMock).toHaveBeenCalled();
    });
});
