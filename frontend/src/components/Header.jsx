import React from 'react';
import { ShoppingCart, ShieldCheck, Cpu, Activity } from 'lucide-react';

export default function Header({ cartItemCount, onOpenCart, onToggleAudit, isAuditOpen }) {
  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-white tracking-tight">Razorpay AI Revenue Maximizer</span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Track 01 • Agentic Commerce
            </span>
          </div>
          <p className="text-xs text-slate-400">Autonomous Sales Agent & Gated Checkout Engine</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleAudit}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isAuditOpen
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
          }`}
        >
          <Activity className="h-4 w-4 text-blue-400" />
          <span className="hidden sm:inline">Agent Activity Log</span>
        </button>

        <button
          onClick={onOpenCart}
          className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Cart</span>
          {cartItemCount > 0 && (
            <span className="ml-1 bg-white text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
