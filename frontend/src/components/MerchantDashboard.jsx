import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Users, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchDashboardMetrics } from '../services/api';

export default function MerchantDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = () => {
    setLoading(true);
    fetchDashboardMetrics()
      .then(res => {
        if (res.success) setMetrics(res.metrics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-400" />
        <p className="text-xs">Computing Merchant Revenue Metrics...</p>
      </div>
    );
  }

  const { revenue, conversion, aiOptimization, agentActivity } = metrics || {
    revenue: { totalGmv: 0, aiAssistedGmv: 0, averageOrderValue: 0 },
    conversion: { conversationsStarted: 0, cartsCreated: 0, completedPurchases: 0, conversionRatePercent: 0 },
    aiOptimization: { upsellOffersMade: 0, upsellOffersAccepted: 0, crossSellOffersMade: 0, crossSellOffersAccepted: 0, additionalRevenueGenerated: 0 },
    agentActivity: { recommendationsMade: 0, paymentAttempts: 0, successfulPayments: 0, failedPayments: 0 }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Merchant Analytics & AI Revenue Dashboard</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              Live Real-Time Data
            </span>
          </h2>
          <p className="text-xs text-slate-400">Track GMV growth, conversion rates, and autonomous AI revenue optimization.</p>
        </div>

        <button
          onClick={loadMetrics}
          className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Row 1: High Level Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* GMV */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total GMV</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            ₹{revenue.totalGmv.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">AI-Assisted: 100%</div>
        </div>

        {/* Average Order Value */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-400">
            ₹{revenue.averageOrderValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From {revenue.completedOrdersCount} paid orders</div>
        </div>

        {/* Additional AI Revenue */}
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">AI Upsell & Cross-Sell</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            +₹{aiOptimization.additionalRevenueGenerated.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1">Direct incremental revenue</div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion Rate</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-400">
            {conversion.conversionRatePercent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {conversion.completedPurchases} / {conversion.conversationsStarted} sessions
          </div>
        </div>
      </div>

      {/* Row 2: Deep Dive Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel Breakdown */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
            Sales Funnel Performance
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300">Conversations Started</span>
              <span className="font-bold text-white">{conversion.conversationsStarted}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300">Carts Built</span>
              <span className="font-bold text-blue-400">{conversion.cartsCreated}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300">Completed Paid Orders</span>
              <span className="font-bold text-emerald-400">{conversion.completedPurchases}</span>
            </div>
          </div>
        </div>

        {/* AI Optimization Efficiency */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider border-b border-slate-800 pb-2">
            AI Upsell & Cross-Sell Acceptance
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300">Bounded Upsells Offered</span>
              <span className="font-bold text-amber-400">{aiOptimization.upsellOffersMade}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300">Bounded Upsells Approved by Customer</span>
              <span className="font-bold text-emerald-400">{aiOptimization.upsellOffersAccepted}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300">Cross-Sells Approved</span>
              <span className="font-bold text-indigo-400">{aiOptimization.crossSellOffersAccepted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
