import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/auditLogger';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { CreateDoctorNoteDto, CreatePrescriptionDto, UpdateDoctorProfileDto } from './doctor.schema';
import { Request } from 'express';
import { AppointmentStatus } from '@prisma/client';
import { sendUserNotification } from '../../socket';

export class DoctorService {
  private async getDoctor(userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!doctor) throw new AppError('Doctor profile not found', 404, 'NOT_FOUND');
    return doctor;
  }

  async getProfile(userId: string) {
    return this.getDoctor(userId);
  }

  async updateProfile(userId: string, dto: UpdateDoctorProfileDto, req: Request) {
    const doctor = await this.getDoctor(userId);
    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: dto as any,
    });
    await createAuditLog({
      userId,
      action: 'USER_UPDATED',
      entity: 'Doctor',
      entityId: doctor.id,
      newValue: dto,
      req,
    });
    return updated;
  }

  // Doctor portal: View only assigned patients (patients who booked appointments with this doctor)
  async getAssignedPatients(userId: string, query: { page?: string; limit?: string; search?: string }) {
    const doctor = await this.getDoctor(userId);
    const { page, limit, skip } = getPaginationParams(query);

    // Get unique patient IDs with appointments with this doctor
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      select: { patientId: true },
      distinct: ['patientId'],
    });

    const patientIds = appointments.map((a) => a.patientId);

    const where: any = {
      id: { in: patientIds },
    };

    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
          appointments: {
            where: { doctorId: doctor.id },
            orderBy: { appointmentDate: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    return { patients, meta: buildPaginationMeta(total, page, limit) };
  }

  // View patient detail if assigned to this doctor
  async getAssignedPatientDetail(userId: string, patientId: string) {
    const doctor = await this.getDoctor(userId);

    // Verify patient is assigned
    const hasAppointment = await prisma.appointment.findFirst({
      where: { doctorId: doctor.id, patientId },
    });
    if (!hasAppointment) {
      throw new AppError('You are not authorized to view this patient’s records', 403, 'FORBIDDEN');
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        medicalHistory: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        consultations: {
          include: { report: true },
          orderBy: { startedAt: 'desc' },
        },
        doctorNotes: {
          where: { doctorId: doctor.id },
          orderBy: { createdAt: 'desc' },
        },
        prescriptions: {
          where: { doctorId: doctor.id },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) throw new AppError('Patient not found', 404, 'NOT_FOUND');
    return patient;
  }

  // Doctor creates clinical note
  async addDoctorNote(userId: string, patientId: string, dto: CreateDoctorNoteDto, req: Request) {
    const doctor = await this.getDoctor(userId);

    const note = await prisma.doctorNote.create({
      data: {
        doctorId: doctor.id,
        patientId,
        appointmentId: dto.appointmentId,
        noteType: dto.noteType,
        content: dto.content,
        diagnosis: dto.diagnosis,
        icdCodes: dto.icdCodes,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
    });

    await createAuditLog({
      userId,
      action: 'NOTE_CREATED',
      entity: 'DoctorNote',
      entityId: note.id,
      req,
    });

    return note;
  }

  // Doctor creates prescription
  async addPrescription(userId: string, patientId: string, dto: CreatePrescriptionDto, req: Request) {
    const doctor = await this.getDoctor(userId);

    const prescription = await prisma.prescription.create({
      data: {
        doctorId: doctor.id,
        patientId,
        appointmentId: dto.appointmentId,
        medications: dto.medications as any,
        instructions: dto.instructions,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });

    await createAuditLog({
      userId,
      action: 'PRESCRIPTION_CREATED',
      entity: 'Prescription',
      entityId: prescription.id,
      req,
    });

    // Create persistent notification for patient and dispatch real-time alert
    try {
      const patientRecord = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });

      if (patientRecord) {
        const docName = `Dr. ${doctor.user?.firstName || 'Physician'} ${doctor.user?.lastName || ''}`.trim();
        const medList = Array.isArray(dto.medications)
          ? dto.medications.map((m: any) => m.name).filter(Boolean).join(', ')
          : 'Prescribed Medications';

        const notification = await prisma.notification.create({
          data: {
            userId: patientRecord.userId,
            type: 'SYSTEM',
            title: '💊 New Medicine Prescription Issued',
            body: `${docName} issued a prescription for: ${medList}.`,
            data: {
              prescriptionId: prescription.id,
              doctorId: doctor.id,
              doctorName: docName,
              medications: dto.medications,
              instructions: dto.instructions,
            },
          },
        });

        sendUserNotification(patientRecord.userId, {
          id: notification.id,
          type: 'PRESCRIPTION',
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
          prescription,
        });
      }
    } catch (notifErr) {
      // Non-blocking: prescription is safely persisted
    }

    return prescription;
  }

  // Doctor views their own appointments
  async getDoctorAppointments(userId: string, query: { status?: AppointmentStatus; page?: string; limit?: string }) {
    const doctor = await this.getDoctor(userId);
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = { doctorId: doctor.id };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true, phone: true } },
            },
          },
          doctorNote: true,
          prescription: true,
        },
        orderBy: [{ appointmentDate: 'desc' }, { slotStart: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  // Update appointment status (COMPLETED / CONFIRMED / CANCELLED)
  async updateAppointmentStatus(userId: string, appointmentId: string, status: AppointmentStatus, meetingLink?: string) {
    const doctor = await this.getDoctor(userId);

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId: doctor.id },
    });
    if (!appointment) throw new AppError('Appointment not found', 404, 'NOT_FOUND');

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        meetingLink: meetingLink || appointment.meetingLink,
      },
    });
  }
}

export const doctorService = new DoctorService();
