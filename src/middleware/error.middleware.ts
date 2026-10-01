import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { AppError } from "../errors/app.error";

export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  logger.error(
    {
      error,
      method: req.method,
      path: req.path,
    },
    "Unhandled error",
  );

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    },
  });
}