import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSigningSecret } from "@/lib/webhook";

const VALID_TRIGGERS = [
  "stream.started",
  "stream.ended",
  "viewer.joined",
  "viewer.left",
  "chat.message",
  "tip.received",
  "ticket.purchased",
  "subscriber.new",
  "room.created",
  "watchparty.started",
];

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const webhooks = await prisma.outboundWebhook.findMany({
      where: { userId: payload.userId },
      select: {
        id: true,
        name: true,
        targetUrl: true,
        triggers: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ webhooks });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { name, targetUrl, triggers } = await req.json();

    if (!name || !targetUrl || !Array.isArray(triggers) || triggers.length === 0) {
      return NextResponse.json(
        { error: "name, targetUrl, and triggers[] are required" },
        { status: 400 }
      );
    }

    const invalid = triggers.filter((t: string) => !VALID_TRIGGERS.includes(t));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid triggers: ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    const signingSecret = generateSigningSecret();

    const webhook = await prisma.outboundWebhook.create({
      data: {
        userId: payload.userId,
        name,
        targetUrl,
        signingSecret,
        triggers: triggers.join(","),
      },
    });

    return NextResponse.json(
      {
        webhook: {
          id: webhook.id,
          name: webhook.name,
          targetUrl: webhook.targetUrl,
          triggers: webhook.triggers.split(","),
          active: webhook.active,
          createdAt: webhook.createdAt,
        },
        signingSecret,
        note: "Save the signingSecret immediately — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
