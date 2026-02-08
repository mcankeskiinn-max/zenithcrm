import request from 'supertest';
import app from '../../../server/src/app';
import { createAuthToken, createCustomer, createTamperedToken } from '../utils/tenant-test-helpers';

describe('Tenant Isolation - Security Tests', () => {
    it('should block cross-tenant findUnique', async () => {
        const token = await createAuthToken({ tenantId: 1, role: 'USER' });
        const foreignCustomer = await createCustomer({ tenantId: 2 });

        const res = await request(app)
            .get(`/api/customers/${foreignCustomer.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('should reject mismatched tenant header', async () => {
        const token = await createAuthToken({ tenantId: 1, role: 'USER' });
        const res = await request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', '2');

        expect(res.status).toBe(401);
    });

    it('should reject tampered token', async () => {
        const token = await createAuthToken({ tenantId: 1, role: 'USER' });
        const tampered = await createTamperedToken(token, { tenantId: 2 });
        const res = await request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${tampered}`);
        expect(res.status).toBe(401);
    });
});


describe('Tenant Isolation - Missing Critical Tests', () => {
    it('should block cross-tenant include relations', async () => {
        const token = await createAuthToken({ tenantId: 1, role: 'USER' });
        const policy = await createPolicyWithCrossTenantCustomer({ policyTenant: 1, customerTenant: 2 });
        const res = await request(app)
            .get(`/api/policies/${policy.id}?include=customer`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.customer).toBeNull();
    });

    it('should maintain tenant isolation under concurrent load', async () => {
        const token1 = await createAuthToken({ tenantId: 1, role: 'USER' });
        const token2 = await createAuthToken({ tenantId: 2, role: 'USER' });
        const requests = Array.from({ length: 100 }, (_, i) => {
            const token = i % 2 === 0 ? token1 : token2;
            return request(app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${token}`);
        });
        const responses = await Promise.all(requests);
        responses.forEach((res, i) => {
            const expected = i % 2 === 0 ? 1 : 2;
            if (Array.isArray(res.body)) {
                res.body.forEach((customer: any) => {
                    expect(customer.tenantId).toBe(String(expected));
                });
            }
        });
    });
});
