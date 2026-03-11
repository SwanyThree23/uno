import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? "ws-internal";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Fires a socket event to the internal automation bridge.
 */
async function fireToAutomation(
  event: string,
  roomId: string | undefined,
  userId: string | undefined,
  data: Record<string, unknown>
) {
  try {
    await fetch(`${APP_URL}/api/automation/fire`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ event, roomId, userId, data }),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // Non-critical — don't let automation failures break the socket server
  }
}

export function createSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: APP_URL, methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  // Room viewer count tracker: roomId → Set of socket IDs
  const roomViewers = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    const userId = (socket.handshake.auth.token as string) ?? socket.id;

    // ── room:join ────────────────────────────────────────────────────────────
    socket.on("room:join", ({ roomId, isHost }: { roomId: string; isHost?: boolean }) => {
      socket.join(roomId);

      if (!roomViewers.has(roomId)) roomViewers.set(roomId, new Set());
      roomViewers.get(roomId)!.add(socket.id);

      const count = roomViewers.get(roomId)!.size;
      io.to(roomId).emit("viewer:count", { count });

      if (!isHost) {
        fireToAutomation("viewer:join", roomId, userId, { count }).catch(() => {});
      }
    });

    // ── room:leave ───────────────────────────────────────────────────────────
    socket.on("room:leave", ({ roomId }: { roomId: string }) => {
      socket.leave(roomId);
      roomViewers.get(roomId)?.delete(socket.id);

      const count = roomViewers.get(roomId)?.size ?? 0;
      io.to(roomId).emit("viewer:count", { count });

      fireToAutomation("viewer:leave", roomId, userId, { count }).catch(() => {});
    });

    // ── stream:start ─────────────────────────────────────────────────────────
    socket.on("stream:start", ({ roomId, title }: { roomId: string; title?: string }) => {
      io.to(roomId).emit("stream:started", { roomId, title });
      fireToAutomation("stream:start", roomId, userId, { title: title ?? "" }).catch(() => {});
    });

    // ── stream:end ───────────────────────────────────────────────────────────
    socket.on("stream:end", ({ roomId, title }: { roomId: string; title?: string }) => {
      io.to(roomId).emit("stream:ended", { roomId, title });
      fireToAutomation("stream:end", roomId, userId, { title: title ?? "" }).catch(() => {});
    });

    // ── chat:message ─────────────────────────────────────────────────────────
    socket.on(
      "chat:message",
      ({ roomId, content, type }: { roomId: string; content: string; type?: string }) => {
        const msg = { roomId, content, type: type ?? "text", userId, timestamp: Date.now() };
        io.to(roomId).emit("chat:message", msg);
        fireToAutomation("chat:message", roomId, userId, { content, type }).catch(() => {});
      }
    );

    // ── chat:typing ──────────────────────────────────────────────────────────
    socket.on("chat:typing", ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit("chat:typing", { userId });
    });

    // ── tip:received ─────────────────────────────────────────────────────────
    socket.on(
      "tip:received",
      ({
        roomId,
        amount,
        fromUser,
        message,
      }: {
        roomId: string;
        amount: number;
        fromUser: string;
        message?: string;
      }) => {
        io.to(roomId).emit("tip:received", { roomId, amount, fromUser, message });
        fireToAutomation("tip:received", roomId, userId, { amount, fromUser, message }).catch(
          () => {}
        );
      }
    );

    // ── watchparty:sync ──────────────────────────────────────────────────────
    socket.on(
      "watchparty:sync",
      ({
        watchPartyId,
        type,
        data,
      }: {
        watchPartyId: string;
        type: string;
        data: Record<string, unknown>;
      }) => {
        socket.to(watchPartyId).emit("watchparty:sync", { watchPartyId, type, data });
      }
    );

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const [roomId, viewers] of roomViewers.entries()) {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id);
          const count = viewers.size;
          io.to(roomId).emit("viewer:count", { count });
          fireToAutomation("viewer:leave", roomId, userId, { count }).catch(() => {});
        }
      }
    });
  });

  return io;
}
