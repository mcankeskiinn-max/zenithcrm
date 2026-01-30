import axios from 'axios';

const BACKEND_URL = 'https://zenithcrm-chi.vercel.app';

async function checkCors() {
    console.log(`Checking CORS for ${BACKEND_URL}...`);
    try {
        const response = await axios.options(`${BACKEND_URL}/api/branches`, {
            headers: {
                'Origin': 'https://zenithcrm-w79r.vercel.app',
                'Access-Control-Request-Method': 'POST'
            },
            validateStatus: () => true
        });

        console.log('Status:', response.status);
        console.log('Headers:', JSON.stringify(response.headers, null, 2));

        const allowOrigin = response.headers['access-control-allow-origin'];
        const allowMethods = response.headers['access-control-allow-methods'];

        if (allowOrigin === 'https://zenithcrm-w79r.vercel.app' || allowOrigin === '*') {
            console.log('✅ CORS Origin check PASSED');
        } else {
            console.log('❌ CORS Origin check FAILED');
        }

    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

checkCors();
