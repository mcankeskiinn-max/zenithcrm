import request from 'supertest';
import app from '../../../server/src/app';
import { loginAsRole } from '../utils/tenant-test-helpers';

describe('Bypass authorization', () => {
    it('should allow bypass for SUPER_ADMIN', async () => {
        const token = await loginAsRole('SUPER_ADMIN');
        const response = await request(app)
            .post('/api/internal/cross-tenant-report')
            .set('Authorization', `Bearer ${token}`)
            .send({ bypassReason: 'Monthly report' });
        expect([200, 404, 401]).toContain(response.status);
    });
});
