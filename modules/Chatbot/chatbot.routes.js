import { Router } from 'express';
import { healthCheck, postMessage, postMessage2, getThreadMessages, killThread, webhook } from './chatbot.controller.js';

const router = Router();

router.get('/health', healthCheck)
router.post('/messages', webhook)
router.get('/threads/:thread_id', getThreadMessages)
router.delete('/threads/:thread_id', killThread)

export default router;