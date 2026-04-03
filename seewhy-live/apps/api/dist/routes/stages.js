// src/routes/stages.ts
// Stage (live stream room) management — CRUD, start/end, guests
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { streamLimiter } from '../middleware/rateLimiter.js';
import { generateRoomId } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';
const router = Router();
const CreateStageSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    coverImageUrl: z.string().url().optional(),
    isPublic: z.boolean().default(true),
    scheduledAt: z.string().datetime().optional(),
    guestLimit: z.number().int().min(2).max(20).default(20),
    tags: z.array(z.string()).max(10).default([]),
    category: z.string().max(50).optional(),
    streamType: z.enum(['webrtc', 'rtmp', 'both']).default('webrtc'),
    useMeshcast: z.boolean().default(false),
    defaultBitrate: z.number().int().min(500).max(8000).default(2500),
});
const UpdateStageSchema = CreateStageSchema.partial();
const ListStageQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['UPCOMING', 'LIVE', 'ENDED']).optional(),
    category: z.string().optional(),
    search: z.string().max(100).optional(),
});
// GET /api/stages — list public stages
router.get('/', optionalAuth, validate(ListStageQuerySchema, 'query'), async (req, res) => {
    const { page, limit, status, category, search } = req.query;
    const skip = (page - 1) * limit;
    const where = { isPublic: true };
    if (status)
        where.status = status;
    if (category)
        where.category = category;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [stages, total] = await Promise.all([
        prisma.stage.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ status: 'asc' }, { startedAt: 'desc' }, { createdAt: 'desc' }],
            include: {
                creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
                _count: { select: { guests: true, chatMessages: true } },
            },
        }),
        prisma.stage.count({ where }),
    ]);
    res.json({ stages, total, page, limit, pages: Math.ceil(total / limit) });
});
// GET /api/stages/:id
router.get('/:id', optionalAuth, async (req, res) => {
    const stage = await prisma.stage.findUnique({
        where: { id: req.params.id },
        include: {
            creator: { select: { id: true, displayName: true, username: true, avatarUrl: true, isVerified: true } },
            guests: { include: { user: { select: { id: true, displayName: true, username: true, avatarUrl: true } } } },
            _count: { select: { chatMessages: true, transactions: true } },
        },
    });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (!stage.isPublic && stage.creatorId !== req.user?.id) {
        res.status(403).json({ error: 'This stage is private' });
        return;
    }
    // Generate/cache room ID for WebRTC
    if (!stage.roomId) {
        const roomId = generateRoomId(stage.id);
        await prisma.stage.update({ where: { id: stage.id }, data: { roomId } });
        stage.roomId = roomId;
    }
    res.json(stage);
});
// POST /api/stages — create new stage (creator only)
router.post('/', authenticate, requireCreator, validate(CreateStageSchema), async (req, res) => {
    const data = req.body;
    const stage = await prisma.stage.create({
        data: {
            ...data,
            creatorId: req.user.id,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        },
    });
    logger.info({ stageId: stage.id, creatorId: req.user.id }, 'Stage created');
    res.status(201).json(stage);
});
// PATCH /api/stages/:id
router.patch('/:id', authenticate, validate(UpdateStageSchema), async (req, res) => {
    const stage = await prisma.stage.findUnique({ where: { id: req.params.id } });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (stage.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Not your stage' });
        return;
    }
    const data = req.body;
    const updated = await prisma.stage.update({
        where: { id: stage.id },
        data: {
            ...data,
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        },
    });
    res.json(updated);
});
// DELETE /api/stages/:id
router.delete('/:id', authenticate, async (req, res) => {
    const stage = await prisma.stage.findUnique({ where: { id: req.params.id } });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (stage.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Not your stage' });
        return;
    }
    await prisma.stage.delete({ where: { id: stage.id } });
    res.status(204).send();
});
// POST /api/stages/:id/start — go live
router.post('/:id/start', authenticate, streamLimiter, async (req, res) => {
    const stage = await prisma.stage.findUnique({ where: { id: req.params.id } });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (stage.creatorId !== req.user.id) {
        res.status(403).json({ error: 'Not your stage' });
        return;
    }
    if (stage.status === 'LIVE') {
        res.status(409).json({ error: 'Stage already live' });
        return;
    }
    const roomId = generateRoomId(stage.id);
    const updated = await prisma.stage.update({
        where: { id: stage.id },
        data: { status: 'LIVE', startedAt: new Date(), roomId },
    });
    logger.info({ stageId: stage.id }, 'Stage went live');
    res.json(updated);
});
// POST /api/stages/:id/end — end stream
router.post('/:id/end', authenticate, streamLimiter, async (req, res) => {
    const stage = await prisma.stage.findUnique({ where: { id: req.params.id } });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (stage.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Not your stage' });
        return;
    }
    const updated = await prisma.stage.update({
        where: { id: stage.id },
        data: { status: 'ENDED', endedAt: new Date() },
    });
    logger.info({ stageId: stage.id }, 'Stage ended');
    res.json(updated);
});
// POST /api/stages/:id/join — join as guest
router.post('/:id/join', authenticate, async (req, res) => {
    const stage = await prisma.stage.findUnique({ where: { id: req.params.id } });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (stage.status === 'ENDED') {
        res.status(409).json({ error: 'Stream has ended' });
        return;
    }
    const guestCount = await prisma.stageGuest.count({
        where: { stageId: stage.id, leftAt: null, role: { in: ['HOST', 'GUEST'] } },
    });
    if (guestCount >= stage.guestLimit) {
        res.status(409).json({ error: 'Stage is full' });
        return;
    }
    const guest = await prisma.stageGuest.upsert({
        where: { stageId_userId: { stageId: stage.id, userId: req.user.id } },
        create: { stageId: stage.id, userId: req.user.id, role: stage.creatorId === req.user.id ? 'HOST' : 'VIEWER' },
        update: { leftAt: null },
    });
    res.json(guest);
});
// GET /api/stages/creator/:creatorId — creator's stages
router.get('/creator/:creatorId', optionalAuth, async (req, res) => {
    const stages = await prisma.stage.findMany({
        where: {
            creatorId: req.params.creatorId,
            isPublic: req.user?.id === req.params.creatorId ? undefined : true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
            _count: { select: { guests: true } },
        },
    });
    res.json(stages);
});
export default router;
