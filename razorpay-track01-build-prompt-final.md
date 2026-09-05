# Build Prompt — AI Revenue Maximizer (Razorpay Buildathon, Track 01)
---

## Prompt

```
Build a fully working MVP — not a mockup, not a static demo. This is for a
2-day hackathon (Razorpay AI Buildathon, Track 01: AI Growth & Agentic
Commerce), so build depth on ONE core flow before adding anything else.
Follow the priority tiers below in order — do not start P1 until every P0
item passes its Definition of Done test, and do not start P2 until P1 is
solid. Ask me before adding anything not listed here.

PRODUCT
An AI sales agent for a Razorpay merchant. A customer describes what they
want in natural language. The agent extracts their requirements, searches
the real catalog, recommends the best fit, identifies a legitimate
bounded upsell and a relevant cross-sell, gets explicit approval, builds
the cart, and completes a real Razorpay test-mode payment — with every
money action explainable, bounded, gated, and logged to an audit trail.
The same reasoning pipeline is also exposed as a small JSON API so an
external AI buyer agent could query the catalog and complete a purchase
programmatically — this is what makes the merchant "transactable by an AI
buyer," not a separate product, just a second caller into the same logic.

TECH STACK
- Frontend: React + Vite + Tailwind CSS. Dark, polished SaaS/e-commerce UI
  — not a generic chatbot look. Product cards, visible cart, clear
  checkout CTA, audit timeline, merchant dashboard.
- Backend: Node.js + Express, modular:
  backend/{agents,services,models,routes,controllers,middleware}/
  Two dedicated services: revenueMaximizerService and razorpayService.
  Do not put business logic inside React components or a single route file.
- Data: JSON seed data is enough for a 2-day build — skip a database setup
  unless you finish P0 with real time to spare. 30-50 products across
  3-5 categories, realistic INR pricing. Each product: id, name,
  description, category, price, features[], tags[], stock, rating,
  complementary_product_ids[].
- AI: tool-calling LLM (function-calling loop) for intent understanding,
  requirement extraction, recommendation reasoning, and explanation
  generation. The LLM NEVER performs a money action directly — it calls
  deterministic backend tools, and the backend validates every call:
  searchProducts(), getProduct(), addToCart(), removeFromCart(),
  updateCart(), calculateCart(), createRazorpayOrder(), verifyPayment(),
  createOrderRecord().
- Payments: Razorpay test-mode APIs, real calls, never simulated. Keep
  credentials in environment variables, never in frontend code.

MONEY-ACTION SAFETY — the core judging bar, build these as real components:

- Explainable: every recommendation/upsell/cross-sell logs WHY, referencing
  the specific customer constraint it satisfies.
- Bounded: define a named constant, max_upsell_deviation = 0.20 (20% above
  stated budget). The agent may never add an item exceeding
  budget_ceiling * (1 + max_upsell_deviation) without treating it as an
  explicit optional stretch recommendation the customer must separately
  approve — never silently added to cart, never silently raising the
  customer's budget. Same rule applies whether the caller is the human UI
  or the agent-to-agent API.
- Gated: before any payment, show an explicit order summary (products,
  quantities, subtotal, total, reason for any upsell/cross-sell included)
  and require explicit confirmation ("Confirm & Pay ₹X") before the
  backend creates the Razorpay order. No confirmation, no payment call —
  full stop, on both the human and agent paths.

CORE AGENT LOGIC

1. Requirement extraction: from freeform text, extract
   {category, budget_ceiling, must_haves[], nice_to_haves[], dealbreakers[]}.
   Show this extracted object in the UI.
2. Base recommendation: best-fit product(s) within budget_ceiling, ranked
   by fit against must_haves/nice_to_haves.
3. Upsell check: is there a candidate above budget that's justified per
   the bounded rule above? If yes, present it as a clearly separate,
   clearly-priced-above-budget stretch option with a plain-language reason
   — never auto-added. If no, say so; don't force a recommendation.
4. Cross-sell: identify contextually relevant complementary products
   (using complementary_product_ids), with a stated reason, never added
   without approval.
5. Cart + gated checkout: customer approves individual items; backend
   builds the cart via validated tool calls only.
6. Razorpay test-mode order creation on explicit "Confirm & Pay."
7. Payment verification: backend verifies the payment signature/status
   before marking the order paid — do not mark an order paid on the
   frontend's word alone.
8. Audit trail: every step above (extraction, recommendation + reason,
   upsell offered/accepted/declined, cross-sell offered/accepted/declined,
   cart state before/after, payment attempt, verification result) is
   logged as a real, timestamped, queryable record — tagged by source
   (human UI vs. agent API) — and rendered in a visible Agent Activity
   panel. This is not static text; it's real application data.

AGENT-TO-AGENT API (build this in P1, not as an afterthought — it directly
answers "sellable to AI buyers, transactable end to end")
Expose the same pipeline as structured JSON endpoints:
  GET  /api/catalog          -> structured product list, agent-readable
  POST /api/quote            -> {item_id, budget_ceiling, must_haves,
                                  dealbreakers} -> same ranked recommendation
                                  + justification as the human path
  POST /api/orders/confirm   -> {quote_id, accept: true} -> same gated
                                  Razorpay test-mode call as the human
                                  "Confirm & Pay" button, same bounded rule,
                                  same audit logging
Document these with example curl requests in the README.

FAILURE HANDLING (build at least this one, end to end)
Razorpay test payment fails:
1. Detect the failure (don't assume success).
2. Preserve the cart — don't lose it.
3. Tell the customer clearly the payment wasn't completed, no charge went
   through.
4. Offer a retry, without creating a duplicate order.
5. Log the failed attempt and the retry in the audit trail.

MERCHANT DASHBOARD (P1, lightweight — not a full analytics platform)
Calculated from real application data only:
- Revenue: total GMV, AI-assisted GMV, average order value
- Conversion: conversations started, carts created, completed purchases,
  conversion rate
- AI optimization: upsell offers made/accepted, cross-sells made/accepted,
  additional revenue from accepted upsells/cross-sells
- Agent activity: recommendations made, payment attempts, successful vs
  failed payments

DO NOT BUILD (explicitly out of scope for a 2-day hackathon)
Multi-merchant onboarding, production auth, ML model training, vector DBs
(unless genuinely needed), microservices, real WhatsApp integration, real
campaign management, real inventory management, admin roles, settings
pages, refund flows, arbitrary payment requests.

PRIORITY ORDER — do not skip ahead
P0 (must work, in this order):
  1. Product catalog (seed data + search)
  2. Conversational requirement extraction
  3. Base recommendation with reasoning
  4. Bounded upsell logic (constant + stretch-option UI, never silent)
  5. Cart via validated backend tools
  6. Gated Razorpay test-mode order + Confirm & Pay
  7. Payment verification (real, not assumed)
  8. Audit trail (real, queryable, visible)
P1 (should work, after P0 passes its tests):
  9. Cross-sell with approval
  10. Agent-to-agent API (catalog/quote/confirm) reusing the same pipeline
  11. Payment failure + retry, no duplicate orders
  12. Merchant dashboard from real data
P2 (only if time remains, do not start early):
  13. Animation/UI polish beyond functional
  14. More sophisticated recommendation scoring
  15. Additional analytics
  16. Additional failure scenarios

DEFINITION OF DONE — the build isn't complete until each of these passes:
1. Natural-language requirement -> relevant products returned
2. Agent explains why a product fits
3. Agent identifies a legitimate, bounded upsell opportunity
4. Agent never exceeds stated budget without explicit separate approval
5. Agent identifies a relevant, explained cross-sell
6. Cart is modified only through validated backend tools, never directly
   by the LLM
7. A real Razorpay test-mode order is created on confirmation
8. Payment result is verified backend-side before marking an order paid
9. Every money-relevant AI action appears in the audit trail
10. One payment failure is handled without losing the cart or faking a
    successful order
11. The agent-to-agent API endpoints return the same reasoning and honor
    the same bounded/gated rules as the human path

Before adding anything not listed above, ask: does this make the core
end-to-end flow (requirement -> recommendation -> bounded upsell ->
cross-sell -> gated payment -> verified -> audited) stronger? If not,
leave it out.
```