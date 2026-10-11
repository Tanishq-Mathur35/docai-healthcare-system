import { Router } from 'express';
import { chatController } from './chat.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/rooms', chatController.getRooms.bind(chatController));
router.post('/rooms', chatController.createOrGetRoom.bind(chatController));
router.get('/rooms/:roomId/messages', chatController.getMessages.bind(chatController));
router.post('/rooms/:roomId/messages', chatController.sendMessage.bind(chatController));

export default router;
