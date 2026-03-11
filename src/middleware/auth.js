import { getConfig } from '../db/index.js';
import { timingSafeCompare, verifyHmac } from '../utils/crypto.js';

export const bridgeAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const secret = getConfig('BRIDGE_SECRET');

  if (!timingSafeCompare(token, secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

export const ghlTriggerAuth = (req, res, next) => {
  const secret = req.headers['x-bridge-secret'];
  const storedSecret = getConfig('BRIDGE_SECRET');

  if (!secret || !timingSafeCompare(secret, storedSecret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

export const seewhyWebhookAuth = (req, res, next) => {
  const signature = req.headers['x-seewhy-signature'];
  const secret = getConfig('SEEWHY_WEBHOOK_SECRET'); // Assumed secret for HMAC

  if (!signature || !verifyHmac(JSON.stringify(req.body), signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

export const logScrubber = (req, res, next) => {
  // Logic to scrub sensitive fields from logs if needed
  next();
};
