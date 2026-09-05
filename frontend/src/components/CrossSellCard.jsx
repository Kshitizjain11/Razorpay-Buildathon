import React from 'react';
import { Layers, Plus, Sparkles } from 'lucide-react';

export default function CrossSellCard({ crossSell, onAddCrossSell }) {
  if (!crossSell || !crossSell.product) return null;

  const { product, reasoning } = crossSell;

  return (
    <div className="glass-panel rounded-xl p-4 border border-indigo-500/30 bg-indigo-950/20 shadow-md transition-all hover:border-indigo-500/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400">
          <Layers className="h-3.5 w-3.5" />
          <span>Recommended Complementary Cross-Sell</span>
        </div>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
          Opt-in Approval Required
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h5 className="font-semibold text-white text-xs">{product.name}</h5>
          <p className="text-[11.5px] text-slate-300 leading-relaxed">{reasoning}</p>
          <div className="text-xs font-bold text-emerald-400">
            ₹{product.price.toLocaleString('en-IN')}
          </div>
        </div>

        <button
          onClick={() => onAddCrossSell(product, reasoning)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center space-x-1 shrink-0 self-start sm:self-center shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add (₹{product.price.toLocaleString('en-IN')})</span>
        </button>
      </div>
    </div>
  );
}
