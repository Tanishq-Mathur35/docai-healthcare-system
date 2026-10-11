import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './utils/jwt';
import { chatService } from './modules/chat/chat.service';
import { logger } from './config/logger';
import { env } from './config/env';
import { ChatSenderRole } from '@prisma/client';

let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function sendUserNotification(userId: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification', data);
    ioInstance.to(`user:${userId}`).emit('prescription_issued', data);
  }
}

export function setupSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  ioInstance = io;

  // JWT Handshake Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch (err: any) {
      logger.warn(`Socket.IO authentication failed: ${err.message}`);
      next(new Error('Invalid socket credentials'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`🔌 Socket connected: ${user.id} (${user.firstName} ${user.lastName}) - Socket ID: ${socket.id}`);

    // Join personal notification channel
    socket.join(`user:${user.id}`);

    // Join a consultation/appointment chat room
    socket.on('join_room', (data: any) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (roomId) {
        socket.join(`room:${roomId}`);
        logger.info(`User ${user.id} joined room:${roomId}`);
        socket.to(`room:${roomId}`).emit('user_joined', { userId: user.id, name: user.firstName });
      }
    });

    // Leave a chat room
    socket.on('leave_room', (data: any) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (roomId) {
        socket.leave(`room:${roomId}`);
        logger.info(`User ${user.id} left room:${roomId}`);
        socket.to(`room:${roomId}`).emit('user_left', { userId: user.id });
      }
    });

    // Real-time message exchange
    socket.on('send_message', async (data: { roomId: string; content: string; attachmentUrl?: string }) => {
      try {
        const { roomId, content, attachmentUrl } = data;
        const senderRole = user.role as ChatSenderRole;

        // Persist message in database
        const message = await chatService.createMessage(roomId, user.id, senderRole, content, attachmentUrl);

        // Broadcast to all participants in this room (including sender)
        io.to(`room:${roomId}`).emit('new_message', {
          ...message,
          senderName: `${user.firstName} ${user.lastName}`,
        });
      } catch (err: any) {
        socket.emit('message_error', { error: err.message });
      }
    });

    // Typing indicators
    socket.on('typing', (data: any) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      const isTyping = typeof data === 'object' && typeof data?.isTyping === 'boolean' ? data.isTyping : true;
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user_typing', { userId: user.id, name: user.firstName, isTyping });
      }
    });

    socket.on('typing_start', (data: any) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user_typing', { userId: user.id, name: user.firstName, isTyping: true });
      }
    });

    socket.on('typing_stop', (data: any) => {
      const roomId = typeof data === 'string' ? data : data?.roomId;
      if (roomId) {
        socket.to(`room:${roomId}`).emit('user_typing', { userId: user.id, name: user.firstName, isTyping: false });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${user.id}`);
    });
  });

  return io;
}
