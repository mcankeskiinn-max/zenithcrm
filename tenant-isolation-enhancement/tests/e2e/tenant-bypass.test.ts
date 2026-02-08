import request from 'supertest';
import app from '../../../server/src/app';
import { createAuthToken } from '../utils/tenant-test-helpers';

describe('Bypass Authorization', () => {
    it('should block bypass for regular user', async () => {
        const token = await createAuthToken({ tenantId: 1, role: 'USER' });
        const res = await request(app)
            .post('/api/internal/cross-tenant-report')
            .set('Authorization', `Bearer ${token}`)
            .send({ bypassReason: 'Curious' });
        expect(res.status).toBe(403);
    });
});
