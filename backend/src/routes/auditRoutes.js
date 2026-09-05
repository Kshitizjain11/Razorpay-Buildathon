import express from 'express';
import { getLogs } from '../controllers/auditController.js';

const router = express.Router();

router.get('/', getLogs);

export default router;
