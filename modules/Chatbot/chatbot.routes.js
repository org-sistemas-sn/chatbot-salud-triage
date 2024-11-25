import { Router } from 'express';
import { postMessage } from './chatbot.controller.js';

const router = Router();

router.post('/messages', postMessage)

export default router;