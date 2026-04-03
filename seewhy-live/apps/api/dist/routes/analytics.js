// src/routes/analytics.ts
// Creator analytics — viewer counts, revenue stats, engagement metrics
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { redis } from '../lib/redis.js';
const router = Router();
// GET /api/analytics/dashboard — creator dashboard stats
router.get('/dashboard', authenticate, async (req, res) => {
    const userId = req.user.id;
    const [totalStages, liveStages, totalRevenue, totalFollowers, recentTransactions, recentStages,] = await Promise.all([
        prisma.stage.count({ where: { creatorId: userId } }),
        prisma.stage.count({ where: { creatorId: userId, status: 'LIVE' } }),
        prisma.transaction.aggregate({
            where: { toUserId: userId, status: 'COMPLETED' },
            _sum: { creatorAmount: true },
        }),
        prisma.follow.count({ where: { followedId: userId } }),
        prisma.transaction.findMany({
            where: { toUserId: userId, status: 'COMPLETED' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { fromUser: { select: { id: true, displayName: true, avatarUrl: true } } },
        }),
        prisma.stage.findMany({
            where: { creatorId: userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { guests: true, chatMessages: true } } },
        }),
    ]);
    // Get live viewer counts from Redis
    const liveViewerKeys = await redis.keys(`presence:*:viewers`);
    let totalCurrentViewers = 0;
    for (const key of liveViewerKeys) {
        const count = await redis.scard(key);
        totalCurrentViewers += count;
    }
    res.json({
        totalStages,
        liveStages,
        totalRevenue: Number(totalRevenue._sum.creatorAmount || 0),
        totalFollowers,
        totalCurrentViewers,
        recentTransactions,
        recentStages,
    });
});
// GET /api/analytics/stages/:stageId — per-stage analytics
router.get('/stages/:stageId', authenticate, async (req, res) => {
    const stageId = req.params.stageId;
    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) {
        res.status(404).json({ error: 'Stage not found' });
        return;
    }
    if (stage.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }
    const [revenue, messageCount, guestCount, superchats,] = await Promise.all([
        prisma.transaction.aggregate({
            where: { stageId, status: 'COMPLETED' },
            _sum: { grossAmount: true, creatorAmount: true, platformFee: true },
            _count: { id: true },
        }),
        prisma.chatMessage.count({ where: { stageId } }),
        prisma.stageGuest.count({ where: { stageId } }),
        prisma.transaction.aggregate({
            where: { stageId, type: 'SUPERCHAT', status: 'COMPLETED' },
            _sum: { grossAmount: true },
            _count: { id: true },
        }),
    ]);
    // Live viewer count from Redis
    const viewerCount = await redis.scard(`presence:${stageId}:viewers`);
    const duration = stage.startedAt && stage.endedAt
        ? Math.floor((stage.endedAt.getTime() - stage.startedAt.getTime()) / 1000)
        : null;
    res.json({
        stage: {
            id: stage.id, title: stage.title, status: stage.status,
            startedAt: stage.startedAt, endedAt: stage.endedAt, duration,
        },
        metrics: {
            currentViewers: viewerCount,
            totalGuests: guestCount,
            totalMessages: messageCount,
        },
        revenue: {
            gross: Number(revenue._sum.grossAmount || 0),
            creator: Number(revenue._sum.creatorAmount || 0),
            platform: Number(revenue._sum.platformFee || 0),
            transactions: revenue._count.id,
        },
        superchats: {
            total: Number(superchats._sum.grossAmount || 0),
            count: superchats._count.id,
        },
    });
});
// GET /api/analytics/revenue — revenue over time
router.get('/revenue', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await prisma.transaction.findMany({
        where: { toUserId: userId, status: 'COMPLETED', createdAt: { gte: since } },
        select: { createdAt: true, creatorAmount: true, type: true, grossAmount: true },
        orderBy: { createdAt: 'asc' },
    });
    // Group by day
    const byDay = {};
    for (const tx of transactions) {
        const day = tx.createdAt.toISOString().slice(0, 10);
        if (!byDay[day])
            byDay[day] = { date: day, revenue: 0, gross: 0, count: 0 };
        byDay[day].revenue += Number(tx.creatorAmount);
        byDay[day].gross += Number(tx.grossAmount);
        byDay[day].count += 1;
    }
    const total = transactions.reduce((sum, t) => sum + Number(t.creatorAmount), 0);
    res.json({
        period,
        total,
        daily: Object.values(byDay),
        byType: {
            superchats: transactions.filter((t) => t.type === 'SUPERCHAT').reduce((s, t) => s + Number(t.creatorAmount), 0),
            tips: transactions.filter((t) => t.type === 'TIP').reduce((s, t) => s + Number(t.creatorAmount), 0),
            products: transactions.filter((t) => t.type === 'PRODUCT_SALE').reduce((s, t) => s + Number(t.creatorAmount), 0),
        },
    });
});
export default router;
