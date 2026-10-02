import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../errors/app.error";
import { initiateEsewaPayment, verifyEsewaPayment } from "./payment.service";

export class PaymentController {
  async initiateEsewaPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId;
      const { orderId } = req.params;
      const idempotencyKey = req.header("Idempotency-Key");

      if (!userId) {
        throw new AppError(
          "Authentication required",
          401,
          "UNAUTHORIZED"
        );
      }

      if (!idempotencyKey?.trim()) {
        throw new AppError(
          "Idempotency-Key header is required",
          400,
          "IDEMPOTENCY_KEY_REQUIRED"
        );
      }

      const result = await initiateEsewaPayment(
        orderId as string,
        userId,
        idempotencyKey.trim()
      );

      return res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  async esewaSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.query;

      if (typeof data !== "string" || !data.trim()) {
        throw new AppError(
          "Missing eSewa response data",
          400,
          "ESEWA_RESPONSE_MISSING"
        );
      }

      let decoded: unknown;

      try {
        decoded = JSON.parse(
          Buffer.from(data, "base64").toString("utf8")
        );
      } catch {
        throw new AppError(
          "Invalid eSewa response data",
          400,
          "ESEWA_RESPONSE_INVALID"
        );
      }

      if (
        typeof decoded !== "object" ||
        decoded === null ||
        Array.isArray(decoded)
      ) {
        throw new AppError(
          "Invalid eSewa response format",
          400,
          "ESEWA_RESPONSE_INVALID"
        );
      }

      // eSewa may return numeric values, so normalize fields to strings.
      const responseData = Object.fromEntries(
        Object.entries(decoded).map(([key, value]) => [
          key,
          String(value),
        ])
      );

      const result = await verifyEsewaPayment(responseData);

      return res.status(200).json({
        success: result.success,
        message: result.success
          ? "Payment verified successfully"
          : "Payment has not been completed",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  async esewaFailure(req: Request, res: Response, next: NextFunction) {
  try {
    const { data } = req.query;

    // eSewa may return response data even for a failed/cancelled payment.
    if (typeof data === "string" && data.trim()) {
      try {
        const decoded = JSON.parse(
          Buffer.from(data, "base64").toString("utf8")
        );

        console.log("eSewa payment failed:", decoded);
      } catch {
        console.log("eSewa failure response could not be decoded");
      }
    }

    return res.status(200).json({
      success: false,
      message: "Payment was not completed",
    });
  } catch (error) {
    next(error);
  }
}

}

export const paymentController = new PaymentController();