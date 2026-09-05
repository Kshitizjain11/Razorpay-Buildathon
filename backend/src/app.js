import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import catalogRoutes from './routes/catalogRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import agentApiRoutes from './routes/agentApiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Razorpay AI Revenue Maximizer Backend',
    timestamp: new Date().toISOString()
  });
});

// Route Mounting
app.use('/api/catalog', catalogRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', agentApiRoutes);

// Error Middleware
app.use(errorHandler);

export default app;
