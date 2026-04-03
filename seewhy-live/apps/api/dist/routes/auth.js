// src/routes/auth.ts
// Authentication: register, login, refresh, logout, verify email, password reset
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../lib/jwt.js';
import { generateSecureToken } from '../lib/crypto.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../lib/email.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../lib/logger.js';
const router = Router();
const RegisterSchema = z.object({
    displayName: z.string().min(2).max(50),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(8).max(128),
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
const RefreshSchema = z.object({ refreshToken: z.string().min(1) });
const ForgotPasswordSchema = z.object({ email: z.string().email() });
const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
});
// POST /api/auth/register
router.post('/register', authLimiter, validate(RegisterSchema), async (req, res) => {
    const { displayName, username, email, password } = req.body;
    const exists = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });
    if (exists) {
        res.status(409).json({ error: exists.email === email ? 'Email already in use' : 'Username taken' });
        return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerifyToken = generateSecureToken(32);
    const user = await prisma.user.create({
        data: { displayName, username, email, passwordHash, emailVerifyToken },
    });
    await sendVerificationEmail(email, emailVerifyToken);
    await sendWelcomeEmail(email, displayName);
    const family = generateSecureToken(16);
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = await createRefreshToken(user.id, family);
    logger.info({ userId: user.id }, 'User registered');
    res.status(201).json({
        accessToken,
        refreshToken,
        user: { id: user.id, displayName: user.displayName, username: user.username, email: user.email, role: user.role },
    });
});
// POST /api/auth/login
router.post('/login', authLimiter, validate(LoginSchema), async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    const family = generateSecureToken(16);
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = await createRefreshToken(user.id, family);
    logger.info({ userId: user.id }, 'User logged in');
    res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, displayName: user.displayName, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    });
});
// POST /api/auth/refresh
router.post('/refresh', validate(RefreshSchema), async (req, res) => {
    const { refreshToken } = req.body;
    const result = await rotateRefreshToken(refreshToken);
    if (!result) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
        return;
    }
    res.json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
});
// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }
    res.json({ message: 'Logged out' });
});
// POST /api/auth/logout-all
router.post('/logout-all', authenticate, async (req, res) => {
    await revokeAllUserTokens(req.user.id);
    res.json({ message: 'All sessions terminated' });
});
// GET /api/auth/verify-email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        res.status(400).json({ error: 'Token required' });
        return;
    }
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) {
        res.status(400).json({ error: 'Invalid or expired token' });
        return;
    }
    await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, emailVerifyToken: null },
    });
    res.json({ message: 'Email verified successfully' });
});
// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, validate(ForgotPasswordSchema), async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (user) {
        const resetToken = generateSecureToken(32);
        const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExp },
        });
        await sendPasswordResetEmail(email, resetToken);
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' });
});
// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, validate(ResetPasswordSchema), async (req, res) => {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExp: { gt: new Date() },
        },
    });
    if (!user) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetToken: null, resetTokenExp: null },
    });
    // Invalidate all sessions
    await revokeAllUserTokens(user.id);
    res.json({ message: 'Password reset successfully. Please log in again.' });
});
// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true, displayName: true, username: true, email: true,
            role: true, avatarUrl: true, bio: true, isVerified: true,
            emailVerified: true, chargesEnabled: true, payoutsEnabled: true,
            createdAt: true,
        },
    });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json(user);
});
export default router;
