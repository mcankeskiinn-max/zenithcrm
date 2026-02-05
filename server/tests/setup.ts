import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load test env first, fallback to .env
const envTestPath = path.resolve(__dirname, '../.env.test');
const envPath = path.resolve(__dirname, '../.env');
const envToLoad = fs.existsSync(envTestPath) ? envTestPath : envPath;
dotenv.config({ path: envToLoad });

process.env.NODE_ENV = 'test';

// Ensure we don't accidentally wipe production if we ever add teardowns
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be defined for tests');
}

// Global mocks or setup can go here
