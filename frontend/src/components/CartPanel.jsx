import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, X, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CartPanel({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onProceedToCheckout }) {
  if (!isOpen) return null;

  const items = cart?.items || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-[#0b0f19] border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl">
        {/* Cart Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Your Cart</h3>
            <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {items.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-400 font-medium">Your cart is currently empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ask the AI agent for recommendations or add items from the catalog.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col space-y-2 relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-xs">{item.name}</h4>
                    {item.isUpsell && (
                      <span className="inline-block text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-medium mt-1">
                        Bounded Stretch Option (+Upsell)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="font-bold text-emerald-400 text-sm">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="p-1 text-slate-400 hover:text-white transition-all"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold text-slate-200 px-1.5">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="p-1 text-slate-400 hover:text-white transition-all"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer & Gated Checkout CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-800 bg-slate-900/60 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">₹{cart?.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%)</span>
                <span className="font-semibold text-slate-200">₹{cart?.tax?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total Amount (incl. GST)</span>
                <span className="text-emerald-400">₹{cart?.total?.toLocaleString('en-IN')}</span>
              </div>
              {cart?.budgetCeiling && (
                <div className="pt-2 border-t border-slate-800/80 space-y-0.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Stated Budget:</span>
                    <span className="font-semibold text-slate-200">₹{cart.budgetCeiling.toLocaleString('en-IN')}</span>
                  </div>
                  {cart.total > cart.budgetCeiling ? (
                    <div className="text-[11px] text-amber-400 flex items-center justify-between font-medium">
                      <span>Post-Tax Stretch:</span>
                      <span>+₹{(cart.total - cart.budgetCeiling).toLocaleString('en-IN')} above budget</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 flex items-center justify-between font-medium">
                      <span>Under Budget:</span>
                      <span>₹{(cart.budgetCeiling - cart.total).toLocaleString('en-IN')} headroom</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Gated Checkout (₹{cart?.total?.toLocaleString('en-IN')})</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-[10px] text-slate-500 text-center">
              Gated Money Action: Opens explicit order confirmation before Razorpay test payment API invocation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
