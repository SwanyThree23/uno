import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    return NextResponse.json({
      streamKey: room.streamKey,
      rtmpUrl: room.rtmpUrl,
      ingestUrl: `${room.rtmpUrl}/${room.streamKey}`,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

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

    const { rtmpUrl } = await req.json();
    const updated = await prisma.room.update({
      where: { id: params.id },
      data: { ...(rtmpUrl && { rtmpUrl }) },
    });

    return NextResponse.json({
      streamKey: updated.streamKey,
      rtmpUrl: updated.rtmpUrl,
      ingestUrl: `${updated.rtmpUrl}/${updated.streamKey}`,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
