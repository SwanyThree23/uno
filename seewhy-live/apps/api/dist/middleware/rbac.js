// src/middleware/rbac.ts
// Role-based access control middleware
const ROLE_HIERARCHY = {
    USER: 1,
    CREATOR: 2,
    ADMIN: 3,
};
/**
 * Requires the authenticated user to have at least the specified role.
 * Use after `authenticate` middleware.
 */
export function requireRole(minimumRole) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
        const required = ROLE_HIERARCHY[minimumRole];
        if (userLevel < required) {
            res.status(403).json({ error: 'Insufficient permissions', required: minimumRole });
            return;
        }
        next();
    };
}
export const requireCreator = requireRole('CREATOR');
export const requireAdmin = requireRole('ADMIN');
