import { Router } from 'express';
import { healthCheck, postMessage, postMessage2, getThreadMessages, killThread, webhook2 } from './chatbot.controller.js';

const router = Router();

router.get('/health', healthCheck)
router.post('/messages', webhook2)
router.get('/threads/:thread_id', getThreadMessages)
router.delete('/threads/:thread_id', killThread)

export default router;