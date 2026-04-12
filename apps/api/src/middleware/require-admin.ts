import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../env.js";

export interface AdminRequest extends Request {
  admin?: {
    adminId: string;
    username: string;
  };
}

export function requireAdmin(request: AdminRequest, response: Response, next: NextFunction) {
  const token = request.cookies.admin_session;
  if (!token) {
    response.status(401).json({ message: "Admin authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { adminId: string; username: string };
    request.admin = payload;
    next();
  } catch {
    response.clearCookie("admin_session");
    response.status(401).json({ message: "Session expired" });
  }
}
