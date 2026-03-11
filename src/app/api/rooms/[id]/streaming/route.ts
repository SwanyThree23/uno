import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fireWebhooks } from "@/lib/webhook";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const room = await prisma.room.findUnique({ where: { id: params.id } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.hostId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden — host only" }, { status: 403 });
    }

    const { isLive } = await req.json();
    if (typeof isLive !== "boolean") {
      return NextResponse.json({ error: "isLive (boolean) is required" }, { status: 400 });
    }

    const updated = await prisma.room.update({
      where: { id: params.id },
      data: { isLive },
    });

    const trigger = isLive ? "stream.started" : "stream.ended";
    fireWebhooks(payload.userId, trigger, {
      userId: payload.userId,
      roomId: params.id,
      data: { title: room.title },
    }).catch(() => {});

    return NextResponse.json({ room: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
