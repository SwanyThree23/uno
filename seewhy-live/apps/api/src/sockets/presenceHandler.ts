// src/sockets/presenceHandler.ts
// Real-time viewer presence — join/leave tracking with Redis Sets

import { Server, Socket } from 'socket.io';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

const PRESENCE_TTL = 300; // 5 minutes — refreshed on heartbeat

export function registerPresenceHandler(io: Server, socket: Socket): void {
  const { stageId, userId } = socket.data as { stageId: string; userId: string | null };
  const viewerId = userId || socket.id;
  const presenceKey = `presence:${stageId}:viewers`;

  // User joined — add to Redis set
  redis.sadd(presenceKey, viewerId).then(() => {
    redis.expire(presenceKey, PRESENCE_TTL);
    // Broadcast updated count
    redis.scard(presenceKey).then((count: number) => {
      io.to(`stage:${stageId}:presence`).emit('presence:count', { count });
    });
  });

  socket.join(`stage:${stageId}:presence`);

  // Heartbeat to keep presence alive
  socket.on('presence:heartbeat', async () => {
    await redis.sadd(presenceKey, viewerId);
    await redis.expire(presenceKey, PRESENCE_TTL);
  });

  // Get current count
  socket.on('presence:count', async () => {
    const count = await redis.scard(presenceKey);
    socket.emit('presence:count', { count });
  });

  // Cleanup on disconnect
  socket.on('disconnect', async () => {
    await redis.srem(presenceKey, viewerId);
    const count = await redis.scard(presenceKey);
    io.to(`stage:${stageId}:presence`).emit('presence:count', { count });
    logger.debug({ stageId, viewerId, remaining: count }, 'Viewer left');
  });
}
