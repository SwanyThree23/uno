import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.stripeAccountId) {
      return NextResponse.json({ connected: false, accountId: null });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    return NextResponse.json({
      connected: account.charges_enabled && account.payouts_enabled,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let accountId = user.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { userId: user.id },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/creator/connect?refresh=true`,
      return_url: `${appUrl}/creator/connect?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error("[stripe/connect]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
