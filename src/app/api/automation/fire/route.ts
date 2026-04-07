import { NextRequest, NextResponse } from "next/server";

/**
 * Internal bridge: WebSocket server → automation webhook system.
 * Protected by X-Internal-Secret header.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== (process.env.INTERNAL_SECRET ?? "ws-internal")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, roomId, userId, data } = body as {
    event: string;
    roomId?: string;
    userId?: string;
    data?: Record<string, unknown>;
  };

  if (!event) {
    return NextResponse.json({ error: "event is required" }, { status: 400 });
  }

  // Map socket event names to webhook trigger names
  const triggerMap: Record<string, string> = {
    "stream:start": "stream.started",
    "stream:end": "stream.ended",
    "viewer:join": "viewer.joined",
    "viewer:leave": "viewer.left",
    "chat:message": "chat.message",
    "tip:received": "tip.received",
    "ticket:purchased": "ticket.purchased",
  };

  const trigger = triggerMap[event];
  if (trigger && userId) {
    const { fireWebhooks } = await import("@/lib/webhook");
    await fireWebhooks(userId as string, trigger as Parameters<typeof fireWebhooks>[1], {
      userId: userId as string,
      roomId: roomId as string | undefined,
      data: (data ?? {}) as Record<string, unknown>,
    });
  }

  return NextResponse.json({ accepted: true, event });
}
