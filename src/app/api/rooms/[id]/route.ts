import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAuth(req);
    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: { host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    return NextResponse.json({ room });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const room = await prisma.room.findUnique({ where: { id: params.id } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.hostId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, ticketPrice } = await req.json();
    const updated = await prisma.room.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(ticketPrice !== undefined && { ticketPrice }),
      },
      include: { host: { select: { id: true, displayName: true, avatarUrl: true } } },
    });
    return NextResponse.json({ room: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = requireAuth(req);
    const room = await prisma.room.findUnique({ where: { id: params.id } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.hostId !== payload.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.room.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
