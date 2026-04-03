// src/routes/subscriptions.ts
// Creator subscription tiers: BRONZE ($1), SILVER ($5), GOLD ($15)
// 90/10 split enforced via Stripe application_fee_percent
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';
import { createSubscription, cancelSubscription, createCustomer, stripe } from '../lib/stripe.js';
import { constructWebhookEvent } from '../lib/stripe.js';
import { logger } from '../lib/logger.js';
const router = Router();
// Fixed subscription amounts — immutable
const TIER_PRICES = {
    BRONZE: { amount: 1.00, priceEnvKey: 'STRIPE_PRICE_BRONZE' },
    SILVER: { amount: 5.00, priceEnvKey: 'STRIPE_PRICE_SILVER' },
    GOLD: { amount: 15.00, priceEnvKey: 'STRIPE_PRICE_GOLD' },
};
const SubscribeSchema = z.object({
    creatorId: z.string().min(1),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD']),
    paymentMethodId: z.string().min(1),
});
// POST /api/subscriptions/subscribe
router.post('/subscribe', authenticate, paymentLimiter, validate(SubscribeSchema), async (req, res) => {
    const { creatorId, tier, paymentMethodId } = req.body;
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator?.stripeConnectId) {
        res.status(400).json({ error: 'Creator has not set up payments' });
        return;
    }
    const priceId = process.env[TIER_PRICES[tier].priceEnvKey];
    if (!priceId) {
        res.status(500).json({ error: `Price not configured for ${tier}` });
        return;
    }
    // Get or create Stripe customer
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let customerId = user?.stripeCustomerId;
    if (!customerId) {
        customerId = await createCustomer(req.user.email);
        await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
    }
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
    });
    const subscription = await createSubscription(customerId, priceId, creator.stripeConnectId);
    await prisma.subscription.upsert({
        where: { subscriberId_creatorId_tier: { subscriberId: req.user.id, creatorId, tier } },
        create: {
            subscriberId: req.user.id,
            creatorId,
            tier,
            amount: TIER_PRICES[tier].amount,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: 'ACTIVE',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        update: {
            status: 'ACTIVE',
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
    });
    logger.info({ subscriberId: req.user.id, creatorId, tier }, 'Subscription created');
    res.status(201).json({
        subscriptionId: subscription.id,
        tier,
        amount: TIER_PRICES[tier].amount,
        status: 'ACTIVE',
    });
});
// DELETE /api/subscriptions/:creatorId/:tier
router.delete('/:creatorId/:tier', authenticate, async (req, res) => {
    const { creatorId, tier } = req.params;
    const sub = await prisma.subscription.findUnique({
        where: { subscriberId_creatorId_tier: { subscriberId: req.user.id, creatorId, tier: tier } },
    });
    if (!sub) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
    }
    if (sub.stripeSubscriptionId) {
        await cancelSubscription(sub.stripeSubscriptionId);
    }
    await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'CANCELLED', cancelAtPeriodEnd: true },
    });
    res.json({ message: 'Subscription will cancel at end of billing period' });
});
// GET /api/subscriptions/my-subscriptions
router.get('/my-subscriptions', authenticate, async (req, res) => {
    const subs = await prisma.subscription.findMany({
        where: { subscriberId: req.user.id, status: 'ACTIVE' },
        include: { creator: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
    });
    res.json(subs);
});
// GET /api/subscriptions/my-subscribers
router.get('/my-subscribers', authenticate, async (req, res) => {
    const subs = await prisma.subscription.findMany({
        where: { creatorId: req.user.id, status: 'ACTIVE' },
        include: { subscriber: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
    });
    res.json(subs);
});
// POST /api/subscriptions/webhook
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = constructWebhookEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    }
    catch {
        res.status(400).json({ error: 'Webhook signature invalid' });
        return;
    }
    switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const sub = event.data.object;
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: sub.id },
                data: {
                    status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'CANCELLED',
                    currentPeriodEnd: new Date(sub.current_period_end * 1000),
                    cancelAtPeriodEnd: sub.cancel_at_period_end,
                },
            });
            break;
        }
    }
    res.json({ received: true });
});
export default router;
