import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import commissionRoutes from './routes/commission.routes';
import branchRoutes from './routes/branch.routes';
import userRoutes from './routes/user.routes';
import saleRoutes from './routes/sale.routes';
import dashboardRoutes from './routes/dashboard.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';
import policyTypeRoutes from './routes/policyType.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import documentRoutes from './routes/document.routes';
import reportRoutes from './routes/report.routes';
import auditRoutes from './routes/audit.routes';
import customerRoutes from './routes/customer.routes';
import payrollRoutes from './routes/payroll.routes';
import revenueRoutes from './routes/revenue.routes';
import quoteRoutes from './routes/quote.routes';
import ocrRoutes from './routes/ocr.routes';
import tenantRoutes from './routes/tenant.routes'; // Added tenantRoutes import
import supportRoutes from './routes/support.routes';
import prisma from './prisma';
import { csrfProtection } from './middleware/csrf.middleware';


const app = express();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
}

// Security middleware
app.use(helmet());
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploads

// Rate limiting - enabled in production
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Too many login attempts, please try again later.' }
});

// App configuration
if (!isProduction) {
    console.log('CORS Setup - ENV CORS_ORIGIN:', process.env.CORS_ORIGIN);
    console.log('CORS Setup - ENV CLIENT_URL:', process.env.CLIENT_URL);
}

// Hardcode allow list for debugging purposes, combined with env
// Note: when using credentials: true, 'origin' cannot be '*'
const normalizeOrigin = (origin: string) => origin.replace(/\/$/, '');

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5173/',
    'http://127.0.0.1:5173',
    'https://zenithcrm-w79r.vercel.app',
    'https://zenithcrm-w79r-git-main-muratcans-projects-ad29ce1e.vercel.app',
    process.env.CORS_ORIGIN,
    process.env.CLIENT_URL
].filter((o): o is string => Boolean(o)).map(normalizeOrigin);

if (!isProduction) {
    console.log('CORS Setup - Allowed Origins:', allowedOrigins);
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const normalizedOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.warn('CORS Blocked Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(csrfProtection);

// Apply rate limits in production only
if (isProduction) {
    app.use('/api/', apiLimiter);
    app.use('/api/auth/login', authLimiter);
}

app.get('/', async (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sigorta CRM API is running',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/policy-types', policyTypeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/support', supportRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const fs = require('fs');
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
    fs.appendFileSync(path.join(__dirname, '../debug_errors.log'), logEntry);

    console.error('Global Error:', err);
    res.status(500).json({
        error: 'Global Sunucu Hatası',
        message: err.message
    });
});

export default app;
