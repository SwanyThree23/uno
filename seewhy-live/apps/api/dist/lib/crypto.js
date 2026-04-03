// src/lib/crypto.ts
// AES-256-GCM encryption for stream keys
// Also provides secure token generation utilities
import crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
function getEncryptionKey() {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('ENCRYPTION_SECRET must be at least 32 characters');
    }
    // Derive 32-byte key using SHA-256
    return crypto.createHash('sha256').update(secret).digest();
}
/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns base64-encoded ciphertext, IV, and auth tag.
 */
export function encrypt(plaintext) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
        encryptedKey: encrypted.toString('base64'),
        keyIv: iv.toString('base64'),
        keyTag: tag.toString('base64'),
    };
}
/**
 * Decrypts AES-256-GCM ciphertext.
 */
export function decrypt(data) {
    const key = getEncryptionKey();
    const iv = Buffer.from(data.keyIv, 'base64');
    const tag = Buffer.from(data.keyTag, 'base64');
    const encryptedBuffer = Buffer.from(data.encryptedKey, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
    ]).toString('utf8');
}
/**
 * Generates a cryptographically secure random hex token.
 */
export function generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}
/**
 * Generates a HMAC-SHA256 signature.
 */
export function hmacSign(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}
/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeCompare(a, b) {
    if (a.length !== b.length)
        return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
/**
 * Generates a VDO.Ninja room ID using HMAC with the env salt.
 */
export function generateRoomId(stageId) {
    const salt = process.env.VDO_NINJA_SALT || 'default-salt';
    return hmacSign(stageId, salt).slice(0, 32);
}
