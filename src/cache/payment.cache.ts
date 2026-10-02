import redis from "./connection";
import {
  getCache,
  setCache,
  deleteCache,
} from "./helper";

const PAYMENT_IDEMPOTENCY_TTL = 86400; // 24 hours

const getPaymentIdempotencyKey = (
  userId: string,
  idempotencyKey: string
): string => {
  return `payment:initiate:${userId}:${idempotencyKey}`;
};

type PaymentIdempotencyState =
  | {
      status: "IN_PROGRESS";
      orderId: string;
    }
  | {
      status: "COMPLETED";
      orderId: string;
      response: unknown;
    };

/**
 * Atomically claims a payment initiation request.
 *
 * Returns:
 * - true  -> this request owns the idempotency key
 * - false -> another request already owns it
 */
export const claimPaymentInitiation = async (
  userId: string,
  idempotencyKey: string,
  orderId: string
): Promise<boolean> => {
  const key = getPaymentIdempotencyKey(userId, idempotencyKey);

  const result = await redis.set(
    key,
    JSON.stringify({
      status: "IN_PROGRESS",
      orderId,
    }),
    "EX",
    PAYMENT_IDEMPOTENCY_TTL,
    "NX"
  );

  return result === "OK";
};

/**
 * Get the current payment initiation state.
 */
export const getPaymentInitiation = async (
  userId: string,
  idempotencyKey: string
): Promise<PaymentIdempotencyState | null> => {
  const key = getPaymentIdempotencyKey(userId, idempotencyKey);

  return getCache<PaymentIdempotencyState>(key);
};

/**
 * Store the final payment initiation response.
 */
export const completePaymentInitiation = async (
  userId: string,
  idempotencyKey: string,
  orderId: string,
  response: unknown
): Promise<void> => {
  const key = getPaymentIdempotencyKey(userId, idempotencyKey);

  await setCache(
    key,
    {
      status: "COMPLETED",
      orderId,
      response,
    },
    PAYMENT_IDEMPOTENCY_TTL
  );
};

/**
 * Remove the payment initiation idempotency key.
 *
 * Used when payment initiation fails before completion.
 */
export const clearPaymentInitiation = async (
  userId: string,
  idempotencyKey: string
): Promise<void> => {
  const key = getPaymentIdempotencyKey(userId, idempotencyKey);

  await deleteCache(key);
};