// src/routes/marketplace.ts
// Creator product marketplace — digital and physical products
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
const router = Router();
const ProductSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    imageUrl: z.string().url().optional(),
    price: z.number().min(0.01).max(10000),
    currency: z.string().length(3).default('USD'),
    type: z.enum(['DIGITAL', 'PHYSICAL']),
    inventory: z.number().int().min(0).optional(),
});
const UpdateProductSchema = ProductSchema.partial().extend({
    isActive: z.boolean().optional(),
});
// GET /api/marketplace — browse all active products
router.get('/', optionalAuth, async (req, res) => {
    const { page = '1', limit = '20', type, minPrice, maxPrice, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: true };
    if (type)
        where.type = type;
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice)
            where.price.gte = parseFloat(minPrice);
        if (maxPrice)
            where.price.lte = parseFloat(maxPrice);
    }
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where, skip, take: parseInt(limit),
            include: { creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
    ]);
    res.json({ products, total });
});
// GET /api/marketplace/:id
router.get('/:id', optionalAuth, async (req, res) => {
    const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
    });
    if (!product || !product.isActive) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    res.json(product);
});
// POST /api/marketplace — create product (creator only)
router.post('/', authenticate, requireCreator, validate(ProductSchema), async (req, res) => {
    const data = req.body;
    const product = await prisma.product.create({
        data: { ...data, creatorId: req.user.id },
    });
    res.status(201).json(product);
});
// PATCH /api/marketplace/:id
router.patch('/:id', authenticate, validate(UpdateProductSchema), async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    if (product.creatorId !== req.user.id) {
        res.status(403).json({ error: 'Not your product' });
        return;
    }
    const updated = await prisma.product.update({
        where: { id: product.id },
        data: req.body,
    });
    res.json(updated);
});
// DELETE /api/marketplace/:id
router.delete('/:id', authenticate, async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    if (product.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Not your product' });
        return;
    }
    await prisma.product.delete({ where: { id: product.id } });
    res.status(204).send();
});
// GET /api/marketplace/creator/:creatorId
router.get('/creator/:creatorId', optionalAuth, async (req, res) => {
    const products = await prisma.product.findMany({
        where: { creatorId: req.params.creatorId, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(products);
});
export default router;
