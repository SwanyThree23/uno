// src/sockets/chatHandler.ts
// Real-time chat + superchats for live stages

import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

interface ChatEvent {
  message: string;
  type?: 'CHAT' | 'SUPERCHAT';
  amount?: number;
  platform?: string;
}

const CHAT_RATE_LIMIT = 5; // messages per 5 seconds per user
const SUPERCHAT_MIN_AMOUNT = 1.00;

export function registerChatHandler(io: Server, socket: Socket): void {
  const { stageId, userId } = socket.data as { stageId: string; userId: string | null };

  // Join stage chat room
  socket.join(`stage:${stageId}:chat`);

  socket.on('chat:send', async (event: ChatEvent) => {
    try {
      if (!userId) {
        socket.emit('error', { code: 'AUTH_REQUIRED', message: 'Must be logged in to chat' });
        return;
      }

      // Rate limiting via Redis
      const rlKey = `chat:rate:${userId}:${stageId}`;
      const count  = await redis.incr(rlKey);
      if (count === 1) await redis.expire(rlKey, 5);
      if (count > CHAT_RATE_LIMIT) {
        socket.emit('error', { code: 'RATE_LIMITED', message: 'Sending messages too fast' });
        return;
      }

      const message = String(event.message || '').trim().slice(0, 500);
      if (!message) return;

      const type = event.type === 'SUPERCHAT' ? 'SUPERCHAT' : 'CHAT';

      // Store in DB
      const chatMsg = await prisma.chatMessage.create({
        data: {
          stageId,
          userId,
          message,
          type,
          amount: type === 'SUPERCHAT' ? event.amount : undefined,
          platform: 'SEEWHY',
        },
        include: {
          user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        },
      });

      // Broadcast to room
      io.to(`stage:${stageId}:chat`).emit('chat:message', {
        id:        chatMsg.id,
        message:   chatMsg.message,
        type:      chatMsg.type,
        amount:    chatMsg.amount,
        platform:  chatMsg.platform,
        createdAt: chatMsg.createdAt,
        user:      chatMsg.user,
      });

      if (type === 'SUPERCHAT') {
        logger.info({ userId, stageId, amount: event.amount }, 'Superchat sent');
      }
    } catch (err) {
      logger.error({ err }, 'chat:send error');
    }
  });

  // Get recent chat history on join
  socket.on('chat:history', async () => {
    try {
      const messages = await prisma.chatMessage.findMany({
        where:   { stageId },
        take: 50,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, displayName: true, username: true, avatarUrl: true } } },
      });
      socket.emit('chat:history', messages);
    } catch (err) {
      logger.error({ err }, 'chat:history error');
    }
  });
}
