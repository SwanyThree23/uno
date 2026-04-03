// src/routes/users.ts
// User profile, follow system, and settings management

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio:         z.string().max(500).optional(),
  avatarUrl:   z.string().url().optional(),
});

const UpdateUsernameSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

// GET /api/users/:usernameOrId
router.get('/:usernameOrId', optionalAuth, async (req, res) => {
  const id = req.params.usernameOrId as string;
  const user = await prisma.user.findFirst({
    where: { OR: [{ id }, { username: id }] },
    select: {
      id: true, displayName: true, username: true, avatarUrl: true,
      bio: true, isVerified: true, role: true, createdAt: true,
      _count: { select: { stages: true, followers: true, follows: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

// PATCH /api/users/me/profile
router.patch('/me/profile', authenticate, validate(UpdateProfileSchema), async (req, res) => {
  const data = req.body as z.infer<typeof UpdateProfileSchema>;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: { id: true, displayName: true, username: true, avatarUrl: true, bio: true },
  });
  res.json(user);
});

// PATCH /api/users/me/username
router.patch('/me/username', authenticate, validate(UpdateUsernameSchema), async (req, res) => {
  const { username } = req.body as z.infer<typeof UpdateUsernameSchema>;
  const exists = await prisma.user.findFirst({ where: { username, NOT: { id: req.user!.id } } });
  if (exists) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data:  { username },
    select: { id: true, username: true },
  });
  res.json(user);
});

// POST /api/users/:id/follow
router.post('/:id/follow', authenticate, apiLimiter, async (req, res) => {
  const followedId = req.params.id as string;
  if (followedId === req.user!.id) {
    res.status(400).json({ error: 'Cannot follow yourself' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: followedId } });
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const follow = await prisma.follow.upsert({
    where:  { followerId_followedId: { followerId: req.user!.id, followedId } },
    create: { followerId: req.user!.id, followedId },
    update: {},
  });

  res.status(201).json(follow);
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', authenticate, async (req, res) => {
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.id, followedId: req.params.id as string },
  });
  res.status(204).send();
});

// GET /api/users/:id/followers
router.get('/:id/followers', async (req, res) => {
  const followers = await prisma.follow.findMany({
    where:   { followedId: req.params.id as string },
    include: { follower: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  res.json(followers.map((f: any) => f.follower));
});

// GET /api/users/:id/following
router.get('/:id/following', async (req, res) => {
  const following = await prisma.follow.findMany({
    where:   { followerId: req.params.id as string },
    include: { followed: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });
  res.json(following.map((f: { followed: any }) => f.followed));
});

// PATCH /api/users/:id/role — admin only
router.patch('/:id/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body as { role: 'USER' | 'CREATOR' | 'ADMIN' };
  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data:  { role },
    select: { id: true, role: true, email: true },
  });
  res.json(user);
});

// GET /api/users — list users (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { page = '1', limit = '20', search } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = search
    ? { OR: [{ displayName: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: parseInt(limit),
      select: { id: true, displayName: true, username: true, email: true, role: true, isVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total });
});

export default router;
