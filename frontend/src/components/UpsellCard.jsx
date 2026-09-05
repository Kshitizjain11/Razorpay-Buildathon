import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function UpsellCard({ boundedUpsell, budgetCeiling, onApproveUpsell }) {
  if (!boundedUpsell || !boundedUpsell.product) return null;

  const { product, priceAboveBudget, percentAboveBudget, reasoning } = boundedUpsell;

  return (
    <div className="relative glass-panel rounded-xl p-5 border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 shadow-xl shadow-amber-500/5 mb-6">
      {/* Top Banner Badge */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-500/20">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-amber-400 text-sm">Bounded Stretch Option (Optional Upsell)</h4>
            <p className="text-[11px] text-slate-400">Strictly capped within 20% budget deviation limit</p>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full">
            +{percentAboveBudget}% Above Budget
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-baseline space-x-3">
            <h3 className="font-bold text-white text-base">{product.name}</h3>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-amber-400 text-lg">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400">
                (₹{Math.round(product.price * 1.18).toLocaleString('en-IN')} incl. GST)
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {product.description}
          </p>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-500/30 text-xs text-slate-200">
            <div className="flex items-center space-x-1.5 text-amber-300 font-semibold text-[11px] mb-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Money Safety Justification:</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-amber-100/90">{reasoning}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-center space-y-3">
          <div className="text-xs text-slate-400">
            <div>Budget: <span className="font-semibold text-slate-200">₹{Number(budgetCeiling).toLocaleString('en-IN')}</span></div>
            <div>Difference: <span className="font-semibold text-amber-400">+₹{priceAboveBudget.toLocaleString('en-IN')} (incl. GST)</span></div>
          </div>

          <button
            onClick={() => onApproveUpsell(product, boundedUpsell)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs rounded-lg shadow-lg shadow-amber-600/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Explicitly Approve & Add</span>
          </button>
          
          <span className="text-[10px] text-slate-500">Requires separate explicit approval (never auto-added)</span>
        </div>
      </div>
    </div>
  );
}
