// src/sockets/streamHandler.ts
// Real-time stream health metrics broadcast — bitrate, FPS, latency
import { redis } from '../lib/redis.js';
import { logger } from '../lib/logger.js';
export function registerStreamHandler(io, socket) {
    const { stageId, userId } = socket.data;
    socket.join(`stage:${stageId}:stream`);
    // Creator broadcasts stream health metrics
    socket.on('stream:metrics', async (metrics) => {
        if (!userId)
            return; // must be authenticated
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
    socket.on('stream:qualityChange', (data) => {
        io.to(`stage:${stageId}:stream`).emit('stream:qualityChange', data);
        logger.info({ stageId, ...data }, 'Stream quality changed');
    });
    // Recording state
    socket.on('stream:recording', (data) => {
        if (!userId)
            return;
        io.to(`stage:${stageId}:stream`).emit('stream:recording', data);
    });
    // Guest audio/video state changes (mute, camera off)
    socket.on('stream:guestState', (data) => {
        socket.to(`stage:${stageId}:stream`).emit('stream:guestState', data);
    });
    socket.on('disconnect', () => {
        logger.debug({ stageId, userId }, 'Stream socket disconnected');
    });
}
