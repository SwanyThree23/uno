import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 422 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
