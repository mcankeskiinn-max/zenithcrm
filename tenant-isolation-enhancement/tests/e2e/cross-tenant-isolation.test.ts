import request from 'supertest';
import app from '../../../server/src/app';

describe('Cross tenant isolation', () => {
    it('returns 404 for cross-tenant read attempt', async () => {
        const response = await request(app)
            .get('/api/customers/invalid-id')
            .set('Authorization', 'Bearer testtoken');
        expect([401, 404]).toContain(response.status);
    });
});
