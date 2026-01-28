import { Router } from 'express';
import { sendMessage, getConversations, getMessages, getAllSystemConversations } from '../controllers/message.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../utils/constants';

const router = Router();

router.use(authenticate);

// Get conversation list for the current user
router.get('/conversations', getConversations);

// Get message history with a specific user
router.get('/history/:userId', getMessages);

// Send a new message
router.post('/', sendMessage);

// System-wide view for Admin/Manager
router.get('/system-wide', authorize(Role.ADMIN, Role.MANAGER), getAllSystemConversations);

export default router;
