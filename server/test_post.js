const http = require('http');
const jwt = require('jsonwebtoken');

const secret = 'sigorta_crm_secret_key_2024_secure';
const payload = {
    userId: '002b2ead-868c-4f90-8d0c-663827ee5704',
    email: 'nedim@cihansigorta.com',
    role: 'ADMIN',
    tenantId: '303676a5-ec74-4a47-8cb0-37c6de18cdb2'
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/policy-types',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
};

const postData = JSON.stringify({ name: 'Debug Branş ' + Date.now() });

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(postData);
req.end();
