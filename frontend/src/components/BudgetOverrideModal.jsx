import React from 'react';
import { AlertTriangle, ShieldCheck, X, DollarSign, ArrowRight } from 'lucide-react';

export default function BudgetOverrideModal({ isOpen, onClose, onConfirm, details, isProcessing }) {
  if (!isOpen || !details) return null;

  const {
    productName,
    productPrice,
    productPostTaxPrice = Math.round((productPrice || 0) * 1.18),
    currentSubtotal = 0,
    currentTotal = Math.round(currentSubtotal * 1.18),
    projectedSubtotal = 0,
    projectedTotal = Math.round(projectedSubtotal * 1.18),
    budgetCeiling = 0,
    maxAllowedCap = 0
  } = details;

  const effectiveProjectedTotal = projectedTotal || projectedSubtotal;
  const extensionAmount = Math.max(0, effectiveProjectedTotal - budgetCeiling);
  const isHardReject = details.hardReject || (maxAllowedCap > 0 && effectiveProjectedTotal > maxAllowedCap);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-slate-900 border rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 relative ${
        isHardReject ? 'border-rose-500/50 shadow-rose-950/30' : 'border-amber-500/30 shadow-amber-950/20'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
            isHardReject 
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider ${
              isHardReject ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {isHardReject ? 'Zone 3: Absolute Ceiling Breached (Hard Reject)' : 'Zone 2: Money-Safety Guardrail Triggered'}
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              {isHardReject ? '120% Absolute Budget Cap Exceeded' : 'Explicit Budget Extension Required'}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          {isHardReject ? (
            <>Adding <strong className="text-white">{productName}</strong> pushes total to <span className="text-rose-400 font-semibold">₹{effectiveProjectedTotal?.toLocaleString('en-IN')}</span>, exceeding the absolute 120% ceiling of <span className="text-rose-300 font-semibold">₹{maxAllowedCap?.toLocaleString('en-IN')}</span> (stated budget ₹{budgetCeiling?.toLocaleString('en-IN')} + 20% cap). <strong>This hard ceiling cannot be overridden.</strong></>
          ) : (
            <>Adding <strong className="text-white">{productName}</strong> (₹{productPrice?.toLocaleString('en-IN')} + GST = <span className="text-amber-300 font-semibold">₹{productPostTaxPrice?.toLocaleString('en-IN')}</span>) will push your post-tax cart total past your stated <span className="text-amber-300 font-semibold">₹{budgetCeiling?.toLocaleString('en-IN')}</span> budget ceiling.</>
          )}
        </p>

        {/* Pricing Comparison Breakdown */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800/80">
            <span>Stated Budget Ceiling:</span>
            <span className="font-semibold text-slate-200">₹{budgetCeiling?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800/80">
            <span>Absolute 120% Cap:</span>
            <span className={`font-semibold ${isHardReject ? 'text-rose-400' : 'text-slate-300'}`}>₹{maxAllowedCap?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-slate-300">
            <span>Current Cart Total (incl. GST):</span>
            <span className="font-medium text-slate-200">₹{currentTotal?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center text-sm text-slate-300">
            <span>Selected Item / Add-on:</span>
            <span className="font-medium text-amber-300">+₹{productPostTaxPrice?.toLocaleString('en-IN')} <span className="text-xs text-slate-400">(incl. GST)</span></span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-base font-bold">
            <span className="text-slate-100">New Projected Total (incl. GST):</span>
            <div className="text-right">
              <div className={`text-lg ${isHardReject ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                ₹{effectiveProjectedTotal?.toLocaleString('en-IN')}
              </div>
              {extensionAmount > 0 && (
                <div className={`text-xs font-normal ${isHardReject ? 'text-rose-400' : 'text-amber-400'}`}>
                  (+₹{extensionAmount.toLocaleString('en-IN')} above stated budget)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className={`flex items-start gap-2 text-xs rounded-lg p-3 mb-6 border ${
          isHardReject
            ? 'bg-rose-950/30 border-rose-900/40 text-rose-300'
            : 'bg-amber-950/20 border-amber-900/30 text-slate-400'
        }`}>
          <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isHardReject ? 'text-rose-400' : 'text-amber-400'}`} />
          <span>
            {isHardReject 
              ? 'Zone 3 Protection: To safeguard buyer funds, autonomous agents and customers are prohibited from exceeding the 120% bound under any circumstance.'
              : 'Zone 2 Protection: Autonomous agents cannot auto-add items exceeding budget. Please explicitly confirm your approval to extend the budget for this cart.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            {isHardReject ? 'Dismiss' : 'Cancel'}
          </button>
          {isHardReject ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-rose-900/40 border border-rose-500/40 text-rose-300 font-bold text-sm cursor-not-allowed flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Cannot Override 120% Cap</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-950/40 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Explicitly Approve & Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
