import express from 'express';
import { getMerchantDashboardMetrics } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/metrics', getMerchantDashboardMetrics);

export default router;
