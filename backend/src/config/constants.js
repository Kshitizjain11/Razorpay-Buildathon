export const MAX_UPSELL_DEVIATION = 0.20; // 20% max upsell deviation cap above customer budget
export const GST_RATE = 0.18; // 18% GST
export const TRADEOFF_SCORE_THRESHOLD = 15; // Max score difference between top 2 candidates to trigger trade-off comparison

export function getPostTaxPrice(preTaxPrice) {
  return Math.round(preTaxPrice * (1 + GST_RATE));
}

export function calculateTaxAndTotal(subtotal) {
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + tax;
  return { tax, total };
}

export const PRODUCT_CATEGORIES = [
  "Audio & Wearables",
  "Smartphones & Accessories",
  "Laptops & Workstations",
  "Smart Home & Productivity"
];

