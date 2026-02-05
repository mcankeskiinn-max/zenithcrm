const baseUrl = process.env.LOADTEST_BASE_URL || 'http://localhost:3000';
const cookie = process.env.LOADTEST_COOKIE || '';

let autocannon;
try {
  autocannon = require('autocannon');
} catch (err) {
  console.error('autocannon is not installed.');
  console.error('Run: npm install -D autocannon');
  process.exit(1);
}

const run = (opts) => new Promise((resolve, reject) => {
  const instance = autocannon(opts, (err, result) => {
    if (err) return reject(err);
    resolve(result);
  });
  autocannon.track(instance, { renderProgressBar: true });
});

(async () => {
  console.log('Load test starting...');
  console.log('Base URL:', baseUrl);

  // Health check (public)
  await run({
    url: `${baseUrl}/`,
    connections: 50,
    duration: 20
  });

  if (cookie) {
    // Authenticated read endpoints
    await run({
      url: `${baseUrl}/api/sales`,
      connections: 50,
      duration: 20,
      headers: {
        Cookie: cookie
      }
    });

    await run({
      url: `${baseUrl}/api/customers`,
      connections: 30,
      duration: 20,
      headers: {
        Cookie: cookie
      }
    });
  } else {
    console.log('LOADTEST_COOKIE is not set. Skipping authenticated endpoints.');
  }

  console.log('Load test complete.');
})().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
