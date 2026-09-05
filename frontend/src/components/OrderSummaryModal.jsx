import React from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function OrderSummaryModal({ isOpen, onClose, cart, onConfirmAndPay, isProcessingPayment }) {
  if (!isOpen || !cart) return null;

  const items = cart.items || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0b0f19] border border-blue-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white transition-all p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Money-Safety Payment Gate</h3>
            <p className="text-xs text-slate-400">Explicit Customer Order Confirmation Checkpoint</p>
          </div>
        </div>

        {/* Notice alert */}
        <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-start space-x-2.5">
          <Lock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Gated Payment Rule: </span>
            The agent cannot invoke Razorpay test mode APIs without your explicit click on "Confirm & Pay".
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Items</div>
          {items.map((item) => (
            <div key={item.productId} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{item.name}</div>
                <div className="text-slate-400 text-[11px]">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                {item.addedReason && (
                  <div className="text-[10px] text-blue-300 italic mt-0.5">Reason: {item.addedReason}</div>
                )}
              </div>
              <div className="font-bold text-emerald-400">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-medium text-slate-200">₹{cart.subtotal?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>GST (18%)</span>
            <span className="font-medium text-slate-200">₹{cart.tax?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
            <span>Final Total</span>
            <span className="text-emerald-400">₹{cart.total?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={onConfirmAndPay}
            disabled={isProcessingPayment}
            className="w-2/3 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Confirm & Pay ₹{cart.total?.toLocaleString('en-IN')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
