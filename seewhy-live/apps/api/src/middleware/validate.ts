// src/middleware/validate.ts
// Zod schema validation middleware for request body, query, and params

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Validates req[part] against the given Zod schema.
 * Returns 400 with structured errors on failure.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    // Replace parsed value (coerced/transformed by Zod)
    (req as Record<string, unknown>)[part] = result.data;
    next();
  };
}
