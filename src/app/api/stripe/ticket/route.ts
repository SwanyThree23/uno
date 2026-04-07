import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { fireWebhooks } from "@/lib/webhook";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { host: true },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.ticketPrice === 0) {
      return NextResponse.json({ error: "This room is free to join" }, { status: 422 });
    }
    if (!room.host.stripeAccountId) {
      return NextResponse.json(
        { error: "Creator has not connected Stripe" },
        { status: 422 }
      );
    }

    const platformFee = Math.round(room.ticketPrice * (PLATFORM_FEE_PERCENT / 100));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: room.ticketPrice,
            product_data: { name: `Ticket: ${room.title}` },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: { destination: room.host.stripeAccountId },
        metadata: {
          type: "ticket",
          roomId,
          buyerId: payload.userId,
        },
      },
      success_url: `${appUrl}/room/${roomId}?ticket=success`,
      cancel_url: `${appUrl}/room/${roomId}`,
    });

    fireWebhooks(room.hostId, "ticket.purchased", {
      userId: room.hostId,
      roomId,
      data: { buyerId: payload.userId, amount: room.ticketPrice },
    }).catch(() => {});

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/ticket]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
