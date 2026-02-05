const jwt = require('jsonwebtoken');

const secret = 'sigorta_crm_secret_key_2024_secure';
const payload = {
    userId: '002b2ead-868c-4f90-8d0c-663827ee5704',
    email: 'nedim@cihansigorta.com',
    role: 'ADMIN',
    tenantId: '303676a5-ec74-4a47-8cb0-37c6de18cdb2'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
