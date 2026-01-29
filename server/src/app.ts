import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
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
import prisma from './prisma';


const app = express();

// Security middleware
app.use(helmet());
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploads

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Slightly more generous than 5 but still strict
    message: { error: 'Too many login attempts, please try again later.' }
});

// App configuration
const allowedOrigin = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : '*';

app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());

// Apply rate limits
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.get('/', async (req, res) => {
    try {
        const branchCount = await prisma.branch.count();
        const ptCount = await prisma.policyType.count();
        res.json({ message: 'Sigorta CRM API is running', branchCount, ptCount });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
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

export default app;
