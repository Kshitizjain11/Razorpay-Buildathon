import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MAX_UPSELL_DEVIATION, PRODUCT_CATEGORIES, getPostTaxPrice } from '../config/constants.js';
import { searchProducts, getAllProducts, getProductById, getComplementaryProducts } from '../models/catalog.js';

// Heuristic natural language requirement extractor (works deterministically and fast as tertiary fallback)
function fallbackExtractRequirements(userText) {
  const text = userText.toLowerCase();

  // 1. Budget extraction (e.g. "under 10000", "under 10k", "below rs 15000", "budget 20000")
  let budget_ceiling = null;
  const kMatch = text.match(/(?:under|below|around|budget|within|max|upto|up to)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    budget_ceiling = parseFloat(kMatch[1]) * 1000;
  } else {
    const rawMatch = text.match(/(?:under|below|around|budget|within|max|upto|up to|rs\.?|₹)\s*(\d{4,6})\b/i) || text.match(/(\d{4,6})\s*(?:rs|rupees|inr)?\b/i);
    if (rawMatch) {
      budget_ceiling = parseInt(rawMatch[1], 10);
    }
  }

  if (!budget_ceiling) {
    budget_ceiling = 20000; // Default reasonable ceiling if omitted
  }

  // 2. Category & Specific Product Type matching
  let category = "All";
  let product_type = "all";

  if (text.includes("headphone") || text.includes("headset") || text.includes("earphone")) {
    category = "Audio & Wearables";
    product_type = "headphones";
  } else if (text.includes("earbud") || text.includes("tws") || text.includes("buds")) {
    category = "Audio & Wearables";
    product_type = "earbuds";
  } else if (text.includes("watch") || text.includes("smartwatch") || text.includes("fitness tracker")) {
    category = "Audio & Wearables";
    product_type = "smartwatch";
  } else if (text.includes("speaker") || text.includes("soundbar") || text.includes("boombox")) {
    category = "Audio & Wearables";
    product_type = "speaker";
  } else if (text.includes("phone") || text.includes("mobile") || text.includes("smartphone")) {
    category = "Smartphones & Accessories";
    product_type = "phone";
  } else if (text.includes("charger") || text.includes("powerbank") || text.includes("magsafe") || text.includes("cable")) {
    category = "Smartphones & Accessories";
    product_type = "accessory";
  } else if (text.includes("laptop") || text.includes("macbook") || text.includes("ultrabook") || text.includes("pc") || text.includes("computer") || text.includes("desktop")) {
    category = "Laptops & Workstations";
    product_type = "laptop";
  } else if (text.includes("lamp") || text.includes("purifier") || text.includes("smart home")) {
    category = "Smart Home & Productivity";
    product_type = "smarthome";
  }

  // 3. Must-haves and Nice-to-haves
  const must_haves = [];
  const nice_to_haves = [];
  const dealbreakers = [];

  const featureKeywords = [
    { key: "anc", label: "Active Noise Cancellation" },
    { key: "noise cancel", label: "Active Noise Cancellation" },
    { key: "sound quality", label: "Good Sound Quality" },
    { key: "audio quality", label: "Good Sound Quality" },
    { key: "mic", label: "Clear Microphone" },
    { key: "battery", label: "Long Battery Life" },
    { key: "5g", label: "5G Support" },
    { key: "camera", label: "High-res Camera" },
    { key: "oled", label: "OLED Display" },
    { key: "gaming", label: "Gaming / Low Latency" },
    { key: "wireless", label: "Wireless Connectivity" },
    { key: "ergonomic", label: "Ergonomic Design" },
    { key: "waterproof", label: "Water Resistance" },
    { key: "fast charge", label: "Fast Charging" },
    { key: "lightweight", label: "Lightweight" },
    { key: "4k", label: "4K Resolution" }
  ];

  featureKeywords.forEach(item => {
    if (text.includes(item.key)) {
      must_haves.push(item.label);
    }
  });

  if (text.includes("cheap") || text.includes("budget") || text.includes("affordable")) {
    nice_to_haves.push("High Price-to-Performance Ratio");
  }
  if (text.includes("premium") || text.includes("best") || text.includes("top quality")) {
    nice_to_haves.push("Premium Build Quality");
  }

  return {
    category,
    product_type,
    budget_ceiling,
    must_haves: must_haves.length > 0 ? must_haves : ["Good Performance"],
    nice_to_haves,
    dealbreakers,
    provider: "heuristic-fallback"
  };
}

export async function extractRequirements(userText) {
  const systemPrompt = `You are a customer requirement extraction tool for an e-commerce sales agent.
Categories available: ["Audio & Wearables", "Smartphones & Accessories", "Laptops & Workstations", "Smart Home & Productivity", "All"].
Product types available: ["headphones", "earbuds", "smartwatch", "speaker", "phone", "laptop", "lamp", "charger", "accessory", "all"].

Extract the requirement object from the customer prompt.
Return JSON ONLY matching this exact structure, with no markdown codeblocks or explanation:
{
  "category": "Audio & Wearables" | "Smartphones & Accessories" | "Laptops & Workstations" | "Smart Home & Productivity" | "All",
  "product_type": "headphones" | "earbuds" | "smartwatch" | "speaker" | "phone" | "laptop" | "lamp" | "charger" | "accessory" | "all",
  "budget_ceiling": number (in INR, default to 25000 if unspecified),
  "must_haves": ["array of strings"],
  "nice_to_haves": ["array of strings"],
  "dealbreakers": ["array of strings"]
}`;

  // 1. PRIMARY PROVIDER: Groq LLM (high rate limits & speed)
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      const modelName = process.env.GROQ_MODEL || "qwen-2.5-32b";
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
        ],
        model: modelName,
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (content) {
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        console.log(`🤖 [GROQ LLM SUCCESS] Model: ${modelName} -> Extracted:`, parsed);
        return { ...parsed, provider: `groq (${modelName})` };
      }
    } catch (groqErr) {
      console.warn("Groq LLM extraction failed/unavailable, falling back to Gemini:", groqErr.message);
    }
  }

  // 2. SECONDARY PROVIDER: Google Gemini LLM
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `${systemPrompt}\nCustomer Prompt: "${userText}"`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      console.log(`🤖 [GEMINI LLM SUCCESS] Model: ${modelName} -> Extracted:`, parsed);
      return { ...parsed, provider: `gemini (${modelName})` };
    } catch (geminiErr) {
      console.warn("Gemini LLM requirement extraction failed, using heuristic fallback:", geminiErr.message);
    }
  }

  // 3. TERTIARY FALLBACK: Deterministic parser
  return fallbackExtractRequirements(userText);
}

export function rankRecommendations(requirements) {
  const { category, product_type, budget_ceiling, must_haves = [], nice_to_haves = [], dealbreakers = [] } = requirements;

  const catalog = getAllProducts();
  
  // HARD FILTER STAGE: Strict Category, Product Type, and Dealbreaker Invariants
  const isProductTypeCompatible = (product, targetType) => {
    if (!targetType || targetType === 'all') return true;
    const nameLower = product.name.toLowerCase();
    const tagsLower = product.tags.map(t => t.toLowerCase());

    if (targetType === 'headphones' || targetType === 'earbuds') {
      return nameLower.includes('headphone') || nameLower.includes('earbud') || nameLower.includes('buds') ||
             tagsLower.includes('headphones') || tagsLower.includes('earbuds') || tagsLower.includes('tws');
    }
    if (targetType === 'smartwatch') {
      return nameLower.includes('smartwatch') || nameLower.includes('watch') || tagsLower.includes('smartwatch');
    }
    if (targetType === 'speaker') {
      return nameLower.includes('speaker') || nameLower.includes('soundbar') || tagsLower.includes('speaker');
    }
    if (targetType === 'phone') {
      return nameLower.includes('phone') || tagsLower.includes('smartphone');
    }
    if (targetType === 'laptop') {
      const isAccessory = nameLower.includes('stand') || nameLower.includes('keyboard') || nameLower.includes('mouse') ||
                          nameLower.includes('monitor') || nameLower.includes('hub') || tagsLower.includes('accessories') ||
                          tagsLower.includes('monitor');
      if (isAccessory) return false;

      return nameLower.includes('laptop') || nameLower.includes('ultrabook') || nameLower.includes('zenbook') ||
             nameLower.includes('titanium blade') || nameLower.includes('flexbook') || nameLower.includes('probook') ||
             tagsLower.includes('laptop') || tagsLower.includes('ultrabook');
    }
    if (targetType === 'accessory' || targetType === 'charger') {
      return tagsLower.includes('accessories') || tagsLower.includes('powerbank') || tagsLower.includes('charger');
    }
    return true;
  };

  // Hard Invariant Candidate Pool (All off-category / off-type items are dropped here)
  let candidates = catalog.filter(p => {
    // 1. Hard Category Filter
    if (category && category !== 'All' && !p.category.toLowerCase().includes(category.toLowerCase())) {
      return false;
    }
    // 2. Hard Product Type Filter (Structural impossibility for off-type items to pass)
    if (!isProductTypeCompatible(p, product_type)) {
      return false;
    }
    // 3. Hard Dealbreaker Filter
    for (const db of dealbreakers) {
      const term = db.toLowerCase();
      if (p.name.toLowerCase().includes(term) || p.tags.some(t => t.toLowerCase().includes(term))) {
        return false;
      }
    }
    return true;
  });

  // Separate into in-budget vs above-budget (EVALUATED POST-TAX / INCL. 18% GST)
  const inBudgetCandidates = candidates.filter(p => getPostTaxPrice(p.price) <= budget_ceiling);
  const maxAllowedUpsellPrice = Math.round(budget_ceiling * (1 + MAX_UPSELL_DEVIATION));
  const upsellCandidates = candidates.filter(p => {
    const postTaxPrice = getPostTaxPrice(p.price);
    return postTaxPrice > budget_ceiling && postTaxPrice <= maxAllowedUpsellPrice;
  });

  // SCORING STAGE: Runs ONLY on candidates that passed all hard filters
  const scoreProduct = (product) => {
    let score = 50; // base score

    // Rating boost
    score += (product.rating || 4.0) * 5;

    // Must-haves match score
    must_haves.forEach(mh => {
      const mhTerm = mh.toLowerCase();
      const match = product.features.some(f => f.toLowerCase().includes(mhTerm)) ||
                    product.tags.some(t => t.toLowerCase().includes(mhTerm)) ||
                    product.description.toLowerCase().includes(mhTerm);
      if (match) score += 20;
    });

    // Nice-to-haves match score
    nice_to_haves.forEach(nth => {
      const nthTerm = nth.toLowerCase();
      const match = product.features.some(f => f.toLowerCase().includes(nthTerm)) ||
                    product.tags.some(t => t.toLowerCase().includes(nthTerm));
      if (match) score += 10;
    });

    // Budget fit score (evaluated against post-tax price customer actually pays)
    const postTaxPrice = getPostTaxPrice(product.price);
    if (postTaxPrice <= budget_ceiling) {
      const budgetUtilization = postTaxPrice / budget_ceiling;
      // For unconstrained/generic queries (empty must_haves), reward products that use budget for higher specs
      const utilizationMultiplier = must_haves.length === 0 ? 20 : 10;
      score += budgetUtilization * utilizationMultiplier;
    }

    return score;
  };

  const scoredInBudget = inBudgetCandidates
    .map(p => ({ product: p, score: scoreProduct(p) }))
    .sort((a, b) => b.score - a.score);

  const scoredUpsell = upsellCandidates
    .map(p => ({ product: p, score: scoreProduct(p) }))
    .sort((a, b) => b.score - a.score);

  // Select primary recommendation
  let primaryRecommendation = null;
  let recommendationReason = "";
  let conversationalExplanation = "";

  if (scoredInBudget.length > 0) {
    const top = scoredInBudget[0].product;
    primaryRecommendation = top;
    const topPostTax = getPostTaxPrice(top.price);
    
    // Generate explanation referencing specific constraints
    const matchedMustHaves = must_haves.filter(mh => {
      const mhTerm = mh.toLowerCase();
      return top.features.some(f => f.toLowerCase().includes(mhTerm)) ||
             top.tags.some(t => t.toLowerCase().includes(mhTerm)) ||
             top.description.toLowerCase().includes(mhTerm);
    });

    const featuresStr = top.features ? top.features.slice(0, 3).join(', ') : '';

    if (matchedMustHaves.length > 0) {
      const mustHaveStr = matchedMustHaves.join(' and ');
      recommendationReason = `Priced at ₹${top.price.toLocaleString('en-IN')} (₹${topPostTax.toLocaleString('en-IN')} incl. GST), perfectly within your ₹${budget_ceiling.toLocaleString('en-IN')} budget. It satisfies your requirement for ${mustHaveStr}. Rated ${top.rating}★ by verified buyers.`;
      conversationalExplanation = `The ${top.name} is a great match for you—it offers ${mustHaveStr}, which was your must-have, and comes comfortably within your ₹${budget_ceiling.toLocaleString('en-IN')} budget at ₹${top.price.toLocaleString('en-IN')} (₹${topPostTax.toLocaleString('en-IN')} incl. GST). With ${featuresStr}, it gives you the quality experience you wanted without stretching your budget.`;
    } else {
      recommendationReason = `Priced at ₹${top.price.toLocaleString('en-IN')} (₹${topPostTax.toLocaleString('en-IN')} incl. GST), perfectly within your ₹${budget_ceiling.toLocaleString('en-IN')} budget. It offers exceptional quality with ${top.features.slice(0, 2).join(' and ')}. Rated ${top.rating}★ by verified buyers.`;
      conversationalExplanation = `The ${top.name} is an excellent choice for your request—priced at just ₹${top.price.toLocaleString('en-IN')} (₹${topPostTax.toLocaleString('en-IN')} incl. GST), comfortably within your ₹${budget_ceiling.toLocaleString('en-IN')} budget. Featuring ${featuresStr}, it delivers outstanding performance and value.`;
    }
  } else if (candidates.length > 0) {
    // If no in-budget candidate exists, recommend closest item under budget if available or inform customer
    const closestUnderBudget = catalog
      .filter(p => getPostTaxPrice(p.price) <= budget_ceiling)
      .sort((a, b) => b.rating - a.rating)[0];

    if (closestUnderBudget) {
      const closestPostTax = getPostTaxPrice(closestUnderBudget.price);
      primaryRecommendation = closestUnderBudget;
      recommendationReason = `While exact category matches exceeded ₹${budget_ceiling.toLocaleString('en-IN')} incl. GST, this top-rated item fit your budget at ₹${closestUnderBudget.price.toLocaleString('en-IN')} (₹${closestPostTax.toLocaleString('en-IN')} incl. GST).`;
      conversationalExplanation = `While exact category matches exceeded ₹${budget_ceiling.toLocaleString('en-IN')} incl. GST, the ${closestUnderBudget.name} is a top-rated choice that fits within your budget at ₹${closestUnderBudget.price.toLocaleString('en-IN')} (₹${closestPostTax.toLocaleString('en-IN')} incl. GST).`;
    }
  }

  // Evaluate Bounded Upsell (Strict 20% max deviation check evaluated against post-tax price)
  let boundedUpsell = null;
  if (scoredUpsell.length > 0 && primaryRecommendation) {
    const bestUpsell = scoredUpsell[0].product;
    const bestUpsellPostTax = getPostTaxPrice(bestUpsell.price);
    const priceDiff = bestUpsellPostTax - budget_ceiling;
    const percentDiff = Math.round((priceDiff / budget_ceiling) * 100);

    // Extra features provided by upsell
    const extraFeatures = bestUpsell.features.filter(f => !primaryRecommendation.features.includes(f));
    const extraText = extraFeatures.length > 0 ? extraFeatures.slice(0, 2).join(' & ') : "enhanced specifications and build";

    boundedUpsell = {
      product: bestUpsell,
      postTaxPrice: bestUpsellPostTax,
      priceAboveBudget: priceDiff,
      percentAboveBudget: percentDiff,
      maxAllowedDeviation: MAX_UPSELL_DEVIATION * 100, // 20%
      reasoning: `For ₹${priceDiff.toLocaleString('en-IN')} above budget (${percentDiff}% stretch incl. GST, well within the 20% cap), you upgrade to ${bestUpsell.name} which adds ${extraText}.`,
      requiresExplicitApproval: true
    };
  }

  // Cross-sell candidates (from primary recommendation complementary IDs)
  let crossSells = [];
  if (primaryRecommendation) {
    const compProducts = getComplementaryProducts(primaryRecommendation.id);
    crossSells = compProducts.map(cp => ({
      product: cp,
      reasoning: `Pairs perfectly with ${primaryRecommendation.name} to enhance your experience.`
    }));
  }

  return {
    requirements,
    primaryRecommendation,
    recommendationReason,
    conversationalExplanation,
    boundedUpsell,
    crossSells,
    alternativeOptions: scoredInBudget.slice(1, 4).map(s => s.product)
  };
}
