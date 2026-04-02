// src/sockets/streamHandler.ts
// Real-time stream health metrics broadcast — bitrate, FPS, latency

import { Server, Socket } from 'socket.io';
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

interface StreamMetrics {
  bitrate:    number; // kbps
  fps:        number;
  latency:    number; // ms
  dropped:    number; // dropped frames
  resolution: string; // e.g. "1920x1080"
}

export function registerStreamHandler(io: Server, socket: Socket): void {
  const { stageId, userId } = socket.data as { stageId: string; userId: string | null };

  socket.join(`stage:${stageId}:stream`);

  // Creator broadcasts stream health metrics
  socket.on('stream:metrics', async (metrics: StreamMetrics) => {
    if (!userId) return; // must be authenticated

    // Cache latest metrics in Redis (30s TTL)
    const metricsKey = `stream:metrics:${stageId}`;
    await redis.setex(metricsKey, 30, JSON.stringify({ ...metrics, updatedAt: Date.now() }));

    // Broadcast to all viewers in the stage
    io.to(`stage:${stageId}:stream`).emit('stream:metrics', {
      ...metrics,
      updatedAt: Date.now(),
    });
  });

  // Viewers can request latest cached metrics
  socket.on('stream:getMetrics', async () => {
    const metricsKey = `stream:metrics:${stageId}`;
    const cached = await redis.get(metricsKey);
    if (cached) {
      socket.emit('stream:metrics', JSON.parse(cached));
    }
  });

  // Stream quality change notification (adaptive bitrate)
  socket.on('stream:qualityChange', (data: { quality: string; reason: string }) => {
    io.to(`stage:${stageId}:stream`).emit('stream:qualityChange', data);
    logger.info({ stageId, ...data }, 'Stream quality changed');
  });

  // Recording state
  socket.on('stream:recording', (data: { isRecording: boolean }) => {
    if (!userId) return;
    io.to(`stage:${stageId}:stream`).emit('stream:recording', data);
  });

  // Guest audio/video state changes (mute, camera off)
  socket.on('stream:guestState', (data: { userId: string; muted: boolean; cameraOff: boolean }) => {
    socket.to(`stage:${stageId}:stream`).emit('stream:guestState', data);
  });

  socket.on('disconnect', () => {
    logger.debug({ stageId, userId }, 'Stream socket disconnected');
  });
}
