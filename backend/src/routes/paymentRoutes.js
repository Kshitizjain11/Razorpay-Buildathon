import express from 'express';
import { createCheckoutOrder, verifyPayment, handlePaymentFailure, retryPayment, logCheckoutInitiated, logPaymentAttemptSubmitted } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', createCheckoutOrder);
router.post('/verify', verifyPayment);
router.post('/failure', handlePaymentFailure);
router.post('/retry', retryPayment);
router.post('/log-checkout-initiated', logCheckoutInitiated);
router.post('/log-attempt-submitted', logPaymentAttemptSubmitted);

export default router;
