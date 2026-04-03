// src/middleware/validate.ts
// Zod schema validation middleware for request body, query, and params
/**
 * Validates req[part] against the given Zod schema.
 * Returns 400 with structured errors on failure.
 */
export function validate(schema, part = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[part]);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            res.status(400).json({ error: 'Validation failed', details: errors });
            return;
        }
        // Replace parsed value with Zod-coerced/transformed version
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req[part] = result.data;
        next();
    };
}
