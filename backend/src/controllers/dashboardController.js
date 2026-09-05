import { getAllAuditLogs } from '../models/auditTrail.js';

export function getMerchantDashboardMetrics(req, res) {
  try {
    const logs = getAllAuditLogs();

    // 1. Revenue Metrics
    let totalGmv = 0;
    let aiAssistedGmv = 0;
    let completedOrdersCount = 0;

    // 2. Conversion Metrics
    const conversationsStarted = new Set();
    const cartsCreated = new Set();

    // 3. AI Optimization Metrics
    let upsellOffersMade = 0;
    let upsellOffersAccepted = 0;
    let crossSellOffersMade = 0;
    let crossSellOffersAccepted = 0;
    let additionalUpsellRevenue = 0;

    // 4. Agent Activity Metrics
    let recommendationsMade = 0;
    let paymentAttempts = 0;
    let successfulPayments = 0;
    let failedPayments = 0;

    logs.forEach(log => {
      const { event, payload, sessionId, source } = log;
      if (sessionId) conversationsStarted.add(sessionId);

      switch (event) {
        case 'USER_MESSAGE_RECEIVED':
          break;

        case 'RECOMMENDATION_GENERATED':
          recommendationsMade++;
          if (payload.upsellOffered) {
            upsellOffersMade++;
          }
          if (payload.crossSellsOffered && Array.isArray(payload.crossSellsOffered)) {
            crossSellOffersMade += payload.crossSellsOffered.length;
          }
          break;

        case 'CART_ITEM_ADDED':
          if (sessionId) cartsCreated.add(sessionId);
          if (payload.isUpsell) {
            upsellOffersAccepted++;
            if (payload.price) additionalUpsellRevenue += payload.price * (payload.quantity || 1);
          }
          if (payload.isCrossSell) {
            crossSellOffersAccepted++;
            if (payload.price) additionalUpsellRevenue += payload.price * (payload.quantity || 1);
          }
          break;

        case 'RAZORPAY_ORDER_CREATED':
          paymentAttempts++;
          break;

        case 'ORDER_COMPLETED_PAID':
          successfulPayments++;
          completedOrdersCount++;
          if (payload.totalPaid) {
            totalGmv += payload.totalPaid;
            aiAssistedGmv += payload.totalPaid;
          }
          break;

        case 'PAYMENT_FAILED_ATTEMPT':
        case 'PAYMENT_VERIFICATION_FAILED':
          failedPayments++;
          break;
      }
    });

    const averageOrderValue = completedOrdersCount > 0 ? Math.round(totalGmv / completedOrdersCount) : 0;
    const conversionRate = conversationsStarted.size > 0 
      ? Math.round((completedOrdersCount / conversationsStarted.size) * 100)
      : 0;

    return res.json({
      success: true,
      metrics: {
        revenue: {
          totalGmv,
          aiAssistedGmv,
          averageOrderValue,
          completedOrdersCount
        },
        conversion: {
          conversationsStarted: conversationsStarted.size,
          cartsCreated: cartsCreated.size,
          completedPurchases: completedOrdersCount,
          conversionRatePercent: conversionRate
        },
        aiOptimization: {
          upsellOffersMade,
          upsellOffersAccepted,
          crossSellOffersMade,
          crossSellOffersAccepted,
          additionalRevenueGenerated: additionalUpsellRevenue
        },
        agentActivity: {
          recommendationsMade,
          paymentAttempts,
          successfulPayments,
          failedPayments
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
