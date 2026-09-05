import express from 'express';
import { createAgentQuote, confirmAgentOrder } from '../controllers/agentApiController.js';

const router = express.Router();

// Programmatic Agent-to-Agent API Endpoints
router.post('/quote', createAgentQuote);
router.post('/orders/confirm', confirmAgentOrder);

export default router;
