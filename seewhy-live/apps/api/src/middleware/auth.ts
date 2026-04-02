// src/middleware/auth.ts
// JWT access token verification middleware with role-based guards

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { id: string };
    }
  }
}

/**
 * Extracts and verifies the Bearer JWT from Authorization header.
 * Attaches `req.user` on success.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { ...payload, id: payload.sub };
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    logger.debug({ err }, 'JWT verification failed');
    if (message.includes('expired')) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

/**
 * Optional auth — attaches user if token present but does not block unauthenticated.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.user = { ...payload, id: payload.sub };
    } catch {
      // silently ignore
    }
  }
  next();
}
