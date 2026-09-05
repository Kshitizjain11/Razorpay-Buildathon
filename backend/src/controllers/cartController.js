import { agentTools } from '../agents/salesAgent.js';
import { getCart, clearCart } from '../models/cart.js';

export function getSessionCart(req, res) {
  try {
    const { sessionId } = req.params;
    const cart = getCart(sessionId);
    return res.json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function addItemToCart(req, res) {
  try {
    const { sessionId, productId, quantity = 1, isUpsell = false, isCrossSell = false, userBudgetCeiling, overrideBudgetCap = false, addedReason } = req.body;
    if (!sessionId || !productId) {
      return res.status(400).json({ success: false, error: "sessionId and productId are required" });
    }

    const source = req.headers['x-source'] || "human";
    const updatedCart = agentTools.addToCart(sessionId, {
      productId,
      quantity,
      isUpsell,
      isCrossSell,
      userBudgetCeiling,
      overrideBudgetCap,
      addedReason
    }, source);

    return res.json({ success: true, cart: updatedCart });
  } catch (error) {
    if (error.hardReject) {
      return res.status(403).json({
        success: false,
        hardReject: true,
        requiresOverride: false,
        error: error.message,
        details: error.overrideDetails
      });
    }
    if (error.requiresOverride) {
      return res.status(400).json({
        success: false,
        requiresOverride: true,
        error: error.message,
        details: error.overrideDetails
      });
    }
    return res.status(400).json({ success: false, error: error.message });
  }
}

export function removeItemFromCart(req, res) {
  try {
    const { sessionId, productId } = req.body;
    if (!sessionId || !productId) {
      return res.status(400).json({ success: false, error: "sessionId and productId are required" });
    }

    const source = req.headers['x-source'] || "human";
    const updatedCart = agentTools.removeFromCart(sessionId, { productId }, source);
    return res.json({ success: true, cart: updatedCart });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function updateItemQuantity(req, res) {
  try {
    const { sessionId, productId, quantity, userBudgetCeiling, overrideBudgetCap = false } = req.body;
    if (!sessionId || !productId || quantity === undefined) {
      return res.status(400).json({ success: false, error: "sessionId, productId, and quantity are required" });
    }

    const source = req.headers['x-source'] || "human";
    const updatedCart = agentTools.updateCart(sessionId, { productId, quantity, userBudgetCeiling, overrideBudgetCap }, source);
    return res.json({ success: true, cart: updatedCart });
  } catch (error) {
    if (error.hardReject) {
      return res.status(403).json({
        success: false,
        hardReject: true,
        requiresOverride: false,
        error: error.message,
        details: error.overrideDetails
      });
    }
    if (error.requiresOverride) {
      return res.status(400).json({
        success: false,
        requiresOverride: true,
        error: error.message,
        details: error.overrideDetails
      });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function emptyCart(req, res) {
  try {
    const { sessionId } = req.params;
    const cart = clearCart(sessionId);
    return res.json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
