import { Request, Response, NextFunction } from 'express';
import { chatService } from './chat.service';
import { successResponse, errorResponse } from '../../types/common';
import { ChatSenderRole } from '@prisma/client';
import { getIO } from '../../socket';

export class ChatController {
  async getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await chatService.getRoomsForUser(req.user!.id, req.user!.role);
      res.json(successResponse('Chat rooms', data));
    } catch (err) {
      next(err);
    }
  }

  async createOrGetRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetId = req.body.targetId || req.body.doctorId || req.body.patientId;
      if (!targetId) {
        res.status(400).json(errorResponse('targetId (doctorId or patientId) is required'));
        return;
      }
      const room = await chatService.getOrCreateRoom(req.user!.id, req.user!.role, targetId);
      res.status(201).json(successResponse('Chat room retrieved or created', room));
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await chatService.getMessages(req.params.roomId, req.user!.id);
      res.json(successResponse('Room messages', data));
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content, attachmentUrl } = req.body;
      if (!content || typeof content !== 'string') {
        res.status(400).json({ success: false, message: 'Message content is required' });
        return;
      }
      const senderRole = req.user!.role as ChatSenderRole;
      const data = await chatService.createMessage(req.params.roomId, req.user!.id, senderRole, content, attachmentUrl);

      // Real-time broadcast to room participants via Socket.IO
      const io = getIO();
      if (io) {
        io.to(`room:${req.params.roomId}`).emit('new_message', {
          ...data,
          senderName: `${req.user!.firstName} ${req.user!.lastName}`,
        });
      }

      res.status(201).json(successResponse('Message sent', data));
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
