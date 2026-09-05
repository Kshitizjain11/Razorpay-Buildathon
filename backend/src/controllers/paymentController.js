import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import { getCart, clearCart } from '../models/cart.js';
import { addAuditLog } from '../models/auditTrail.js';

// In-memory order tracker: Map<sessionId, existingOrder>
const activeOrdersMap = new Map();

export async function createCheckoutOrder(req, res) {
  try {
    const { sessionId, confirmExplicit = false } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }

    // Money Action Gate Check
    if (!confirmExplicit) {
      return res.status(403).json({
        success: false,
        error: "Money Safety Gate: Explicit customer confirmation is required before creating a payment order."
      });
    }

    const cart = getCart(sessionId);
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Check if non-expired existing order exists to prevent duplicate order creation
    if (activeOrdersMap.has(sessionId)) {
      const existing = activeOrdersMap.get(sessionId);
      if (existing.amount === Math.round(cart.total * 100)) {
        return res.json({
          success: true,
          isExisting: true,
          order: existing.order,
          cart,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_sample_key_id'
        });
      }
    }

    const source = req.headers['x-source'] || "human";
    const receiptId = `receipt_${sessionId.slice(0, 8)}_${Date.now()}`;
    let order;

    try {
      order = await createRazorpayOrder(sessionId, cart.total, receiptId, source);
    } catch (orderErr) {
      addAuditLog({
        sessionId,
        event: "RAZORPAY_ORDER_CREATION_FAILED",
        payload: {
          error: orderErr.message,
          cartPreserved: true,
          cartTotal: cart.total
        },
        source
      });

      return res.status(502).json({
        success: false,
        status: "ORDER_CREATION_FAILED",
        error: `Payment Gateway Order Creation Failed: ${orderErr.message}. Your cart is preserved safely.`,
        cart,
        canRetry: true
      });
    }

    // Cache active order for retry safety
    activeOrdersMap.set(sessionId, { order, amount: order.amount, createdAt: Date.now() });

    return res.json({
      success: true,
      order,
      cart,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_sample_key_id'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function verifyPayment(req, res) {
  try {
    const { sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing payment verification parameters" });
    }

    const source = req.headers['x-source'] || "human";
    const verification = verifyPaymentSignature(sessionId, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    }, source);

    if (verification.verified) {
      // Clear active order and cart upon verified success
      activeOrdersMap.delete(sessionId);
      const completedCart = { ...getCart(sessionId) };
      clearCart(sessionId);

      addAuditLog({
        sessionId,
        event: "ORDER_COMPLETED_PAID",
        payload: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          totalPaid: completedCart.total,
          itemsCount: completedCart.items.length
        },
        source
      });

      return res.json({
        success: true,
        status: "PAID",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        summary: completedCart
      });
    } else {
      addAuditLog({
        sessionId,
        event: "PAYMENT_VERIFICATION_FAILED",
        payload: { orderId: razorpay_order_id, reason: "Invalid signature" },
        source
      });

      return res.status(400).json({
        success: false,
        status: "VERIFICATION_FAILED",
        error: "Invalid Razorpay payment signature"
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/payment/failure -> Handle payment failure without losing cart
export function handlePaymentFailure(req, res) {
  try {
    const { sessionId, orderId, failureReason = "Payment dismissed or declined by bank" } = req.body;
    const source = req.headers['x-source'] || "human";

    const cart = getCart(sessionId);

    // Audit log failure
    addAuditLog({
      sessionId,
      event: "PAYMENT_FAILED_ATTEMPT",
      payload: {
        orderId,
        failureReason,
        cartPreserved: true,
        cartItemsCount: cart.items.length,
        cartTotal: cart.total
      },
      source
    });

    return res.json({
      success: true,
      status: "PAYMENT_FAILED_CART_PRESERVED",
      message: "Payment attempt was not completed. No charges went through. Your cart has been preserved safely.",
      cart,
      canRetry: true
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/payment/retry -> Safe retry without creating duplicate orders
export async function retryPayment(req, res) {
  try {
    const { sessionId } = req.body;
    const cart = getCart(sessionId);

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cannot retry payment: Cart is empty" });
    }

    const source = req.headers['x-source'] || "human";

    addAuditLog({
      sessionId,
      event: "PAYMENT_RETRY_INITIATED",
      payload: { cartTotal: cart.total, itemsCount: cart.items.length },
      source
    });

    // Reuse existing cached order if active or generate fresh single order
    if (activeOrdersMap.has(sessionId)) {
      const cached = activeOrdersMap.get(sessionId);
      return res.json({
        success: true,
        isRetry: true,
        order: cached.order,
        cart,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_sample_key_id'
      });
    }

    const receiptId = `retry_${sessionId.slice(0, 8)}_${Date.now()}`;
    const order = await createRazorpayOrder(sessionId, cart.total, receiptId, source);
    activeOrdersMap.set(sessionId, { order, amount: order.amount, createdAt: Date.now() });

    return res.json({
      success: true,
      isRetry: true,
      order,
      cart,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_sample_key_id'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/payment/log-checkout-initiated
export function logCheckoutInitiated(req, res) {
  try {
    const { sessionId, orderId } = req.body;
    const source = req.headers['x-source'] || "human";
    const cart = getCart(sessionId);

    addAuditLog({
      sessionId,
      event: "CHECKOUT_INITIATED",
      payload: {
        orderId,
        amountInINR: cart.total,
        itemsCount: cart.items ? cart.items.length : 0
      },
      source
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/payment/log-attempt-submitted
export function logPaymentAttemptSubmitted(req, res) {
  try {
    const { sessionId, orderId, paymentId } = req.body;
    const source = req.headers['x-source'] || "human";

    addAuditLog({
      sessionId,
      event: "PAYMENT_ATTEMPT_SUBMITTED",
      payload: {
        orderId,
        paymentId
      },
      source
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
