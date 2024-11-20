import { Router } from 'express';
import { postMessage, getThreadMessages, killThread } from './chatbot.controller.js';

const router = Router();

router.post('/messages', postMessage)
router.get('/threads/:thread_id', getThreadMessages)
router.delete('/threads/:thread_id', killThread)

export default router;