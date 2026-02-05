import { Router } from 'express';
import { body } from 'express-validator';
import { getSales, createSale, updateSale, deleteSale } from '../controllers/sale.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { SaleStatus } from '../utils/constants';

const router = Router();

router.use(authenticate);

router.get('/', getSales);
router.post('/',
    body('amount').isNumeric().toFloat().isFloat({ gt: 0 }),
    body('policyNumber').optional({ nullable: true }).isString().trim().isLength({ max: 50 }),
    body('customerName').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 120 }),
    body('customerPhone').optional({ nullable: true }).isString().trim().isLength({ min: 5, max: 30 }),
    body('customerEmail').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('branchId').optional({ nullable: true }).isUUID(),
    body('policyTypeId').isUUID(),
    body('employeeId').optional({ nullable: true }).isUUID(),
    body('status').optional({ nullable: true }).isIn(Object.values(SaleStatus)),
    body('cancelReason').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
    body('customerId').optional({ nullable: true }).isUUID(),
    body('startDate').optional({ nullable: true }).isISO8601(),
    body('endDate').optional({ nullable: true }).isISO8601(),
    body('saleDate').optional({ nullable: true }).isISO8601(),
    validateRequest,
    createSale
);
router.put('/:id',
    body('amount').optional({ nullable: true }).isNumeric().toFloat().isFloat({ gt: 0 }),
    body('policyNumber').optional({ nullable: true }).isString().trim().isLength({ max: 50 }),
    body('customerName').optional({ nullable: true }).isString().trim().isLength({ min: 2, max: 120 }),
    body('customerPhone').optional({ nullable: true }).isString().trim().isLength({ min: 5, max: 30 }),
    body('customerEmail').optional({ nullable: true }).isEmail().normalizeEmail(),
    body('branchId').optional({ nullable: true }).isUUID(),
    body('policyTypeId').optional({ nullable: true }).isUUID(),
    body('employeeId').optional({ nullable: true }).isUUID(),
    body('status').optional({ nullable: true }).isIn(Object.values(SaleStatus)),
    body('cancelReason').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
    body('customerId').optional({ nullable: true }).isUUID(),
    body('startDate').optional({ nullable: true }).isISO8601(),
    body('endDate').optional({ nullable: true }).isISO8601(),
    body('saleDate').optional({ nullable: true }).isISO8601(),
    validateRequest,
    updateSale
);
router.delete('/:id', deleteSale);

export default router;
