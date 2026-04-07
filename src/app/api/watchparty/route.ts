import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fireWebhooks } from "@/lib/webhook";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const parties = await prisma.watchParty.findMany({
      where: { hostId: payload.userId },
      include: {
        room: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ watchParties: parties });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const { roomId, title, videoUrl } = await req.json();

    if (!roomId || !title || !videoUrl) {
      return NextResponse.json(
        { error: "roomId, title, and videoUrl are required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, hostId: payload.userId },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found or access denied" }, { status: 404 });
    }

    const party = await prisma.watchParty.create({
      data: { hostId: payload.userId, roomId, title, videoUrl },
      include: { room: { select: { id: true, title: true } } },
    });

    fireWebhooks(payload.userId, "watchparty.started", {
      userId: payload.userId,
      roomId,
      data: { watchPartyId: party.id, title: party.title, videoUrl: party.videoUrl },
    }).catch(() => {});

    return NextResponse.json({ watchParty: party }, { status: 201 });
  } catch (err) {
    console.error("[watchparty POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
