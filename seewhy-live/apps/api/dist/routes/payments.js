// src/routes/payments.ts
// Stripe Connect payments, superchats, tips, webhooks, payouts
// IMMUTABLE 90/10 split enforced — platform always takes 10%
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { computeFees, createPaymentIntent, createConnectAccount, createOnboardingLink, getConnectAccountStatus, constructWebhookEvent, } from '../lib/stripe.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';
import { generateSecureToken } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';
const router = Router();
const PaymentSchema = z.object({
    toUserId: z.string().min(1),
    stageId: z.string().optional(),
    grossAmountCents: z.number().int().min(100).max(10_000_00), // $1 min, $10,000 max
    currency: z.string().length(3).default('USD'),
    type: z.enum(['SUPERCHAT', 'TIP', 'PRODUCT_SALE']),
    message: z.string().max(500).optional(),
});
// POST /api/payments/create-intent
router.post('/create-intent', authenticate, paymentLimiter, validate(PaymentSchema), async (req, res) => {
    const { toUserId, stageId, grossAmountCents, currency, type, message } = req.body;
    const creator = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!creator?.stripeConnectId) {
        res.status(400).json({ error: 'Creator has not set up payments' });
        return;
    }
    if (!creator.chargesEnabled) {
        res.status(400).json({ error: "Creator's payment account is not yet enabled" });
        return;
    }
    const fees = computeFees(grossAmountCents);
    const idempotencyKey = generateSecureToken(16);
    const intent = await createPaymentIntent(grossAmountCents, currency.toLowerCase(), creator.stripeConnectId, idempotencyKey, {
        fromUserId: req.user.id,
        toUserId,
        type,
        stageId: stageId || '',
        message: message || '',
    });
    // Create pending transaction record
    await prisma.transaction.create({
        data: {
            fromUserId: req.user.id,
            toUserId,
            stageId: stageId || null,
            type,
            grossAmount: fees.grossAmount / 100,
            platformFee: fees.platformFee / 100,
            creatorAmount: fees.creatorAmount / 100,
            currency: currency.toUpperCase(),
            status: 'PENDING',
            stripePaymentIntentId: intent.id,
            idempotencyKey,
        },
    });
    logger.info({ intentId: intent.id, grossAmountCents }, 'Payment intent created');
    res.json({
        clientSecret: intent.client_secret,
        fees: {
            grossAmount: fees.grossAmount,
            platformFee: fees.platformFee,
            creatorAmount: fees.creatorAmount,
        },
    });
});
// POST /api/payments/connect/onboard — set up Stripe Connect
router.post('/connect/onboard', authenticate, async (req, res) => {
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    let accountId = user.stripeConnectId;
    if (!accountId) {
        accountId = await createConnectAccount(user.email);
        await prisma.user.update({
            where: { id: user.id },
            data: { stripeConnectId: accountId },
        });
    }
    const returnUrl = `${process.env.APP_BASE_URL}/settings/payments`;
    const onboardingUrl = await createOnboardingLink(accountId, returnUrl);
    res.json({ url: onboardingUrl });
});
// GET /api/payments/connect/status
router.get('/connect/status', authenticate, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.stripeConnectId) {
        res.json({ connected: false });
        return;
    }
    const status = await getConnectAccountStatus(user.stripeConnectId);
    // Sync status to DB
    if (status.chargesEnabled !== user.chargesEnabled || status.payoutsEnabled !== user.payoutsEnabled) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                chargesEnabled: status.chargesEnabled,
                payoutsEnabled: status.payoutsEnabled,
            },
        });
    }
    res.json({ connected: true, ...status });
});
// GET /api/payments/history
router.get('/history', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { page = '1', limit = '20', direction = 'received' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = direction === 'sent'
        ? { fromUserId: userId }
        : { toUserId: userId };
    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where, skip, take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                fromUser: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
                toUser: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
                stage: { select: { id: true, title: true } },
            },
        }),
        prisma.transaction.count({ where }),
    ]);
    res.json({ transactions, total });
});
// POST /api/payments/webhook — Stripe webhook handler
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = constructWebhookEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    }
    catch (err) {
        logger.warn({ err }, 'Stripe webhook signature verification failed');
        res.status(400).json({ error: 'Webhook signature verification failed' });
        return;
    }
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const intent = event.data.object;
                const tx = await prisma.transaction.findFirst({
                    where: { stripePaymentIntentId: intent.id },
                    include: { toUser: { select: { email: true } } },
                });
                if (tx) {
                    await prisma.transaction.update({
                        where: { id: tx.id },
                        data: { status: 'COMPLETED' },
                    });
                    // Create audit fee record
                    await prisma.feeRecord.upsert({
                        where: { transactionId: tx.id },
                        create: {
                            transactionId: tx.id,
                            grossAmount: tx.grossAmount,
                            platformFee: tx.platformFee,
                            creatorAmount: tx.creatorAmount,
                        },
                        update: {},
                    });
                    logger.info({ txId: tx.id }, 'Payment completed, fee record created');
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const intent = event.data.object;
                await prisma.transaction.updateMany({
                    where: { stripePaymentIntentId: intent.id },
                    data: { status: 'REFUNDED' },
                });
                break;
            }
            case 'account.updated': {
                const account = event.data.object;
                await prisma.user.updateMany({
                    where: { stripeConnectId: account.id },
                    data: {
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                    },
                });
                break;
            }
        }
    }
    catch (err) {
        logger.error({ err, eventType: event.type }, 'Webhook handler error');
    }
    res.json({ received: true });
});
export default router;
