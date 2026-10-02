import crypto from "node:crypto";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/app.error";

import { env } from "../../config/env";
import { generatePaymentSignature } from "./esewa/esewa.signature";
import {
  claimPaymentInitiation,
  getPaymentInitiation,
  completePaymentInitiation,
  clearPaymentInitiation,
} from "../../cache/payment.cache";
import {
  verifyEsewaResponseSignature,
} from "./esewa/esewa.signature";

import {
  checkEsewaTransactionStatus,
} from "./esewa/esewa.service";

const toRupees = (amountCents: number): string => {
  const rupees = Math.floor(amountCents / 100);
  const paisa = amountCents % 100;

  return `${rupees}.${String(paisa).padStart(2, "0")}`;
};

export const initiateEsewaPayment = async (
  orderId: string,
  userId: string,
  idempotencyKey: string
) => {
  /*
   * 1. Check whether this idempotency key
   *    was already completed.
   */
  const existing = await getPaymentInitiation(
    userId,
    idempotencyKey
  );

  if (existing) {
    if (existing.orderId !== orderId) {
      throw new AppError(
        "Idempotency key was already used for another order",
        422,
        "IDEMPOTENCY_KEY_REUSED"
      );
    }

    if (existing.status === "COMPLETED") {
      return existing.response;
    }

    throw new AppError(
      "Payment initiation is already in progress",
      409,
      "PAYMENT_INITIATION_IN_PROGRESS"
    );
  }

  /*
   * 2. Atomically claim the request.
   */
  const claimed = await claimPaymentInitiation(
    userId,
    idempotencyKey,
    orderId
  );

  if (!claimed) {
    throw new AppError(
      "Payment initiation is already in progress",
      409,
      "PAYMENT_INITIATION_IN_PROGRESS"
    );
  }

  try {
    /*
     * 3. Validate the order.
     */
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new AppError(
        "Order not found",
        404,
        "ORDER_NOT_FOUND"
      );
    }

    if (order.status !== "PENDING") {
      throw new AppError(
        "This order is not available for payment",
        409,
        "ORDER_NOT_PAYABLE"
      );
    }

    if (order.expiresAt <= new Date()) {
      throw new AppError(
        "This order has expired",
        409,
        "ORDER_EXPIRED"
      );
    }

    if (order.totalCents <= 0) {
      throw new AppError(
        "Order amount must be greater than zero",
        400,
        "INVALID_ORDER_AMOUNT"
      );
    }

    /*
     * 4. Reuse an existing pending payment
     *    or create a new one.
     */
    let payment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        provider: "ESEWA",
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "ESEWA",
          transactionUuid: crypto.randomUUID(),
          amountCents: order.totalCents,
          status: "PENDING",
        },
      });
    }

    /*
     * 5. Build eSewa payment request.
     */
    const amount = toRupees(payment.amountCents);

    const transactionUuid = payment.transactionUuid;

    const productCode = env.ESEWA_PRODUCT_CODE;

    const signedFieldNames = [
      "total_amount",
      "transaction_uuid",
      "product_code",
    ];

    const signature = generatePaymentSignature(
      amount,
      transactionUuid,
      productCode
    );

    const response = {
      paymentUrl: env.ESEWA_PAYMENT_URL,

      fields: {
        amount,
        tax_amount: "0",
        total_amount: amount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url:
          `${env.BACKEND_URL}/api/payments/esewa/success`,
        failure_url:
          `${env.BACKEND_URL}/api/payments/esewa/failure`,
        signed_field_names: signedFieldNames.join(","),
        signature,
      },
    };

    /*
     * 6. Save response for idempotent replay.
     */
    await completePaymentInitiation(
      userId,
      idempotencyKey,
      orderId,
      response
    );

    return response;
  } catch (error) {
    /*
     * Allow the client to retry if initiation failed.
     */
    await clearPaymentInitiation(
      userId,
      idempotencyKey
    );

    throw error;
  }
};


export const verifyEsewaPayment = async (
  responseData: Record<string, string>
) => {
  /*
   * -----------------------------------------
   * 1. Verify eSewa response signature
   * -----------------------------------------
   */

  const signatureValid =
    verifyEsewaResponseSignature(responseData);

  if (!signatureValid) {
    throw new AppError(
      "Invalid eSewa response signature",
      400,
      "INVALID_ESEWA_SIGNATURE"
    );
  }

  /*
   * -----------------------------------------
   * 2. Extract response values
   * -----------------------------------------
   */

  const {
    transaction_uuid: transactionUuid,
    total_amount: totalAmount,
    product_code: productCode,
  } = responseData;

  if (
    !transactionUuid ||
    !totalAmount ||
    !productCode
  ) {
    throw new AppError(
      "Invalid eSewa payment response",
      400,
      "INVALID_ESEWA_RESPONSE"
    );
  }

  /*
   * -----------------------------------------
   * 3. Find our payment
   * -----------------------------------------
   */

  const payment = await prisma.payment.findUnique({
    where: {
      transactionUuid,
    },
    include: {
      order: true,
    },
  });

  if (!payment) {
    throw new AppError(
      "Payment transaction not found",
      404,
      "PAYMENT_NOT_FOUND"
    );
  }

  /*
   * -----------------------------------------
   * 4. Verify product code
   * -----------------------------------------
   */

  if (productCode !== env.ESEWA_PRODUCT_CODE) {
    throw new AppError(
      "Invalid eSewa product code",
      400,
      "INVALID_PRODUCT_CODE"
    );
  }

  /*
   * -----------------------------------------
   * 5. Verify amount
   * -----------------------------------------
   */

  const expectedAmount =
    toRupees(payment.amountCents);

  if (totalAmount !== expectedAmount) {
    throw new AppError(
      "Payment amount mismatch",
      400,
      "PAYMENT_AMOUNT_MISMATCH"
    );
  }

  /*
   * -----------------------------------------
   * 6. Already completed?
   * -----------------------------------------
   */

  if (payment.status === "COMPLETED") {
    return {
      success: true,
      message: "Payment already verified",
      paymentId: payment.id,
      orderId: payment.orderId,
    };
  }

  /*
   * -----------------------------------------
   * 7. Ask eSewa for the actual status
   * -----------------------------------------
   */

  const statusResponse =
    await checkEsewaTransactionStatus(
      transactionUuid,
      totalAmount
    );

  if (
    statusResponse.product_code !==
    env.ESEWA_PRODUCT_CODE
  ) {
    throw new AppError(
      "eSewa product code mismatch",
      400,
      "ESEWA_PRODUCT_CODE_MISMATCH"
    );
  }

  if (
    statusResponse.transaction_uuid !==
    transactionUuid
  ) {
    throw new AppError(
      "eSewa transaction UUID mismatch",
      400,
      "ESEWA_TRANSACTION_MISMATCH"
    );
  }

  if (
    statusResponse.total_amount !==
    expectedAmount
  ) {
    throw new AppError(
      "eSewa payment amount mismatch",
      400,
      "ESEWA_AMOUNT_MISMATCH"
    );
  }

  /*
   * -----------------------------------------
   * 8. Payment is not complete
   * -----------------------------------------
   */

  if (statusResponse.status !== "COMPLETE") {
    return {
      success: false,
      status: statusResponse.status,
      paymentId: payment.id,
      orderId: payment.orderId,
    };
  }

  /*
   * -----------------------------------------
   * 9. Atomically mark payment + order paid
   * -----------------------------------------
   */

 await prisma.$transaction(async (tx: any) => {
  const currentPayment = await tx.payment.findUnique({
    where: {
      id: payment.id,
    },
  });

  if (!currentPayment) {
    throw new AppError(
      "Payment not found",
      404,
      "PAYMENT_NOT_FOUND",
    );
  }

  /*
   * Another request may have completed
   * the payment while we were verifying.
   */
  if (currentPayment.status === "COMPLETED") {
    return;
  }

  const currentOrder = await tx.order.findUnique({
    where: {
      id: payment.orderId,
    },
  });

  if (!currentOrder) {
    throw new AppError(
      "Order not found",
      404,
      "ORDER_NOT_FOUND",
    );
  }

  if (currentOrder.status !== "PENDING") {
    if (currentOrder.status === "PAID") {
      return;
    }

    throw new AppError(
      "Order is no longer payable",
      409,
      "ORDER_NOT_PAYABLE",
    );
  }

  await tx.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: "COMPLETED",
      gatewayRefId: statusResponse.ref_id,
      verifiedAt: new Date(),
    },
  });

  await tx.order.update({
    where: {
      id: payment.orderId,
    },
    data: {
      status: "PAID",
    },
  });
});

  return {
    success: true,
    message: "Payment verified successfully",
    paymentId: payment.id,
    orderId: payment.orderId,
    status: "COMPLETED",
  };
};