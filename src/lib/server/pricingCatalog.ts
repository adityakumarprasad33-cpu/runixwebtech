/**
 * Authoritative Server-Side Pricing Catalog & Calculation Engine.
 * The client is strictly forbidden from dictating commercial totals.
 */

export interface AuthoritativePlan {
  id: string;
  name: string;
  totalPrice: number;
  advancePrice: number;
  finalPrice: number;
  deliveryDays: number;
}

export const AUTHORITATIVE_PLANS: Record<string, AuthoritativePlan> = {
  essential: {
    id: "essential",
    name: "Essential",
    totalPrice: 3999,
    advancePrice: 1999,
    finalPrice: 2000,
    deliveryDays: 5,
  },
  professional: {
    id: "professional",
    name: "Professional",
    totalPrice: 9999,
    advancePrice: 4999,
    finalPrice: 5000,
    deliveryDays: 10,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise MVP",
    totalPrice: 24999,
    advancePrice: 12499,
    finalPrice: 12500,
    deliveryDays: 21,
  },
};

export const AUTHORITATIVE_ADDONS: Record<string, { id: string; title: string; price: number }> = {
  "addon-express": { id: "addon-express", title: "Superfast Express Delivery (48h)", price: 2500 },
  "addon-seo": { id: "addon-seo", title: "Full SEO & Schema Mastery", price: 2000 },
  "addon-cms": { id: "addon-cms", title: "Dynamic CMS Content Engine", price: 3500 },
  "addon-paytm": { id: "addon-paytm", title: "Payment Gateway Setup", price: 4000 },
};

export function computeAuthoritativeOrderPrice(
  planId: string,
  addonIds: string[] = []
): { plan: AuthoritativePlan; basePrice: number; addonsPrice: number; rawTotal: number } {
  const planKey = (planId || "").toLowerCase().trim();
  const plan = AUTHORITATIVE_PLANS[planKey];
  if (!plan) {
    throw new Error(`Invalid plan identifier: "${planId}". Valid plans: essential, professional, enterprise.`);
  }

  let addonsPrice = 0;
  for (const addonId of addonIds) {
    const cleanId = (addonId || "").trim();
    const addon = AUTHORITATIVE_ADDONS[cleanId];
    if (!addon) {
      throw new Error(`Invalid add-on identifier: "${addonId}".`);
    }
    addonsPrice += addon.price;
  }

  return {
    plan,
    basePrice: plan.totalPrice,
    addonsPrice,
    rawTotal: plan.totalPrice + addonsPrice,
  };
}
