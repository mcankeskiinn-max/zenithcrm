import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/message', SupportController.createMessage);
router.get('/messages', SupportController.getMessages);
router.get('/message/:id', SupportController.getMessageById);

export default router;
