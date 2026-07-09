import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const rawSecret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;

if (!rawSecret) {
  throw new Error("JWT_SECRET or SESSION_SECRET environment variable must be set.");
}

const JWT_SECRET: string = rawSecret;

export interface AuthPayload {
  userId: number;
  email: string;
  role: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
    (req as Request & { auth: AuthPayload }).auth = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
