import { v4 as uuidv4 } from 'uuid';
import { rankRecommendations } from '../services/revenueMaximizerService.js';
import { getProductById } from '../models/catalog.js';
import { getCart, addToCart, clearCart } from '../models/cart.js';
import { createRazorpayOrder } from '../services/razorpayService.js';
import { addAuditLog } from '../models/auditTrail.js';

// In-memory quote cache: Map<quoteId, quoteData>
const quotesCache = new Map();

// POST /api/quote -> Programmatic AI Buyer Agent Quote Request
export function createAgentQuote(req, res) {
  try {
    const { item_id, category, budget_ceiling, must_haves = [], nice_to_haves = [], dealbreakers = [] } = req.body;

    let targetCategory = category || "All";
    let budgetCeiling = budget_ceiling || 25000;

    if (item_id) {
      const prod = getProductById(item_id);
      if (prod) {
        targetCategory = prod.category;
        if (!budget_ceiling) budgetCeiling = prod.price;
      }
    }

    const requirements = {
      category: targetCategory,
      budget_ceiling: budgetCeiling,
      must_haves,
      nice_to_haves,
      dealbreakers
    };

    const recommendationData = rankRecommendations(requirements);
    const quoteId = `quote-${uuidv4().slice(0, 8)}`;

    const quoteRecord = {
      quoteId,
      timestamp: new Date().toISOString(),
      source: "agent-to-agent-api",
      requirements,
      recommendation: recommendationData.primaryRecommendation,
      recommendationReason: recommendationData.recommendationReason,
      tradeoffComparison: recommendationData.tradeoffComparison || null,
      boundedUpsell: recommendationData.boundedUpsell,
      crossSells: recommendationData.crossSells,
      totalQuotedAmount: recommendationData.primaryRecommendation ? Math.round(recommendationData.primaryRecommendation.price * 1.18) : 0
    };

    quotesCache.set(quoteId, quoteRecord);

    // Audit log
    addAuditLog({
      sessionId: quoteId,
      event: "AGENT_QUOTE_GENERATED",
      payload: {
        quoteId,
        requirements,
        recommendationId: recommendationData.primaryRecommendation?.id,
        hasCloseContender: !!recommendationData.tradeoffComparison,
        contenderProductId: recommendationData.tradeoffComparison?.contenderProduct?.id || null,
        tradeoffSummary: recommendationData.tradeoffComparison?.tradeoffSummary || null,
        boundedUpsellId: recommendationData.boundedUpsell?.product?.id
      },
      source: "agent-api"
    });

    return res.json({
      success: true,
      quote_id: quoteId,
      quote: quoteRecord
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/orders/confirm -> Programmatic AI Buyer Agent Order Confirmation
export async function confirmAgentOrder(req, res) {
  try {
    const { quote_id, accept = true, include_upsell = false, include_cross_sells = [], select_contender = false } = req.body;

    if (!quote_id || !quotesCache.has(quote_id)) {
      return res.status(404).json({ success: false, error: "Quote ID not found or expired" });
    }

    const quote = quotesCache.get(quote_id);

    // Replay Safety Protection: Prevent multiple order creation from single quote
    if (quote.consumed) {
      return res.status(409).json({
        success: false,
        error: "Replay Safety Violation: Quote ID has already been consumed and converted into an order.",
        consumedAt: quote.consumedAt
      });
    }

    if (!accept) {
      return res.json({ success: false, status: "REJECTED", message: "Agent caller declined quote" });
    }

    const sessionId = `agent-order-${quote_id}`;
    
    // Clear and build session cart
    clearCart(sessionId);

    // Set budget ceiling on session cart for tool validation
    if (quote.requirements && quote.requirements.budget_ceiling) {
      const { setCartBudgetCeiling } = await import('../models/cart.js');
      setCartBudgetCeiling(sessionId, quote.requirements.budget_ceiling);
    }

    // Determine whether to add default primary recommendation or contender product
    let selectedMainProduct = quote.recommendation;
    let selectedReason = quote.recommendationReason;

    if (select_contender && quote.tradeoffComparison?.contenderProduct) {
      selectedMainProduct = quote.tradeoffComparison.contenderProduct;
      selectedReason = `AI Buyer chose contender based on trade-off: ${quote.tradeoffComparison.tradeoffSummary}`;

      addAuditLog({
        sessionId,
        event: "AGENT_SELECTED_CONTENDER_TRADEOFF",
        payload: {
          quoteId: quote.quoteId,
          primaryProductId: quote.recommendation?.id,
          contenderProductId: selectedMainProduct.id,
          tradeoffSummary: quote.tradeoffComparison.tradeoffSummary
        },
        source: "agent-api"
      });
    }

    // Add main chosen product
    if (selectedMainProduct) {
      addToCart(sessionId, selectedMainProduct, 1, {
        isUpsell: false,
        addedReason: selectedReason
      });
    }

    // Add upsell if explicitly requested
    if (include_upsell && quote.boundedUpsell && quote.boundedUpsell.product) {
      addToCart(sessionId, quote.boundedUpsell.product, 1, {
        isUpsell: true,
        userBudgetCeiling: quote.requirements.budget_ceiling,
        addedReason: quote.boundedUpsell.reasoning
      });
    }

    // Add requested cross sells
    if (Array.isArray(include_cross_sells) && include_cross_sells.length > 0 && quote.crossSells) {
      for (const csId of include_cross_sells) {
        const match = quote.crossSells.find(c => c.product.id === csId);
        if (match && match.product) {
          addToCart(sessionId, match.product, 1, {
            isCrossSell: true,
            addedReason: match.reasoning
          });
        }
      }
    }

    const currentCart = getCart(sessionId);
    if (!currentCart.items || currentCart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cannot confirm order with empty cart" });
    }

    // Money Safety Invariant: Enforce that post-tax cart.total does not exceed bounded cap (budget * 1.20)
    if (quote.requirements && quote.requirements.budget_ceiling) {
      const budgetCeiling = quote.requirements.budget_ceiling;
      const maxAllowedCap = Math.round(budgetCeiling * 1.20);
      if (currentCart.total > maxAllowedCap) {
        return res.status(400).json({
          success: false,
          error: `Money Safety Breach: Order total ₹${currentCart.total.toLocaleString('en-IN')} (incl. GST) exceeds maximum allowed bounded cap of ₹${maxAllowedCap.toLocaleString('en-IN')} (20% over budget ceiling ₹${budgetCeiling.toLocaleString('en-IN')}).`,
          cartTotal: currentCart.total,
          budgetCeiling,
          maxAllowedCap
        });
      }
    }

    // Create Gated Razorpay Order
    const receiptId = `rcpt_agent_${quote_id}_${Date.now()}`;
    const order = await createRazorpayOrder(sessionId, currentCart.total, receiptId, "agent-api");

    // Mark quote as consumed to prevent replay
    quote.consumed = true;
    quote.consumedAt = new Date().toISOString();

    // Audit log
    addAuditLog({
      sessionId,
      event: "AGENT_ORDER_CONFIRMED",
      payload: {
        quoteId: quote_id,
        razorpayOrderId: order.id,
        amount: order.amount,
        itemsCount: currentCart.items.length
      },
      source: "agent-api"
    });

    return res.json({
      success: true,
      status: "GATED_ORDER_CREATED",
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      cart: currentCart,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
