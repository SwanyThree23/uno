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
    // --- WebRTC Signaling (Multi-Panel Video Rooms) ---
    socket.on('webrtc:join', (data) => {
        socket.join(`stage:${stageId}:webrtc`);
        // Notify others that a new peer joined
        socket.to(`stage:${stageId}:webrtc`).emit('webrtc:peerJoined', { peerId: data.peerId, socketId: socket.id, role: data.role });
    });
    socket.on('webrtc:offer', (data) => {
        // Send the offer to the specific peer
        io.to(data.to).emit('webrtc:offer', { from: socket.id, peerId: data.peerId, offer: data.offer });
    });
    socket.on('webrtc:answer', (data) => {
        // Send the answer to the specific peer
        io.to(data.to).emit('webrtc:answer', { from: socket.id, peerId: data.peerId, answer: data.answer });
    });
    socket.on('webrtc:ice-candidate', (data) => {
        // Exchange ICE candidates for NAT traversal
        io.to(data.to).emit('webrtc:ice-candidate', { from: socket.id, peerId: data.peerId, candidate: data.candidate });
    });
    socket.on('webrtc:leave', (data) => {
        socket.to(`stage:${stageId}:webrtc`).emit('webrtc:peerLeft', { peerId: data.peerId, socketId: socket.id });
        socket.leave(`stage:${stageId}:webrtc`);
    });
    socket.on('disconnect', () => {
        socket.to(`stage:${stageId}:webrtc`).emit('webrtc:peerLeft', { socketId: socket.id });
        logger.debug({ stageId, userId, socketId: socket.id }, 'Stream socket disconnected');
    });
}
