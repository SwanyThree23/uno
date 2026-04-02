// src/lib/stripe.ts
// Stripe Connect integration for creator monetization
// CRITICAL: 90/10 split is enforced here — never accept fee amounts from clients

import Stripe from 'stripe';
import { logger } from './logger.js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
  typescript: true,
});

// ─── FEE COMPUTATION (IMMUTABLE — DO NOT MODIFY) ────────────────────────────
// Platform always takes exactly 10%. Creator always receives exactly 90%.
// This is enforced at the service layer, DB layer, and audit ledger.
export const PLATFORM_FEE_PERCENT = 0.10;
export const CREATOR_PERCENT = 0.90;

export interface FeeBreakdown {
  grossAmount: number;   // in cents
  platformFee: number;   // grossAmount * 0.10, in cents
  creatorAmount: number; // grossAmount * 0.90, in cents
}

/**
 * Computes the immutable 90/10 fee split.
 * Only this function should be used to determine fee amounts.
 */
export function computeFees(grossAmountCents: number): FeeBreakdown {
  if (grossAmountCents <= 0) throw new Error('Amount must be positive');
  const platformFee   = Math.round(grossAmountCents * PLATFORM_FEE_PERCENT);
  const creatorAmount = grossAmountCents - platformFee; // avoids rounding drift
  return { grossAmount: grossAmountCents, platformFee, creatorAmount };
}

// ─── STRIPE CONNECT HELPERS ──────────────────────────────────────────────────

/**
 * Creates a Stripe Connect account for a creator.
 */
export async function createConnectAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers:     { requested: true },
    },
  });
  return account.id;
}

/**
 * Generates an onboarding link for Stripe Connect.
 */
export async function createOnboardingLink(accountId: string, returnUrl: string): Promise<string> {
  const link = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: returnUrl,
    return_url:  returnUrl,
    type:        'account_onboarding',
  });
  return link.url;
}

/**
 * Creates a Payment Intent with automatic application fee (90/10 split).
 */
export async function createPaymentIntent(
  grossAmountCents: number,
  currency: string,
  connectedAccountId: string,
  idempotencyKey: string,
  metadata: Record<string, string> = {},
): Promise<Stripe.PaymentIntent> {
  const fees = computeFees(grossAmountCents);

  return stripe.paymentIntents.create(
    {
      amount: fees.grossAmount,
      currency,
      application_fee_amount: fees.platformFee, // 10% to platform
      transfer_data: { destination: connectedAccountId },
      metadata,
    },
    { idempotencyKey },
  );
}

/**
 * Retrieves a connected account's status.
 */
export async function getConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled:  account.charges_enabled,
    payoutsEnabled:  account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}

/**
 * Constructs and verifies a Stripe webhook event.
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Creates a Stripe Customer for recurring billing.
 */
export async function createCustomer(email: string, name?: string): Promise<string> {
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}

/**
 * Creates a subscription for a creator's tier.
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  connectedAccountId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer:            customerId,
    items:               [{ price: priceId }],
    application_fee_percent: 10, // 10% platform fee
    transfer_data:       { destination: connectedAccountId },
    payment_behavior:    'default_incomplete',
    payment_settings:    { save_default_payment_method: 'on_subscription' },
    expand:              ['latest_invoice.payment_intent'],
  });
}

/**
 * Cancels a subscription at period end.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  logger.info({ subscriptionId }, 'Subscription set to cancel at period end');
}
