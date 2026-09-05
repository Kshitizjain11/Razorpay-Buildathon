const API_BASE = '/api';

export async function fetchCatalog(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/catalog?${query}`);
  return res.json();
}

export async function sendAgentMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/agent/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message })
  });
  return res.json();
}

export async function fetchCart(sessionId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}`);
  return res.json();
}

export async function addToCartApi({ sessionId, productId, quantity = 1, isUpsell = false, isCrossSell = false, userBudgetCeiling, overrideBudgetCap = false, addedReason }) {
  const res = await fetch(`${API_BASE}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      productId,
      quantity,
      isUpsell,
      isCrossSell,
      userBudgetCeiling,
      overrideBudgetCap,
      addedReason
    })
  });
  return res.json();
}

export async function updateCartQuantityApi({ sessionId, productId, quantity, userBudgetCeiling, overrideBudgetCap = false }) {
  const res = await fetch(`${API_BASE}/cart/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, productId, quantity, userBudgetCeiling, overrideBudgetCap })
  });
  return res.json();
}

export async function removeFromCartApi({ sessionId, productId }) {
  const res = await fetch(`${API_BASE}/cart/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, productId })
  });
  return res.json();
}

export async function createCheckoutOrderApi({ sessionId, confirmExplicit = true }) {
  const res = await fetch(`${API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, confirmExplicit })
  });
  return res.json();
}

export async function verifyPaymentApi({ sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const res = await fetch(`${API_BASE}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature })
  });
  return res.json();
}

export async function recordPaymentFailureApi({ sessionId, orderId, failureReason }) {
  const res = await fetch(`${API_BASE}/payment/failure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, orderId, failureReason })
  });
  return res.json();
}

export async function retryPaymentApi({ sessionId }) {
  const res = await fetch(`${API_BASE}/payment/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  return res.json();
}

export async function logCheckoutInitiatedApi({ sessionId, orderId }) {
  const res = await fetch(`${API_BASE}/payment/log-checkout-initiated`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, orderId })
  });
  return res.json();
}

export async function logPaymentAttemptSubmittedApi({ sessionId, orderId, paymentId }) {
  const res = await fetch(`${API_BASE}/payment/log-attempt-submitted`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, orderId, paymentId })
  });
  return res.json();
}

export async function fetchAuditLogs(sessionId) {
  const query = sessionId ? `?sessionId=${sessionId}` : '';
  const res = await fetch(`${API_BASE}/audit${query}`);
  return res.json();
}

export async function fetchDashboardMetrics() {
  const res = await fetch(`${API_BASE}/dashboard/metrics`);
  return res.json();
}
