import { Router } from 'express';
import { postMessage, test } from './chatbot.controller.js';

const router = Router();

router.post('/messages', postMessage)
router.post('/test', test)

export default router;