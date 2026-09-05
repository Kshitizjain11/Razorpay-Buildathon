import express from 'express';
import { extractUserRequirements, handleAgentMessage } from '../controllers/agentController.js';

const router = express.Router();

router.post('/extract', extractUserRequirements);
router.post('/message', handleAgentMessage);

export default router;
