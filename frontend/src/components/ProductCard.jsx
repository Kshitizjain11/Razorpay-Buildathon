import React from 'react';
import { Star, Check, Plus, ShieldCheck, Tag } from 'lucide-react';

export default function ProductCard({ product, reasoning, isPrimary = false, onAddToCart, budgetCeiling }) {
  if (!product) return null;

  const postTaxPrice = Math.round(product.price * 1.18);
  const isWithinBudget = budgetCeiling ? postTaxPrice <= budgetCeiling : true;

  return (
    <div className={`glass-card rounded-xl p-5 relative flex flex-col justify-between transition-all duration-300 ${
      isPrimary 
        ? 'border-2 border-indigo-500/60 shadow-xl shadow-indigo-950/40 bg-slate-900/90' 
        : 'border border-slate-800 hover:border-slate-700 bg-slate-900/60'
    }`}>
      <div>
        {/* Top Header: Badge, Category, Rating & Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {isPrimary && (
              <span className="bg-indigo-600/90 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md shadow-sm flex items-center space-x-1">
                <ShieldCheck className="h-3 w-3" />
                <span>BEST FIT</span>
              </span>
            )}
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
              {product.category}
            </span>
            {product.rating && (
              <span className="text-[11px] font-bold text-amber-400 flex items-center bg-amber-400/10 px-1.5 py-0.5 rounded">
                ★ {product.rating}
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-slate-100 text-lg">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400">
              ₹{postTaxPrice.toLocaleString('en-IN')} incl. GST
            </div>
            {budgetCeiling && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded block text-right mt-0.5 ${
                isWithinBudget ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'
              }`}>
                {isWithinBudget ? 'within budget' : 'stretch'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-white text-base mt-1 line-clamp-1">{product.name}</h3>

        {/* Description */}
        <p className="text-xs text-slate-300 my-2 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5 my-3">
          {product.features && product.features.map((feat, idx) => (
            <span key={idx} className="bg-slate-800/80 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-700/60">
              {feat}
            </span>
          ))}
        </div>

        {/* Matched Feature Highlight */}
        {product.features && product.features.some(f => f.toLowerCase().includes('noise') || f.toLowerCase().includes('anc')) && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold mb-3">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>active noise cancellation</span>
          </div>
        )}

        {/* Why this product fits reasoning */}
        {reasoning && (
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 mb-4 text-xs text-indigo-200">
            <div className="font-semibold text-indigo-300 text-[11px] mb-1 flex items-center space-x-1">
              <Tag className="h-3 w-3 text-indigo-400" />
              <span>Why this product fits:</span>
            </div>
            <p className="leading-relaxed text-[11.5px] text-slate-200">{reasoning}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onAddToCart(product, { isUpsell: false, addedReason: reasoning || "Recommendation fit" })}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
          isPrimary 
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 active:scale-98'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }`}
      >
        <Plus className="h-4 w-4" />
        <span>Add to cart (₹{product.price.toLocaleString('en-IN')})</span>
      </button>
    </div>
  );
}
