// In-memory cart store: Map<sessionId, cartObject>
const carts = new Map();

export function getCart(sessionId) {
  if (!carts.has(sessionId)) {
    carts.set(sessionId, {
      sessionId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      budgetCeiling: null,
      updatedAt: new Date().toISOString()
    });
  }
  return carts.get(sessionId);
}

export function setCartBudgetCeiling(sessionId, budgetCeiling) {
  const cart = getCart(sessionId);
  if (budgetCeiling && typeof budgetCeiling === 'number' && budgetCeiling > 0) {
    cart.budgetCeiling = budgetCeiling;
  }
  return cart;
}

export function getCartBudgetCeiling(sessionId) {
  const cart = getCart(sessionId);
  return cart.budgetCeiling;
}

export function calculateCart(cart) {
  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.price * item.quantity;
  });
  
  // 18% GST calculation
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  cart.subtotal = subtotal;
  cart.tax = tax;
  cart.total = total;
  cart.updatedAt = new Date().toISOString();

  return cart;
}

export function addToCart(sessionId, product, quantity = 1, metadata = {}) {
  const cart = getCart(sessionId);
  const existingItemIndex = cart.items.findIndex(item => item.productId === product.id);

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
    if (metadata.addedReason) {
      cart.items[existingItemIndex].addedReason = metadata.addedReason;
    }
  } else {
    cart.items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      category: product.category,
      isUpsell: metadata.isUpsell || false,
      isCrossSell: metadata.isCrossSell || false,
      addedReason: metadata.addedReason || "User selection"
    });
  }

  return calculateCart(cart);
}

export function removeFromCart(sessionId, productId) {
  const cart = getCart(sessionId);
  cart.items = cart.items.filter(item => item.productId !== productId);
  return calculateCart(cart);
}

export function updateCartQuantity(sessionId, productId, quantity) {
  const cart = getCart(sessionId);
  if (quantity <= 0) {
    return removeFromCart(sessionId, productId);
  }

  const item = cart.items.find(i => i.productId === productId);
  if (item) {
    item.quantity = quantity;
  }
  return calculateCart(cart);
}

export function clearCart(sessionId) {
  const cart = getCart(sessionId);
  cart.items = [];
  return calculateCart(cart);
}
