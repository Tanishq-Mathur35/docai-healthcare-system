import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/auditLogger';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { sendAppointmentConfirmationEmail } from '../../utils/email';
import { BookAppointmentDto, SearchDoctorsDto } from './appointment.schema';
import { Request } from 'express';
import { AppointmentStatus, CancelledBy } from '@prisma/client';

export class AppointmentService {
  async searchDoctors(query: SearchDoctorsDto) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = {
      isAvailable: true,
      user: { isActive: true },
    };

    if (query.specialization) {
      where.specialization = { contains: query.specialization, mode: 'insensitive' };
    }
    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }
    if (query.minRating) {
      where.rating = { gte: parseFloat(query.minRating) };
    }
    if (query.maxFee) {
      where.consultationFee = { lte: parseFloat(query.maxFee) };
    }
    if (query.query) {
      where.OR = [
        { user: { firstName: { contains: query.query, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.query, mode: 'insensitive' } } },
        { hospital: { contains: query.query, mode: 'insensitive' } },
        { specialization: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } },
        },
        orderBy: [{ rating: 'desc' }, { experienceYears: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, meta: buildPaginationMeta(total, page, limit) };
  }

  async getAvailableSlots(doctorId: string, dateStr: string) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new AppError('Doctor not found', 404, 'NOT_FOUND');

    const appointmentDate = new Date(`${dateStr}T00:00:00.000Z`);

    // Standard business hours: 09:00 to 17:00, 30-min slots
    const allSlots = [
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '10:00', end: '10:30' },
      { start: '10:30', end: '11:00' },
      { start: '11:00', end: '11:30' },
      { start: '11:30', end: '12:00' },
      { start: '14:00', end: '14:30' },
      { start: '14:30', end: '15:00' },
      { start: '15:00', end: '15:30' },
      { start: '15:30', end: '16:00' },
      { start: '16:00', end: '16:30' },
      { start: '16:30', end: '17:00' },
    ];

    // Find booked slots for this date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      select: { slotStart: true },
    });

    const bookedSlotStarts = new Set(bookedAppointments.map((a) => a.slotStart));

    const slots = allSlots.map((slot) => ({
      ...slot,
      isAvailable: !bookedSlotStarts.has(slot.start),
    }));

    return { doctorId, date: dateStr, slots };
  }

  async bookAppointment(userId: string, dto: BookAppointmentDto, req: Request) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const doctor = await prisma.doctor.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });
    if (!doctor || !doctor.isAvailable) {
      throw new AppError('Doctor is not available for appointments', 400, 'DOCTOR_UNAVAILABLE');
    }

    const appointmentDate = new Date(`${dto.appointmentDate}T00:00:00.000Z`);

    // Check slot collision
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        appointmentDate,
        slotStart: dto.slotStart,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });
    if (existing) {
      throw new AppError('This time slot is already booked. Please pick another.', 409, 'SLOT_TAKEN');
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate,
        slotStart: dto.slotStart,
        slotEnd: dto.slotEnd,
        type: dto.type,
        chiefComplaint: dto.chiefComplaint,
        consultationId: dto.consultationId,
        fee: doctor.consultationFee,
        status: 'SCHEDULED',
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
    });

    // Auto-create or reuse chat room for this patient and doctor
    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        patientId: patient.id,
        doctorId: doctor.id,
        type: 'DOCTOR_PATIENT',
      },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          type: 'DOCTOR_PATIENT',
          patientId: patient.id,
          doctorId: doctor.id,
          consultationId: dto.consultationId || undefined,
        },
      });
    }

    // Send confirmation email async
    sendAppointmentConfirmationEmail(
      patient.user.email,
      patient.user.firstName,
      `${doctor.user.firstName} ${doctor.user.lastName}`,
      dto.appointmentDate,
      `${dto.slotStart} - ${dto.slotEnd}`
    ).catch(() => {});

    await createAuditLog({
      userId,
      action: 'APPOINTMENT_BOOKED',
      entity: 'Appointment',
      entityId: appointment.id,
      req,
    });

    // Create in-app notification for doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        type: 'APPOINTMENT_BOOKED',
        title: 'New Appointment Scheduled',
        body: `${patient.user.firstName} ${patient.user.lastName} booked an appointment for ${dto.appointmentDate} (${dto.slotStart} - ${dto.slotEnd}).`,
        data: { appointmentId: appointment.id },
      },
    }).catch(() => {});

    return appointment;
  }

  async getPatientAppointments(userId: string, query: { status?: AppointmentStatus; page?: string; limit?: string }) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new AppError('Patient profile not found', 404, 'NOT_FOUND');

    const { page, limit, skip } = getPaginationParams(query);
    const where: any = { patientId: patient.id };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } },
            },
          },
          prescription: true,
          doctorNote: true,
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  async cancelAppointment(userId: string, appointmentId: string, reason: string, cancelledByRole: CancelledBy, req: Request) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });
    if (!appointment) throw new AppError('Appointment not found', 404, 'NOT_FOUND');

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw new AppError(`Appointment is already ${appointment.status.toLowerCase()}`, 400, 'INVALID_STATE');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        cancelledBy: cancelledByRole,
      },
    });

    await createAuditLog({
      userId,
      action: 'APPOINTMENT_CANCELLED',
      entity: 'Appointment',
      entityId: appointmentId,
      newValue: { cancelReason: reason, cancelledBy: cancelledByRole },
      req,
    });

    return updated;
  }
}

export const appointmentService = new AppointmentService();
