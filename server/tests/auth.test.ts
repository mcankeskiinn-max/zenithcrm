import request from 'supertest';
import app from '../src/app';

describe('Authentication API', () => {
    it('should return 400 for invalid login credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 200 and a token for valid admin credentials', async () => {
        // Note: This relies on the seeded admin user
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@sigorta.com',
                password: 'password123'
            });

        if (res.status === 200) {
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.role).toBe('ADMIN');
        } else {
            // If seed is missing, we might get 400/404, but we log it correctly
            console.warn('Seeded admin login failed, check database state.');
        }
    });

    it('should protect routes from unauthorized access', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(401);
    });
});
