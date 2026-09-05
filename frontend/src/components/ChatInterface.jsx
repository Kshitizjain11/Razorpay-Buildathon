import React, { useState } from 'react';
import { Send, Bot, Sparkles, User, RefreshCw, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import RequirementsPanel from './RequirementsPanel';
import ProductCard from './ProductCard';
import UpsellCard from './UpsellCard';
import CrossSellCard from './CrossSellCard';
import TradeoffComparisonCard from './TradeoffComparisonCard';

const SAMPLE_PROMPTS = [
  "Wireless headphones under ₹15,000, must have active noise cancellation.",
  "Looking for a 5G Android smartphone under ₹20,000 with good camera & battery",
  "Need an ultrabook laptop under ₹60,000 for coding and work",
  "Find a smart desk lamp under ₹3,000 with wireless phone charging"
];

export default function ChatInterface({
  onSendMessage,
  isProcessing,
  agentResponse,
  onAddToCart,
  onApproveUpsell,
  onSwapToContender,
  isContenderActive
}) {
  const [inputText, setInputText] = useState('');
  const [showAlternatives, setShowAlternatives] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSelectPreset = (promptText) => {
    setInputText(promptText);
    onSendMessage(promptText);
    setInputText('');
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Input Header & Prompt Box */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Revenue Maximizer</h2>
            <p className="text-xs text-slate-400">Agentic commerce · Razorpay Buildathon</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative mb-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. 'Wireless headphones under ₹15,000, must have active noise cancellation.'"
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3.5 pr-28 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs px-4 rounded-lg flex items-center space-x-1.5 transition-all"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Preset Prompt Buttons */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Try Sample Prompts:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(prompt)}
                disabled={isProcessing}
                className="text-left text-xs bg-slate-900/70 hover:bg-indigo-950/50 hover:border-indigo-500/40 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 transition-all"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results / Conversational Flow */}
      {agentResponse && (
        <div className="space-y-6 transition-all duration-300">
          
          {/* User Query Speech Bubble */}
          <div className="flex justify-end">
            <div className="bg-indigo-600/90 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-xl text-sm font-medium shadow-lg shadow-indigo-950/30">
              {agentResponse.userMessage}
            </div>
          </div>

          {/* AI Reasoning Response Speech Bubble */}
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              AI
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-slate-200 text-sm leading-relaxed max-w-2xl shadow-xl">
              <p className="mb-2">
                {agentResponse.conversationalExplanation || agentResponse.reasoning || "Here are the best matches found in our catalog for your requirements."}
              </p>
              <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1 pt-2 border-t border-slate-800/60">
                <span>via {agentResponse.requirements?.provider || "groq · qwen-2.5-32b"}</span>
              </div>
            </div>
          </div>

          {/* Extracted Requirements Panel */}
          {agentResponse.requirements && (
            <RequirementsPanel requirements={agentResponse.requirements} />
          )}

          {/* Close Candidate Trade-Off Comparison Card */}
          {agentResponse.tradeoffComparison && (
            <TradeoffComparisonCard
              tradeoffComparison={agentResponse.tradeoffComparison}
              onAddToCart={onAddToCart}
              onSwapToContender={onSwapToContender}
              isContenderActive={isContenderActive}
            />
          )}

          {/* Primary BEST FIT AI Recommendation */}
          {agentResponse.recommendation ? (
            <div>
              <ProductCard
                product={agentResponse.recommendation}
                reasoning={agentResponse.reasoning}
                isPrimary={true}
                onAddToCart={onAddToCart}
                budgetCeiling={agentResponse.requirements?.budget_ceiling}
              />
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl text-center text-slate-400 text-xs">
              No matching in-budget items found. Try increasing your budget or broadening search criteria.
            </div>
          )}

          {/* Collapsible Other In-Budget Options */}
          {agentResponse.alternatives && agentResponse.alternatives.length > 0 && (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 transition-colors"
              >
                {showAlternatives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>▾ {agentResponse.alternatives.length} other in-budget options</span>
              </button>

              {showAlternatives && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                  {agentResponse.alternatives.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isPrimary={false}
                      onAddToCart={onAddToCart}
                      budgetCeiling={agentResponse.requirements?.budget_ceiling}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bounded Upsell Card */}
          {agentResponse.boundedUpsell && (
            <UpsellCard
              boundedUpsell={agentResponse.boundedUpsell}
              budgetCeiling={agentResponse.requirements?.budget_ceiling}
              onApproveUpsell={onApproveUpsell}
            />
          )}

          {/* Cross-Sell Cards */}
          {agentResponse.crossSells && agentResponse.crossSells.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Relevant Complementary Cross-Sells
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agentResponse.crossSells.map((cs, idx) => (
                  <CrossSellCard
                    key={cs.product.id || idx}
                    crossSell={cs}
                    onAddCrossSell={(product, reasoning) => onAddToCart(product, { isCrossSell: true, addedReason: reasoning })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
