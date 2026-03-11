import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  const rawBody = await req.arrayBuffer();

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig!,
      webhookSecret
    );
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.processedEvent.findUnique({ where: { id: event.id } });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  await prisma.processedEvent.create({ data: { id: event.id } });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan && session.mode === "subscription") {
          const tier = plan.startsWith("enterprise") ? "enterprise" : "pro";
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "active", subscriptionTier: tier },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if ("metadata" in customer && customer.metadata.userId) {
          const status = sub.status === "active" ? "active" : "inactive";
          await prisma.user.update({
            where: { id: customer.metadata.userId },
            data: { subscriptionStatus: status },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if ("metadata" in customer && customer.metadata.userId) {
          await prisma.user.update({
            where: { id: customer.metadata.userId },
            data: { subscriptionStatus: "cancelled", subscriptionTier: "free" },
          });
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await prisma.user.updateMany({
          where: { stripeAccountId: account.id },
          data: {},
        });
        break;
      }

      case "invoice.payment_failed":
      case "capability.updated":
      case "payment_intent.succeeded":
      case "application_fee.created":
      case "charge.refunded":
      case "charge.dispute.created":
      case "payout.failed":
      case "payout.paid":
        // Logged but no DB action needed for these
        console.log(`[stripe/webhook] handled event: ${event.type}`);
        break;

      default:
        console.log(`[stripe/webhook] unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
