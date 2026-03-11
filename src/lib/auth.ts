import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;

export function signAccessToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function signRefreshToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function requireAuth(req: NextRequest): JWTPayload {
  const token = extractBearerToken(req);
  if (!token) throw new Error("No authorization token provided");
  return verifyToken(token);
}
