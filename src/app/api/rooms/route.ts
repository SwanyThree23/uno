import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fireWebhooks } from "@/lib/webhook";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const rooms = await prisma.room.findMany({
      where: { hostId: payload.userId },
      orderBy: { createdAt: "desc" },
      include: { host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    return NextResponse.json({ rooms });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { title, description, ticketPrice } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const room = await prisma.room.create({
      data: {
        hostId: payload.userId,
        title,
        description,
        ticketPrice: ticketPrice ?? 0,
      },
      include: { host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });

    // Fire outbound webhook
    fireWebhooks(payload.userId, "room.created", {
      userId: payload.userId,
      roomId: room.id,
      data: { title: room.title },
    }).catch(() => {});

    return NextResponse.json({ room }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
