import dotenv from 'dotenv';
import path from 'path';

// Load .env for tests
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure we don't accidentally wipe production if we ever add teardowns
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be defined for tests');
}

// Global mocks or setup can go here
