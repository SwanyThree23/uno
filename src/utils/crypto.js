import crypto from 'crypto';

export const generateHexSecret = (length = 24) => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateBridgeSecret = () => {
  return `bridge_${generateHexSecret(32)}`;
};

export const generateSeeWhyApiKey = () => {
  return `sw_${generateHexSecret(24)}`;
};

/**
 * Timing-safe comparison for secrets
 */
export const timingSafeCompare = (a, b) => {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * HMAC SHA256 verification
 */
export const verifyHmac = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return timingSafeCompare(digest, signature);
};
