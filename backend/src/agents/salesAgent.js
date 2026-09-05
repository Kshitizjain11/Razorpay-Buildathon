import { extractRequirements, rankRecommendations } from '../services/revenueMaximizerService.js';
import { searchProducts, getProductById } from '../models/catalog.js';
import { getCart, addToCart, removeFromCart, updateCartQuantity, calculateCart, setCartBudgetCeiling, getCartBudgetCeiling } from '../models/cart.js';
import { addAuditLog } from '../models/auditTrail.js';
import { MAX_UPSELL_DEVIATION, getPostTaxPrice, calculateTaxAndTotal } from '../config/constants.js';

// Deterministic Tool Engine callable by LLM or Agent Loop
export const agentTools = {
  searchProducts: (args) => {
    return searchProducts(args);
  },

  getProduct: (args) => {
    return getProductById(args.id);
  },

  addToCart: (sessionId, args, source = "human") => {
    const product = getProductById(args.productId);
    if (!product) {
      throw new Error(`Product ${args.productId} not found`);
    }

    const budgetCeiling = args.userBudgetCeiling || getCartBudgetCeiling(sessionId);
    if (budgetCeiling && typeof budgetCeiling === 'number' && budgetCeiling > 0) {
      setCartBudgetCeiling(sessionId, budgetCeiling);
    }
    const currentCart = getCart(sessionId);
    const addedQty = args.quantity || 1;
    
    // Projected cumulative cart totals (pre-tax subtotal, tax, and post-tax total)
    const projectedSubtotal = currentCart.subtotal + (product.price * addedQty);
    const { tax: projectedTax, total: projectedTotal } = calculateTaxAndTotal(projectedSubtotal);
    const productPostTaxPrice = getPostTaxPrice(product.price);
    const productPostTaxTotal = productPostTaxPrice * addedQty;

    if (budgetCeiling && budgetCeiling > 0) {
      const maxAllowedCap = Math.round(budgetCeiling * (1 + MAX_UPSELL_DEVIATION));

      // ZONE 3: Above 120% -> HARD REJECT (Non-overridable under any circumstance)
      if (projectedTotal > maxAllowedCap || productPostTaxPrice > maxAllowedCap) {
        addAuditLog({
          sessionId,
          event: "BUDGET_HARD_CAP_VIOLATION_BLOCKED",
          payload: {
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            productPostTaxPrice,
            quantity: addedQty,
            currentTotal: currentCart.total,
            projectedTotal,
            budgetCeiling,
            maxAllowedCap,
            breachAmount: Math.max(projectedTotal, productPostTaxPrice) - maxAllowedCap
          },
          source
        });

        const err = new Error(`Hard Money-Safety Violation: Adding ${product.name} pushes cumulative cart total to ₹${projectedTotal.toLocaleString('en-IN')} (incl. GST), exceeding the absolute 120% ceiling of ₹${maxAllowedCap.toLocaleString('en-IN')} (stated budget ₹${budgetCeiling.toLocaleString('en-IN')} + 20% cap). This hard ceiling cannot be overridden under any circumstance.`);
        err.hardReject = true;
        err.requiresOverride = false;
        err.overrideDetails = {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productPostTaxPrice,
          quantity: addedQty,
          currentSubtotal: currentCart.subtotal,
          currentTotal: currentCart.total,
          projectedSubtotal,
          projectedTotal,
          budgetCeiling,
          maxAllowedCap,
          hardReject: true
        };
        throw err;
      }

      // ZONE 2: Budget to 120% -> GATED (Approvable only with explicit user override consent)
      const exceedsBudget = (projectedTotal > budgetCeiling && !args.isUpsell) || (productPostTaxPrice > budgetCeiling && !args.isUpsell);
      if (exceedsBudget) {
        if (args.overrideBudgetCap === true) {
          addAuditLog({
            sessionId,
            event: "BUDGET_OVERRIDE_APPROVED",
            payload: {
              productId: product.id,
              productName: product.name,
              price: product.price,
              postTaxPrice: productPostTaxPrice,
              oldSubtotal: currentCart.subtotal,
              newSubtotal: projectedSubtotal,
              oldTotal: currentCart.total,
              newTotal: projectedTotal,
              budgetCeiling,
              maxAllowedCap
            },
            source
          });
        } else {
          const err = new Error(`Money Safety Warning: Adding ${product.name} (₹${product.price.toLocaleString('en-IN')} + GST = ₹${productPostTaxPrice.toLocaleString('en-IN')}) pushes cumulative cart total to ₹${projectedTotal.toLocaleString('en-IN')} (incl. GST), exceeding your ₹${budgetCeiling.toLocaleString('en-IN')} budget cap.`);
          err.requiresOverride = true;
          err.hardReject = false;
          err.overrideDetails = {
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            productPostTaxPrice,
            quantity: addedQty,
            currentSubtotal: currentCart.subtotal,
            currentTotal: currentCart.total,
            projectedSubtotal,
            projectedTotal,
            budgetCeiling,
            maxAllowedCap,
            hardReject: false,
            isUpsell: args.isUpsell || false,
            isCrossSell: args.isCrossSell || false,
            addedReason: args.addedReason || "User selection"
          };
          throw err;
        }
      }

      // ZONE 1: <= budgetCeiling -> Auto-allowed without gating
    }

    const updatedCart = addToCart(sessionId, product, args.quantity || 1, {
      isUpsell: args.isUpsell || false,
      isCrossSell: args.isCrossSell || false,
      budgetOverride: args.overrideBudgetCap || false,
      addedReason: args.addedReason || "User selection"
    });

    addAuditLog({
      sessionId,
      event: "CART_ITEM_ADDED",
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: args.quantity || 1,
        isUpsell: args.isUpsell || false,
        isCrossSell: args.isCrossSell || false,
        budgetOverride: args.overrideBudgetCap || false,
        cartSubtotal: updatedCart.subtotal,
        cartTotal: updatedCart.total
      },
      source
    });

    return updatedCart;
  },

  removeFromCart: (sessionId, args, source = "human") => {
    const updatedCart = removeFromCart(sessionId, args.productId);
    addAuditLog({
      sessionId,
      event: "CART_ITEM_REMOVED",
      payload: { productId: args.productId, cartSubtotal: updatedCart.subtotal, cartTotal: updatedCart.total },
      source
    });
    return updatedCart;
  },

  updateCart: (sessionId, args, source = "human") => {
    const budgetCeiling = args.userBudgetCeiling || getCartBudgetCeiling(sessionId);
    if (budgetCeiling && typeof budgetCeiling === 'number' && budgetCeiling > 0) {
      setCartBudgetCeiling(sessionId, budgetCeiling);
    }
    const currentCart = getCart(sessionId);
    const targetItem = currentCart.items.find(i => i.productId === args.productId);

    if (targetItem && budgetCeiling && budgetCeiling > 0 && args.quantity > targetItem.quantity) {
      const maxAllowedCap = Math.round(budgetCeiling * (1 + MAX_UPSELL_DEVIATION));
      const qtyDiff = args.quantity - targetItem.quantity;
      const projectedSubtotal = currentCart.subtotal + (targetItem.price * qtyDiff);
      const { tax: projectedTax, total: projectedTotal } = calculateTaxAndTotal(projectedSubtotal);
      const itemPostTaxPrice = getPostTaxPrice(targetItem.price);

      // ZONE 3: Above 120% -> HARD REJECT (Non-overridable under any circumstance)
      if (projectedTotal > maxAllowedCap) {
        addAuditLog({
          sessionId,
          event: "BUDGET_HARD_CAP_VIOLATION_BLOCKED",
          payload: {
            productId: targetItem.productId,
            productName: targetItem.name,
            newQuantity: args.quantity,
            oldTotal: currentCart.total,
            projectedTotal,
            budgetCeiling,
            maxAllowedCap,
            breachAmount: projectedTotal - maxAllowedCap
          },
          source
        });

        const err = new Error(`Hard Money-Safety Violation: Increasing ${targetItem.name} quantity to ${args.quantity} pushes cumulative cart total to ₹${projectedTotal.toLocaleString('en-IN')} (incl. GST), exceeding the absolute 120% ceiling of ₹${maxAllowedCap.toLocaleString('en-IN')} (budget ₹${budgetCeiling.toLocaleString('en-IN')} + 20% cap). This hard ceiling cannot be overridden under any circumstance.`);
        err.hardReject = true;
        err.requiresOverride = false;
        err.overrideDetails = {
          productId: targetItem.productId,
          productName: targetItem.name,
          productPrice: targetItem.price,
          productPostTaxPrice: itemPostTaxPrice,
          quantity: args.quantity,
          currentSubtotal: currentCart.subtotal,
          currentTotal: currentCart.total,
          projectedSubtotal,
          projectedTotal,
          budgetCeiling,
          maxAllowedCap,
          hardReject: true
        };
        throw err;
      }

      // ZONE 2: Budget to 120% -> GATED (Approvable only with explicit user override consent)
      if (projectedTotal > budgetCeiling && !targetItem.isUpsell) {
        if (args.overrideBudgetCap === true) {
          addAuditLog({
            sessionId,
            event: "BUDGET_OVERRIDE_APPROVED",
            payload: {
              productId: targetItem.productId,
              productName: targetItem.name,
              newQuantity: args.quantity,
              oldSubtotal: currentCart.subtotal,
              newSubtotal: projectedSubtotal,
              oldTotal: currentCart.total,
              newTotal: projectedTotal,
              budgetCeiling,
              maxAllowedCap
            },
            source
          });
        } else {
          const err = new Error(`Money Safety Warning: Increasing quantity to ${args.quantity} pushes cumulative cart total to ₹${projectedTotal.toLocaleString('en-IN')} (incl. GST), exceeding your ₹${budgetCeiling.toLocaleString('en-IN')} budget cap.`);
          err.requiresOverride = true;
          err.hardReject = false;
          err.overrideDetails = {
            productId: targetItem.productId,
            productName: targetItem.name,
            productPrice: targetItem.price,
            productPostTaxPrice: itemPostTaxPrice,
            quantity: args.quantity,
            currentSubtotal: currentCart.subtotal,
            currentTotal: currentCart.total,
            projectedSubtotal,
            projectedTotal,
            budgetCeiling,
            maxAllowedCap,
            hardReject: false,
            isUpsell: targetItem.isUpsell || false,
            isCrossSell: targetItem.isCrossSell || false,
            addedReason: targetItem.addedReason || "Quantity update"
          };
          throw err;
        }
      }

      // ZONE 1: <= budgetCeiling -> Auto-allowed without gating
    }

    const updatedCart = updateCartQuantity(sessionId, args.productId, args.quantity);
    const updatedItem = updatedCart.items.find(i => i.productId === args.productId);
    addAuditLog({
      sessionId,
      event: "CART_QUANTITY_UPDATED",
      payload: { 
        productId: args.productId, 
        quantity: args.quantity, 
        cartSubtotal: updatedCart.subtotal,
        cartTotal: updatedCart.total,
        isUpsell: updatedItem?.isUpsell || false,
        isCrossSell: updatedItem?.isCrossSell || false
      },
      source
    });
    return updatedCart;
  },

  calculateCart: (sessionId) => {
    const cart = getCart(sessionId);
    return calculateCart(cart);
  }
};

export async function processUserMessage(sessionId, userMessage, source = "human") {
  // 1. Audit Log: Conversation Started / Message Received
  addAuditLog({
    sessionId,
    event: "USER_MESSAGE_RECEIVED",
    payload: { message: userMessage },
    source
  });

  // 2. Requirement Extraction Tool Call
  const requirements = await extractRequirements(userMessage);

  // Store active budget ceiling on session cart
  if (requirements && requirements.budget_ceiling) {
    setCartBudgetCeiling(sessionId, requirements.budget_ceiling);
  }

  addAuditLog({
    sessionId,
    event: "REQUIREMENTS_EXTRACTED",
    payload: requirements,
    source
  });

  // 3. Recommendation Reasoning & Bounded Upsell Search
  const recommendationData = rankRecommendations(requirements);

  addAuditLog({
    sessionId,
    event: "RECOMMENDATION_GENERATED",
    payload: {
      primaryProductId: recommendationData.primaryRecommendation?.id,
      primaryProductName: recommendationData.primaryRecommendation?.name,
      reason: recommendationData.recommendationReason,
      upsellOffered: recommendationData.boundedUpsell ? {
        productId: recommendationData.boundedUpsell.product.id,
        priceAboveBudget: recommendationData.boundedUpsell.priceAboveBudget,
        percentAboveBudget: recommendationData.boundedUpsell.percentAboveBudget
      } : null,
      crossSellsOffered: recommendationData.crossSells ? recommendationData.crossSells.map(c => c.product.id) : []
    },
    source
  });

  // Construct structured response for UI
  return {
    sessionId,
    userMessage,
    requirements,
    recommendation: recommendationData.primaryRecommendation,
    reasoning: recommendationData.recommendationReason,
    conversationalExplanation: recommendationData.conversationalExplanation,
    boundedUpsell: recommendationData.boundedUpsell,
    crossSells: recommendationData.crossSells,
    alternatives: recommendationData.alternativeOptions,
    cart: getCart(sessionId)
  };
}
