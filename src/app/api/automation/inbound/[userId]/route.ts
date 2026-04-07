import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikey";
import { prisma } from "@/lib/prisma";
import { fireWebhooks } from "@/lib/webhook";

type InboundAction =
  | { action: "stream.start"; roomId: string }
  | { action: "stream.end"; roomId: string }
  | { action: "room.update"; roomId: string; updates: Record<string, unknown> }
  | { action: "send.chat"; roomId: string; content: string }
  | { action: "ping" };

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  let body: InboundAction;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ping does not require API key auth
  if (body.action === "ping") {
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  }

  // All other actions require a valid API key
  const apiKeyHeader = req.headers.get("x-api-key") ?? "";
  const validUserId = await validateApiKey(apiKeyHeader);
  if (!validUserId || validUserId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    switch (body.action) {
      case "stream.start": {
        const room = await prisma.room.findFirst({
          where: { id: body.roomId, hostId: userId },
        });
        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        await prisma.room.update({ where: { id: body.roomId }, data: { isLive: true } });

        fireWebhooks(userId, "stream.started", {
          userId,
          roomId: body.roomId,
          data: { title: room.title },
        }).catch(() => {});

        return NextResponse.json({ success: true, action: "stream.start", roomId: body.roomId });
      }

      case "stream.end": {
        const room = await prisma.room.findFirst({
          where: { id: body.roomId, hostId: userId },
        });
        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        await prisma.room.update({ where: { id: body.roomId }, data: { isLive: false } });

        fireWebhooks(userId, "stream.ended", {
          userId,
          roomId: body.roomId,
          data: { title: room.title },
        }).catch(() => {});

        return NextResponse.json({ success: true, action: "stream.end", roomId: body.roomId });
      }

      case "room.update": {
        const room = await prisma.room.findFirst({
          where: { id: body.roomId, hostId: userId },
        });
        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        const allowedFields = ["title", "description", "ticketPrice"];
        const updates: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (body.updates[key] !== undefined) updates[key] = body.updates[key];
        }

        const updated = await prisma.room.update({
          where: { id: body.roomId },
          data: updates as Parameters<typeof prisma.room.update>[0]["data"],
        });
        return NextResponse.json({ success: true, room: updated });
      }

      case "send.chat": {
        const room = await prisma.room.findFirst({
          where: { id: body.roomId, hostId: userId },
        });
        if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

        // Broadcast via internal bridge
        const internalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/automation/fire`;
        fetch(internalUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": process.env.INTERNAL_SECRET ?? "ws-internal",
          },
          body: JSON.stringify({
            event: "chat:message",
            roomId: body.roomId,
            data: { content: body.content, type: "automated", userId },
          }),
        }).catch(() => {});

        return NextResponse.json({ success: true, action: "send.chat" });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[inbound]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
