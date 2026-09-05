import Razorpay from 'razorpay';
import crypto from 'crypto';
import { addAuditLog } from '../models/auditTrail.js';

let razorpayInstance = null;

function getRazorpayInstance() {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_id.includes('placeholder') || key_secret.includes('placeholder')) {
      throw new Error("Missing valid RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in backend .env. Real Razorpay Test Mode credentials are required.");
    }

    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
  }
  return razorpayInstance;
}

export async function createRazorpayOrder(sessionId, amountInINR, receiptId, source = "human") {
  const instance = getRazorpayInstance();

  // Razorpay requires amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(amountInINR * 100);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: receiptId || `rcpt_${Date.now()}`,
    notes: {
      sessionId,
      source
    }
  };

  try {
    // Call real Razorpay API to create test mode order
    const order = await instance.orders.create(options);

    addAuditLog({
      sessionId,
      event: "RAZORPAY_ORDER_CREATED",
      payload: {
        orderId: order.id,
        amountInINR,
        currency: "INR",
        status: order.status
      },
      source
    });

    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    addAuditLog({
      sessionId,
      event: "RAZORPAY_ORDER_FAILED",
      payload: { error: error.message, amountInINR },
      source
    });
    throw error;
  }
}

export function verifyPaymentSignature(sessionId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }, source = "human") {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret || secret.includes('placeholder')) {
    throw new Error("Missing valid RAZORPAY_KEY_SECRET in environment. Cannot perform cryptographically safe signature verification.");
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error("Invalid payload for signature verification: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.");
  }

  // Pure Cryptographic HMAC SHA256 Signature Verification
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const genBuf = Buffer.from(generatedSignature, 'utf-8');
  const recBuf = Buffer.from(razorpay_signature, 'utf-8');
  const isValid = genBuf.length === recBuf.length && crypto.timingSafeEqual(genBuf, recBuf);

  addAuditLog({
    sessionId,
    event: isValid ? "PAYMENT_VERIFIED_SUCCESS" : "PAYMENT_VERIFICATION_FAILED",
    payload: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      verified: isValid
    },
    source
  });

  return {
    verified: isValid,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    timestamp: new Date().toISOString()
  };
}
