import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ChatSenderRole } from '@prisma/client';

export class ChatService {
  async getRoomsForUser(userId: string, role: string) {
    if (role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (!patient) return [];
      return prisma.chatRoom.findMany({
        where: { patientId: patient.id, isActive: true },
        include: {
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) return [];
      return prisma.chatRoom.findMany({
        where: { doctorId: doctor.id, isActive: true },
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }
    return [];
  }

  async getOrCreateRoom(userId: string, role: string, targetId: string) {
    let patientId: string;
    let doctorId: string;

    if (role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
      doctorId = doctor.id;
      const patient = await prisma.patient.findFirst({
        where: { OR: [{ id: targetId }, { userId: targetId }] },
      });
      if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
      patientId = patient.id;
    } else if (role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
      patientId = patient.id;
      const doctor = await prisma.doctor.findFirst({
        where: { OR: [{ id: targetId }, { userId: targetId }] },
      });
      if (!doctor) throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
      doctorId = doctor.id;
    } else {
      throw new AppError('Only doctors and patients can open chat rooms', 403, 'FORBIDDEN');
    }

    let room = await prisma.chatRoom.findFirst({
      where: { patientId, doctorId, isActive: true },
      include: {
        doctor: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        patient: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: {
          type: 'DOCTOR_PATIENT',
          patientId,
          doctorId,
        },
        include: {
          doctor: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          patient: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        },
      });
    }

    return room;
  }

  async getMessages(roomId: string, userId: string) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { patient: true, doctor: true },
    });
    if (!room) throw new AppError('Chat room not found', 404, 'NOT_FOUND');

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark unread messages as read
    await prisma.chatMessage.updateMany({
      where: { roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    return messages;
  }

  async createMessage(roomId: string, senderId: string, senderRole: ChatSenderRole, content: string, attachmentUrl?: string) {
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        senderRole,
        content,
        attachmentUrl,
      },
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}

export const chatService = new ChatService();
