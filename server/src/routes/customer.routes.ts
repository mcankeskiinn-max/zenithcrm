import { Router } from 'express';
import { body } from 'express-validator';
import { getCustomers, getCustomerProfile, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerProfile);
router.post('/',
    body('name').isString().trim().isLength({ min: 2, max: 120 }),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
    body('phone').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 5, max: 30 }),
    body('identityNumber').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 5, max: 30 }),
    body('address').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 2, max: 500 }),
    body('notes').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 1000 }),
    validateRequest,
    createCustomer
);
router.patch('/:id',
    body('name').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 2, max: 120 }),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
    body('phone').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 5, max: 30 }),
    body('identityNumber').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 5, max: 30 }),
    body('address').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ min: 2, max: 500 }),
    body('notes').optional({ nullable: true, checkFalsy: true }).isString().trim().isLength({ max: 1000 }),
    validateRequest,
    updateCustomer
);
router.delete('/:id', deleteCustomer);

export default router;
