import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../env.js";

export interface CandidateRequest extends Request {
  candidateAuth?: {
    sessionId: string;
    candidateId: string;
  };
}

export function requireCandidateSession(
  request: CandidateRequest,
  response: Response,
  next: NextFunction
) {
  const token = request.cookies.candidate_session;
  if (!token) {
    response.status(401).json({ message: "Candidate session required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sessionId: string; candidateId: string };
    const routeSessionId = request.params.sessionId ?? request.body.sessionId;

    if (routeSessionId && routeSessionId !== payload.sessionId) {
      response.status(403).json({ message: "Session mismatch" });
      return;
    }

    request.candidateAuth = payload;
    next();
  } catch {
    response.clearCookie("candidate_session");
    response.status(401).json({ message: "Candidate session expired" });
  }
}
