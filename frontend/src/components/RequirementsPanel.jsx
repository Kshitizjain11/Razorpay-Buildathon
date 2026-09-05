import React from 'react';
import { Target, DollarSign, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';

export default function RequirementsPanel({ requirements }) {
  if (!requirements) return null;

  const { category, budget_ceiling, must_haves = [], nice_to_haves = [], dealbreakers = [] } = requirements;

  return (
    <div className="glass-panel rounded-xl p-4 border border-blue-500/20 bg-blue-950/20 mb-6 transition-all animate-fadeIn">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Extracted AI Intent & Constraints</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-blue-300 font-mono bg-blue-900/50 border border-blue-500/40 px-2.5 py-0.5 rounded flex items-center space-x-1 shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
            <span>{requirements.provider ? `Provider: ${requirements.provider}` : 'Groq LLM (qwen/qwen3.8-27b)'}</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
            Money-Safety Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Category */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[11px] font-medium mb-1">Target Category</div>
          <div className="font-semibold text-slate-200 truncate">{category || "All Categories"}</div>
        </div>

        {/* Budget Ceiling */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[11px] font-medium mb-1 flex items-center justify-between">
            <span>Budget Ceiling</span>
            <DollarSign className="h-3 w-3 text-emerald-400" />
          </div>
          <div className="font-bold text-emerald-400 text-sm">
            ₹{Number(budget_ceiling || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Post-tax (incl. GST) • 20% Cap: ₹{Math.round(Number(budget_ceiling || 0) * 1.20).toLocaleString('en-IN')}</div>
        </div>

        {/* Must Haves */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 sm:col-span-2">
          <div className="text-slate-400 text-[11px] font-medium mb-1 flex items-center space-x-1">
            <CheckCircle2 className="h-3 w-3 text-blue-400" />
            <span>Must-Have Criteria</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {must_haves.length > 0 ? (
              must_haves.map((item, idx) => (
                <span key={idx} className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-medium">
                  ✓ {item}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-[11px]">No hard constraints specified</span>
            )}
          </div>
        </div>
      </div>

      {(nice_to_haves.length > 0 || dealbreakers.length > 0) && (
        <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
          {nice_to_haves.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Nice-to-haves:</span>
              {nice_to_haves.map((item, idx) => (
                <span key={idx} className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded font-medium">
                  {item}
                </span>
              ))}
            </div>
          )}

          {dealbreakers.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-slate-400">Dealbreakers:</span>
              {dealbreakers.map((item, idx) => (
                <span key={idx} className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded font-medium">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
