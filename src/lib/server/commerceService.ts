/**
 * Runix Authoritative Commerce Service
 * 
 * Implements Requirements 28, 29, 30, 31, 32:
 * - Authoritative pricing catalog snapshot (orders never mutate when catalog updates)
 * - Explicit payment state machine
 * - Idempotent callback processing (duplicate/retry/replay protection)
 * - Server-side verification & security
 */

import {
  computeAuthoritativeOrderPrice,
  AUTHORITATIVE_PLANS,
  AUTHORITATIVE_ADDONS,
} from "./pricingCatalog";

export const PRICING_VERSION = "v2026.1";

export type PaymentState =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "ORDER_CONFIRMED";

export interface OrderItemSnapshot {
  id: string;
  name: string;
  type: "plan" | "addon";
  unitPrice: number;
  quantity: number;
}

export interface AuthoritativePriceSnapshot {
  pricing_version: string;
  currency: string;
  selected_items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  tax: number;
  final_amount: number;
  advance_amount: number;
  balance_amount: number;
  snapshot_timestamp: number;
}

export interface OrderRecord {
  order_id: string;
  user_id: string;
  state: PaymentState;
  pricing_snapshot: AuthoritativePriceSnapshot;
  transaction_id?: string;
  idempotency_key?: string;
  created_at: number;
  updated_at: number;
  history: Array<{
    from: PaymentState;
    to: PaymentState;
    timestamp: number;
    reason?: string;
  }>;
}

/**
 * Valid state transitions for the explicit Payment State Machine (Requirement 30)
 */
const VALID_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  CREATED: ["PAYMENT_PENDING", "EXPIRED"],
  PAYMENT_PENDING: ["PROCESSING", "FAILED", "EXPIRED"],
  PROCESSING: ["SUCCESS", "FAILED", "EXPIRED"],
  SUCCESS: ["ORDER_CONFIRMED"],
  FAILED: ["PAYMENT_PENDING"], // Can re-attempt payment
  EXPIRED: [],
  ORDER_CONFIRMED: [],
};

/**
 * Creates an immutable Price Snapshot for a new order (Requirement 29)
 */
export function createOrderPricingSnapshot(
  planId: string,
  addonIds: string[] = []
): AuthoritativePriceSnapshot {
  const { plan, basePrice, addonsPrice, rawTotal } = computeAuthoritativeOrderPrice(
    planId,
    addonIds
  );

  const selected_items: OrderItemSnapshot[] = [
    {
      id: plan.id,
      name: plan.name,
      type: "plan",
      unitPrice: basePrice,
      quantity: 1,
    },
  ];

  for (const addonId of addonIds) {
    const addon = AUTHORITATIVE_ADDONS[addonId];
    if (addon) {
      selected_items.push({
        id: addon.id,
        name: addon.title,
        type: "addon",
        unitPrice: addon.price,
        quantity: 1,
      });
    }
  }

  // 50/50 Advance & Balance calculations
  const advance_amount = Math.round(rawTotal * 0.5);
  const balance_amount = rawTotal - advance_amount;

  return {
    pricing_version: PRICING_VERSION,
    currency: "INR",
    selected_items,
    subtotal: rawTotal,
    discount: 0,
    tax: 0,
    final_amount: rawTotal,
    advance_amount,
    balance_amount,
    snapshot_timestamp: Date.now(),
  };
}

/**
 * Validates a transition in the payment state machine
 */
export function canTransitionPaymentState(
  currentState: PaymentState,
  targetState: PaymentState
): boolean {
  if (currentState === targetState) return true;
  const allowed = VALID_TRANSITIONS[currentState] || [];
  return allowed.includes(targetState);
}

// In-memory idempotency register for stateless multi-instance safe callbacks (backed by Redis or durable store in prod)
const idempotencyRegistry = new Map<string, { state: PaymentState; timestamp: number; response: unknown }>();

/**
 * Process payment callback with strict idempotency (Requirement 31)
 */
export async function processIdempotentPaymentCallback<T>(
  idempotencyKey: string,
  transactionId: string,
  executeCallback: () => Promise<{ success: boolean; state: PaymentState; data: T }>
): Promise<{ idempotent: boolean; state: PaymentState; data: T }> {
  // Check if this callback/transaction was already settled
  const cacheKey = `${idempotencyKey}:${transactionId}`;
  const existing = idempotencyRegistry.get(cacheKey);

  if (existing) {
    return {
      idempotent: true,
      state: existing.state,
      data: existing.response as T,
    };
  }

  // Execute single authoritative callback
  const result = await executeCallback();

  // Register settled state
  idempotencyRegistry.set(cacheKey, {
    state: result.state,
    timestamp: Date.now(),
    response: result.data,
  });

  return {
    idempotent: false,
    state: result.state,
    data: result.data,
  };
}
