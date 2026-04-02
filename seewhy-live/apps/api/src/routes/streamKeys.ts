// src/routes/streamKeys.ts
// Stream key management — RTMP keys encrypted at rest with AES-256-GCM

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

const router = Router();

const CreateKeySchema = z.object({
  platform: z.enum(['YOUTUBE', 'TWITCH', 'TIKTOK', 'FACEBOOK', 'CUSTOM', 'OBS_WHIP']),
  label:    z.string().min(1).max(100),
  key:      z.string().min(1).max(1000),
  stageId:  z.string().optional(),
});

// GET /api/stream-keys — list user's stream keys (no plaintext)
router.get('/', authenticate, async (req, res) => {
  const keys = await prisma.streamKey.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true, platform: true, label: true, isActive: true,
      lastUsedAt: true, createdAt: true, stageId: true,
      // Intentionally exclude encryptedKey, keyIv, keyTag from listing
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(keys);
});

// POST /api/stream-keys — store encrypted stream key
router.post('/', authenticate, validate(CreateKeySchema), async (req, res) => {
  const { platform, label, key, stageId } = req.body as z.infer<typeof CreateKeySchema>;

  const encrypted = encrypt(key);

  const streamKey = await prisma.streamKey.create({
    data: {
      userId:       req.user!.id,
      platform,
      label,
      encryptedKey: encrypted.encryptedKey,
      keyIv:        encrypted.keyIv,
      keyTag:       encrypted.keyTag,
      stageId:      stageId || null,
    },
    select: {
      id: true, platform: true, label: true, isActive: true, createdAt: true,
    },
  });

  logger.info({ keyId: streamKey.id, platform }, 'Stream key stored');
  res.status(201).json(streamKey);
});

// GET /api/stream-keys/:id/reveal — decrypt and return key (authenticated owner only)
router.get('/:id/reveal', authenticate, async (req, res) => {
  const record = await prisma.streamKey.findUnique({ where: { id: req.params.id as string } });
  if (!record) { res.status(404).json({ error: 'Key not found' }); return; }
  if (record.userId !== req.user!.id) { res.status(403).json({ error: 'Not your key' }); return; }

  const plaintext = decrypt({
    encryptedKey: record.encryptedKey,
    keyIv:        record.keyIv,
    keyTag:       record.keyTag,
  });

  await prisma.streamKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });

  res.json({ key: plaintext });
});

// PATCH /api/stream-keys/:id/toggle
router.patch('/:id/toggle', authenticate, async (req, res) => {
  const record = await prisma.streamKey.findUnique({ where: { id: req.params.id as string } });
  if (!record) { res.status(404).json({ error: 'Key not found' }); return; }
  if (record.userId !== req.user!.id) { res.status(403).json({ error: 'Not your key' }); return; }

  const updated = await prisma.streamKey.update({
    where: { id: record.id },
    data:  { isActive: !record.isActive },
    select: { id: true, isActive: true },
  });
  res.json(updated);
});

// DELETE /api/stream-keys/:id
router.delete('/:id', authenticate, async (req, res) => {
  const record = await prisma.streamKey.findUnique({ where: { id: req.params.id as string } });
  if (!record) { res.status(404).json({ error: 'Key not found' }); return; }
  if (record.userId !== req.user!.id) { res.status(403).json({ error: 'Not your key' }); return; }

  await prisma.streamKey.delete({ where: { id: record.id } });
  res.status(204).send();
});

export default router;
