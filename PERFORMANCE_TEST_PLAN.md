# Performance Test Plan

## Goal
Validate the system under 100+ user load and identify bottlenecks in API and database operations.

## Tools
- autocannon (recommended)
- Optional: k6 or Artillery for CI-level testing

## Setup
1. Start server in production-like mode with real DB.
2. Use a real tenant with test data (non-sensitive).
3. Export a valid auth cookie to test authenticated endpoints.

## Scenarios
1. Health check (public)
   - GET /
   - 50 connections, 20s

2. Sales list (authenticated)
   - GET /api/sales
   - 50 connections, 20s
   - Requires LOADTEST_COOKIE

3. Customers list (authenticated)
   - GET /api/customers
   - 30 connections, 20s
   - Requires LOADTEST_COOKIE

4. Reports (authenticated, heavy)
   - GET /api/reports (if enabled)
   - 10 connections, 30s
   - Validate rate limits and response times

## Example Command
- Install autocannon: npm install -D autocannon
- Run: node server/tools/tests/loadtest.js

## Success Criteria
- p95 latency under 500ms for list endpoints
- No 5xx spikes
- Database CPU/memory stable

## Notes
- Always test with rate limits enabled to simulate production behavior.
