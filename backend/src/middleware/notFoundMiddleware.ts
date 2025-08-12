import { Request, Response, NextFunction } from "express";
import { apiResponse } from "../utils/responseFormatter";

export function notFoundMiddleware(_req: Request, res: Response, _next: NextFunction) {
  return res.status(404).json(
    apiResponse({ message: "Risorsa non trovata" })
  );
}


