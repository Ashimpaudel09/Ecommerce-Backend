import crypto from "node:crypto";

import { env } from "../../../config/env";

export const generateEsewaSignature = (
  message: string
): string => {
  return crypto
    .createHmac("sha256", env.ESEWA_SECRET_KEY)
    .update(message, "utf8")
    .digest("base64");
};

export const generatePaymentSignature = (
  totalAmount: string,
  transactionUuid: string,
  productCode: string
): string => {
  const message = [
    `total_amount=${totalAmount}`,
    `transaction_uuid=${transactionUuid}`,
    `product_code=${productCode}`,
  ].join(",");

  return generateEsewaSignature(message);
};

export const verifyEsewaResponseSignature = (
  data: Record<string, string>
): boolean => {
  const signedFieldNames = data.signed_field_names;

  if (!signedFieldNames || !data.signature) {
    return false;
  }

  const message = signedFieldNames
    .split(",")
    .map((field) => `${field}=${data[field] ?? ""}`)
    .join(",");

  const expectedSignature =
    generateEsewaSignature(message);

  const received = Buffer.from(
    data.signature,
    "base64"
  );

  const expected = Buffer.from(
    expectedSignature,
    "base64"
  );

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    received,
    expected
  );
};