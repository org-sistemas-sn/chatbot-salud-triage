import { Router } from 'express';
import { healthCheck, postMessage, getThreadMessages, killThread } from './chatbot.controller.js';

const router = Router();

router.get('/health', healthCheck)
router.post('/messages', postMessage)
router.get('/threads/:thread_id', getThreadMessages)
router.delete('/threads/:thread_id', killThread)

export default router;