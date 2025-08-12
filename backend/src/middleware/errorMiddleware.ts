import { Request, Response, NextFunction } from "express";
import { apiResponse } from "../utils/responseFormatter";
import { AppError } from "../utils/error";

// Global error handler (Express recognizes this by 4 args)
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Normalize error
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;
  const message = isAppError ? err.message : "Errore interno del server";

  // Do not leak stack traces in production
  const includeDetails = process.env.NODE_ENV !== "production";
  const errorPayload = includeDetails ? err : undefined;

  return res.status(status).json(
    apiResponse({
      message,
      ...(errorPayload !== undefined && { error: errorPayload }),
    })
  );
}


