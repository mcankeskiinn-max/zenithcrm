import { Router } from 'express';
import { getCustomers, getCustomerProfile, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerProfile);
router.post('/', createCustomer);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
