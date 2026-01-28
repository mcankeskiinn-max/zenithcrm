import request from 'supertest';
import app from '../src/app';

describe('Sales API', () => {
    let adminToken: string;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@sigorta.com',
                password: 'password123'
            });
        adminToken = res.body.token;
    });

    it('should list sales for an authenticated user', async () => {
        if (!adminToken) return;

        const res = await request(app)
            .get('/api/sales')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return error when creating sale with missing fields', async () => {
        if (!adminToken) return;

        const res = await request(app)
            .post('/api/sales')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                // Missing required fields
                amount: 1000
            });

        expect(res.status).toBe(400);
    });
});
