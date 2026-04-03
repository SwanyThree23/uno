// src/lib/jwt.ts
// RS256 asymmetric JWT with access + refresh token pairs
// Refresh token rotation with family-based theft detection
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma.js';
import { logger } from './logger.js';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
let privateKey;
let publicKey;
function loadKeys() {
    if (privateKey && publicKey)
        return;
    try {
        const privPath = path.resolve(process.env.JWT_PRIVATE_KEY_PATH || './keys/private.pem');
        const pubPath = path.resolve(process.env.JWT_PUBLIC_KEY_PATH || './keys/public.pem');
        privateKey = fs.readFileSync(privPath, 'utf-8');
        publicKey = fs.readFileSync(pubPath, 'utf-8');
    }
    catch {
        // Fallback to symmetric secret for dev environments without key files
        logger.warn('JWT key files not found — using symmetric secret (dev only)');
        privateKey = process.env.COOKIE_SECRET || 'dev-secret-change-me';
        publicKey = process.env.COOKIE_SECRET || 'dev-secret-change-me';
    }
}
export function signAccessToken(payload) {
    loadKeys();
    const algo = privateKey.includes('BEGIN RSA') ? 'RS256' : 'HS256';
    return jwt.sign(payload, privateKey, {
        algorithm: algo,
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'seewhylive.com',
        audience: 'seewhylive-api',
    });
}
export function verifyAccessToken(token) {
    loadKeys();
    const algo = publicKey.includes('BEGIN PUBLIC') ? 'RS256' : 'HS256';
    return jwt.verify(token, publicKey, {
        algorithms: [algo],
        issuer: 'seewhylive.com',
        audience: 'seewhylive-api',
    });
}
export async function createRefreshToken(userId, family) {
    const { default: crypto } = await import('crypto');
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await prisma.refreshToken.create({
        data: { token, userId, family, expiresAt },
    });
    return token;
}
export async function rotateRefreshToken(oldToken) {
    const record = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
        include: { user: true },
    });
    if (!record)
        return null;
    // Token reuse detected — invalidate entire family
    if (record.used) {
        logger.warn({ family: record.family }, 'Refresh token reuse detected — invalidating family');
        await prisma.refreshToken.deleteMany({ where: { family: record.family } });
        return null;
    }
    if (record.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: record.id } });
        return null;
    }
    // Mark old token as used
    await prisma.refreshToken.update({ where: { id: record.id }, data: { used: true } });
    const payload = {
        sub: record.user.id,
        role: record.user.role,
        email: record.user.email,
    };
    const accessToken = signAccessToken(payload);
    const refreshToken = await createRefreshToken(record.userId, record.family);
    return {
        accessToken,
        refreshToken,
        user: { id: record.user.id, role: record.user.role, email: record.user.email },
    };
}
export async function revokeRefreshToken(token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
}
export async function revokeAllUserTokens(userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
}
