import type { NextFunction, Request, Response } from "express";

export function asyncHandler<TRequest extends Request = Request>(
  handler: (request: TRequest, response: Response, next: NextFunction) => Promise<unknown>
) {
  return (request: TRequest, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
