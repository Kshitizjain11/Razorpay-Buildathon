import React from 'react';
import { Scale, Check, ArrowRightLeft, Star, Battery, ShieldCheck, Sparkles } from 'lucide-react';

export default function TradeoffComparisonCard({
  tradeoffComparison,
  onAddToCart,
  onSwapToContender,
  isContenderActive = false
}) {
  if (!tradeoffComparison || !tradeoffComparison.hasCloseContender) return null;

  const {
    primaryProduct,
    contenderProduct,
    scoreDifference,
    reasonChosen,
    contenderStrength,
    tradeoffSummary,
    attributeDifferences = []
  } = tradeoffComparison;

  return (
    <div className="relative glass-panel rounded-2xl p-5 border-2 border-violet-500/40 bg-gradient-to-br from-violet-950/25 via-slate-900 to-slate-900 shadow-2xl shadow-violet-500/10 mb-6 transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-violet-500/20">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 border border-violet-500/30 shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm sm:text-base">
                Close Candidate Trade-Off
              </h3>
              <span className="bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Δ {scoreDifference} pts
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Two candidates scored very closely with meaningful specification trade-offs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            ⚖️ Single-Turn Transparency
          </span>
        </div>
      </div>

      {/* Trade-off summary banner */}
      <div className="mt-3 p-3 bg-violet-950/40 border border-violet-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-violet-300 font-bold flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Core Trade-Off: {tradeoffSummary}</span>
          </div>
          <p className="text-slate-300 text-[11.5px] leading-relaxed">
            <span className="text-blue-400 font-semibold">Chosen default:</span> {reasonChosen}
          </p>
          <p className="text-slate-300 text-[11.5px] leading-relaxed">
            <span className="text-purple-400 font-semibold">Contender alternative:</span> {contenderStrength}
          </p>
        </div>
      </div>

      {/* Side-by-side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Primary Recommendation Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          !isContenderActive 
            ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-950/50' 
            : 'bg-slate-900/60 border-slate-800 opacity-85'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Selected Default
            </span>
            <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <span>{primaryProduct.rating}★</span>
            </div>
          </div>

          <h4 className="font-bold text-white text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {primaryProduct.name}
          </h4>

          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-lg font-extrabold text-indigo-300">
              ₹{primaryProduct.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">
              (₹{primaryProduct.postTaxPrice.toLocaleString('en-IN')} incl. GST)
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[2rem]">
            {primaryProduct.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 min-h-[2.2rem]">
            {(primaryProduct.features || []).slice(0, 3).map((f, idx) => (
              <span key={idx} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700/60">
                {f}
              </span>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onAddToCart(primaryProduct, { addedReason: `Default selection: ${tradeoffSummary}` })}
              className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                !isContenderActive
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirm Default ({primaryProduct.name.split(' ')[0]})</span>
            </button>
          </div>
        </div>

        {/* Close Contender Card */}
        <div className={`p-4 rounded-xl border transition-all ${
          isContenderActive 
            ? 'bg-violet-950/30 border-violet-500/60 ring-1 ring-violet-500/30 shadow-lg shadow-violet-950/50' 
            : 'bg-slate-900/60 border-slate-800 hover:border-violet-500/40'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Close Contender
            </span>
            <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <span>{contenderProduct.rating}★</span>
            </div>
          </div>

          <h4 className="font-bold text-white text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
            {contenderProduct.name}
          </h4>

          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-lg font-extrabold text-violet-300">
              ₹{contenderProduct.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400">
              (₹{contenderProduct.postTaxPrice.toLocaleString('en-IN')} incl. GST)
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[2rem]">
            {contenderProduct.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5 min-h-[2.2rem]">
            {(contenderProduct.features || []).slice(0, 3).map((f, idx) => (
              <span key={idx} className="bg-violet-950/60 text-violet-200 text-[11px] px-2 py-0.5 rounded border border-violet-700/50">
                {f}
              </span>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onSwapToContender(contenderProduct, primaryProduct)}
              className="w-full py-2 px-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold rounded-lg shadow-md shadow-violet-600/30 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Switch to Contender</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attribute Comparison Breakdown Table */}
      {attributeDifferences.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Detailed Dimension Comparison
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-1.5 px-2">Attribute</th>
                  <th className="py-1.5 px-2 text-indigo-300">{primaryProduct.name.split(' ').slice(0, 2).join(' ')} (Default)</th>
                  <th className="py-1.5 px-2 text-violet-300">{contenderProduct.name.split(' ').slice(0, 2).join(' ')} (Contender)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {attributeDifferences.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-2 px-2 font-medium text-slate-300">{row.attribute}</td>
                    <td className={`py-2 px-2 ${
                      row.favors === 'primary' 
                        ? 'text-emerald-400 font-semibold' 
                        : 'text-slate-300'
                    }`}>
                      {row.primary}
                    </td>
                    <td className={`py-2 px-2 ${
                      row.favors === 'contender' 
                        ? 'text-emerald-400 font-semibold' 
                        : 'text-slate-300'
                    }`}>
                      {row.contender}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
