import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/auditLogger';
import { uploadFile, generateStorageKey, deleteFile } from '../../utils/s3';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { DocumentType } from '@prisma/client';
import { UpdateProfileDto, AddMedicalHistoryDto } from './patient.schema';
import { Request } from 'express';
import axios from 'axios';
import { env } from '../../config/env';

export class PatientService {
  private async getPatient(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
    return patient;
  }

  async getProfile(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true, avatarUrl: true, lastLoginAt: true } },
      },
    });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
    return patient;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, req: Request) {
    const patient = await this.getPatient(userId);
    const updated = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
    await createAuditLog({ userId, action: 'USER_UPDATED', entity: 'Patient', entityId: patient.id, newValue: dto, req });
    return updated;
  }

  async getMedicalHistory(userId: string, query: { page?: string; limit?: string }) {
    const patient = await this.getPatient(userId);
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.medicalHistory.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicalHistory.count({ where: { patientId: patient.id } }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async addMedicalHistory(userId: string, dto: AddMedicalHistoryDto, req: Request) {
    const patient = await this.getPatient(userId);
    const record = await prisma.medicalHistory.create({
      data: {
        patientId: patient.id,
        ...dto,
        diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : undefined,
        resolvedAt: dto.resolvedAt ? new Date(dto.resolvedAt) : undefined,
      },
    });
    await createAuditLog({ userId, action: 'USER_UPDATED', entity: 'MedicalHistory', entityId: record.id, newValue: dto, req });
    return record;
  }

  async deleteMedicalHistory(userId: string, historyId: string, req: Request) {
    const patient = await this.getPatient(userId);
    const record = await prisma.medicalHistory.findFirst({ where: { id: historyId, patientId: patient.id } });
    if (!record) throw new AppError('Medical history record not found', 404, 'NOT_FOUND');
    await prisma.medicalHistory.delete({ where: { id: historyId } });
    return { message: 'Medical history record deleted' };
  }

  async getDocuments(userId: string, query: { page?: string; limit?: string; documentType?: DocumentType }) {
    const patient = await this.getPatient(userId);
    const { page, limit, skip } = getPaginationParams(query);
    const where = {
      patientId: patient.id,
      ...(query.documentType ? { documentType: query.documentType } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.document.findMany({ where, orderBy: { uploadedAt: 'desc' }, skip, take: limit }),
      prisma.document.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    documentType: DocumentType,
    req: Request
  ) {
    const patient = await this.getPatient(userId);
    const storageKey = generateStorageKey(patient.id, file.originalname, 'documents');
    const storageUrl = await uploadFile(file.buffer, storageKey, file.mimetype);

    const document = await prisma.document.create({
      data: {
        patientId: patient.id,
        fileName: storageKey.split('/').pop()!,
        originalName: file.originalname,
        mimeType: file.mimetype,
        storageKey,
        storageUrl,
        fileSizeBytes: BigInt(file.size),
        documentType,
      },
    });

    await createAuditLog({ userId, action: 'DOCUMENT_UPLOADED', entity: 'Document', entityId: document.id, req });

    // Async: trigger Python service processing
    this.triggerDocumentProcessing(document.id, storageKey, file.mimetype).catch(() => {});

    return document;
  }

  private async triggerDocumentProcessing(documentId: string, storageKey: string, mimeType: string): Promise<void> {
    try {
      const endpoint = mimeType === 'application/pdf' ? '/process-pdf' : '/ocr';
      await axios.post(
        `${env.PYTHON_SERVICE_URL}${endpoint}`,
        { documentId, storageKey },
        { headers: { Authorization: `Bearer ${env.PYTHON_SERVICE_TOKEN}` }, timeout: 30000 }
      );
    } catch {
      // Non-critical: document is saved, processing is best-effort
    }
  }

  async deleteDocument(userId: string, documentId: string, req: Request) {
    const patient = await this.getPatient(userId);
    const document = await prisma.document.findFirst({ where: { id: documentId, patientId: patient.id } });
    if (!document) throw new AppError('Document not found', 404, 'NOT_FOUND');
    await deleteFile(document.storageKey);
    await prisma.document.delete({ where: { id: documentId } });
    await createAuditLog({ userId, action: 'DOCUMENT_DELETED', entity: 'Document', entityId: documentId, req });
    return { message: 'Document deleted successfully' };
  }

  async getConsultations(userId: string, query: { page?: string; limit?: string }) {
    const patient = await this.getPatient(userId);
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.consultation.findMany({
        where: { patientId: patient.id },
        include: { report: { select: { id: true, riskLevel: true, confidenceScore: true, generatedAt: true } } },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.consultation.count({ where: { patientId: patient.id } }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getReport(userId: string, reportId: string) {
    const patient = await this.getPatient(userId);
    const report = await prisma.report.findFirst({
      where: { id: reportId, patientId: patient.id },
      include: { consultation: { select: { chiefComplaint: true, startedAt: true, completedAt: true } } },
    });
    if (!report) throw new AppError('Report not found', 404, 'NOT_FOUND');
    return report;
  }

  async getPrescriptions(userId: string, query: { page?: string; limit?: string }) {
    const patient = await this.getPatient(userId);
    const { page, limit, skip } = getPaginationParams(query);
    const [items, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatarUrl: true, email: true },
              },
            },
          },
          appointment: {
            select: { appointmentDate: true, slotStart: true, slotEnd: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.prescription.count({ where: { patientId: patient.id } }),
    ]);
    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async getNotifications(userId: string, query: { page?: string; limit?: string; unreadOnly?: string }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = { userId };
    if (query.unreadOnly === 'true') {
      where.isRead = false;
    }
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, unreadCount, meta: buildPaginationMeta(total, page, limit) };
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const patientService = new PatientService();
