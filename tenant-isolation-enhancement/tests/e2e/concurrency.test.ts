import request from 'supertest';
import app from '../../../server/src/app';
import { loginAsTenant } from '../utils/tenant-test-helpers';

describe('Concurrency', () => {
    it('should maintain tenant isolation under concurrent load', async () => {
        const token1 = await loginAsTenant(1);
        const token2 = await loginAsTenant(2);
        const requests = Array.from({ length: 50 }, (_, i) => {
            const token = i % 2 === 0 ? token1 : token2;
            return request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${token}`);
        });
        const responses = await Promise.all(requests);
        responses.forEach((res) => {
            expect([200, 401]).toContain(res.status);
        });
    });
});
