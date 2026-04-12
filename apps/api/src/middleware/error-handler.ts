import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/http.js";

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Internal server error" });
}
