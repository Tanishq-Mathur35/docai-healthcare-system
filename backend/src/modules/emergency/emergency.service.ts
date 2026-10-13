import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getIO, sendUserNotification } from '../../socket';
import { logger } from '../../config/logger';

export interface EmergencyCallRecord {
  id: string;
  patientUserId: string;
  patientId: string;
  patientName: string;
  patientAge?: number | null;
  patientBloodGroup?: string | null;
  patientAllergies: string[];
  patientChronicDiseases: string[];
  reason: string;
  assignedDoctorUserId: string;
  assignedDoctorId: string;
  assignedDoctorName: string;
  assignedDoctorSpecialization: string;
  triedDoctorUserIds: string[];
  status: 'RINGING' | 'REASSIGNING' | 'ACCEPTED' | 'COMPLETED' | 'UNAVAILABLE';
  roomId: string;
  createdAt: string;
  acceptedAt?: string;
  endedAt?: string;
  reassignmentCount: number;
  notes?: string;
}

const emergencyCallsStore = new Map<string, EmergencyCallRecord>();
const callTimers = new Map<string, NodeJS.Timeout>();

const REASSIGN_TIMEOUT_MS = 20000; // 20 seconds before auto-reassigning to next available doctor

export class EmergencyService {
  private clearTimer(callId: string) {
    const existing = callTimers.get(callId);
    if (existing) {
      clearTimeout(existing);
      callTimers.delete(callId);
    }
  }

  private scheduleAutoReassign(callId: string) {
    this.clearTimer(callId);
    const timer = setTimeout(() => {
      this.reassignToNextDoctor(callId, 'Timeout — Doctor did not respond in 20s').catch((err) =>
        logger.error('Emergency auto-reassign error:', err)
      );
    }, REASSIGN_TIMEOUT_MS);
    callTimers.set(callId, timer);
  }

  private async getCandidateDoctors(excludeUserIds: string[]) {
    let doctors = await prisma.doctor.findMany({
      where: {
        isAvailable: true,
        userId: { notIn: excludeUserIds },
        user: { isActive: true },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ rating: 'desc' }, { experienceYears: 'desc' }],
    });

    if (doctors.length === 0) {
      doctors = await prisma.doctor.findMany({
        where: {
          userId: { notIn: excludeUserIds },
          user: { isActive: true },
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: [{ rating: 'desc' }],
      });
    }

    return doctors;
  }

  async requestEmergencyCall(patientUserId: string, reason?: string): Promise<EmergencyCallRecord> {
    const patient = await prisma.patient.findUnique({
      where: { userId: patientUserId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!patient) {
      throw new AppError('Patient profile not found', 404, 'NOT_FOUND');
    }

    const candidates = await this.getCandidateDoctors([]);
    if (candidates.length === 0) {
      throw new AppError('No doctors are registered in the system yet.', 404, 'NO_DOCTORS');
    }

    const firstDoctor = candidates[0];
    const callId = uuidv4();
    const roomId = `emergency-${callId}`;

    const record: EmergencyCallRecord = {
      id: callId,
      patientUserId,
      patientId: patient.id,
      patientName: `${patient.user.firstName} ${patient.user.lastName}`,
      patientAge: patient.age,
      patientBloodGroup: patient.bloodGroup,
      patientAllergies: patient.allergies || [],
      patientChronicDiseases: patient.chronicDiseases || [],
      reason: reason?.trim() || 'Urgent medical emergency assistance requested',
      assignedDoctorUserId: firstDoctor.user.id,
      assignedDoctorId: firstDoctor.id,
      assignedDoctorName: `Dr. ${firstDoctor.user.firstName} ${firstDoctor.user.lastName}`,
      assignedDoctorSpecialization: firstDoctor.specialization,
      triedDoctorUserIds: [firstDoctor.user.id],
      status: 'RINGING',
      roomId,
      createdAt: new Date().toISOString(),
      reassignmentCount: 0,
    };

    emergencyCallsStore.set(callId, record);

    // Create DB notification for the assigned doctor
    await prisma.notification.create({
      data: {
        userId: firstDoctor.user.id,
        title: `🚨 EMERGENCY CALL: ${record.patientName}`,
        body: `Urgent video assistance requested: "${record.reason}". Auto-reassigns in 20 seconds if unanswered.`,
        type: 'EMERGENCY_ALERT',
        data: record as any,
      },
    }).catch(() => {});

    // Emit live socket event to the doctor and patient
    const io = getIO();
    if (io) {
      io.to(`user:${firstDoctor.user.id}`).emit('emergency_incoming', record);
      io.to(`user:${patientUserId}`).emit('emergency_status', record);
    }

    sendUserNotification(firstDoctor.user.id, {
      title: `🚨 EMERGENCY CALL: ${record.patientName}`,
      body: `Urgent video call requested: ${record.reason}`,
      type: 'EMERGENCY_ALERT',
      data: record,
    });

    this.scheduleAutoReassign(callId);
    return record;
  }

  async reassignToNextDoctor(callId: string, skipReason = 'Doctor unavailable'): Promise<EmergencyCallRecord> {
    this.clearTimer(callId);
    const call = emergencyCallsStore.get(callId);
    if (!call) {
      throw new AppError('Emergency call not found', 404, 'NOT_FOUND');
    }

    if (call.status === 'ACCEPTED' || call.status === 'COMPLETED') {
      return call;
    }

    const io = getIO();
    // Notify previous doctor that call moved on
    if (io && call.assignedDoctorUserId) {
      io.to(`user:${call.assignedDoctorUserId}`).emit('emergency_missed', { callId, reason: skipReason });
    }

    let nextCandidates = await this.getCandidateDoctors(call.triedDoctorUserIds);

    // If all doctors were tried once, cycle back to available doctors so the patient is never stranded
    if (nextCandidates.length === 0) {
      call.triedDoctorUserIds = [];
      nextCandidates = await this.getCandidateDoctors([]);
    }

    if (nextCandidates.length === 0) {
      call.status = 'UNAVAILABLE';
      emergencyCallsStore.set(callId, call);
      if (io) {
        io.to(`user:${call.patientUserId}`).emit('emergency_status', call);
      }
      return call;
    }

    const nextDoctor = nextCandidates[0];
    call.assignedDoctorUserId = nextDoctor.user.id;
    call.assignedDoctorId = nextDoctor.id;
    call.assignedDoctorName = `Dr. ${nextDoctor.user.firstName} ${nextDoctor.user.lastName}`;
    call.assignedDoctorSpecialization = nextDoctor.specialization;
    call.triedDoctorUserIds.push(nextDoctor.user.id);
    call.reassignmentCount += 1;
    call.status = 'RINGING';

    emergencyCallsStore.set(callId, call);

    await prisma.notification.create({
      data: {
        userId: nextDoctor.user.id,
        title: `🚨 REASSIGNED EMERGENCY: ${call.patientName}`,
        body: `Escalated emergency video request: "${call.reason}". Please respond immediately.`,
        type: 'EMERGENCY_ALERT',
        data: call as any,
      },
    }).catch(() => {});

    if (io) {
      io.to(`user:${nextDoctor.user.id}`).emit('emergency_incoming', call);
      io.to(`user:${call.patientUserId}`).emit('emergency_reassigned', {
        ...call,
        message: `Previous doctor was unavailable. Automatically reassigned to ${call.assignedDoctorName} (${call.assignedDoctorSpecialization}).`,
      });
      io.to(`user:${call.patientUserId}`).emit('emergency_status', call);
    }

    this.scheduleAutoReassign(callId);
    return call;
  }

  async acceptEmergencyCall(callId: string, doctorUserId: string): Promise<EmergencyCallRecord> {
    this.clearTimer(callId);
    const call = emergencyCallsStore.get(callId);
    if (!call) {
      throw new AppError('Emergency call not found', 404, 'NOT_FOUND');
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (doctor) {
      call.assignedDoctorUserId = doctor.user.id;
      call.assignedDoctorId = doctor.id;
      call.assignedDoctorName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
      call.assignedDoctorSpecialization = doctor.specialization;
    }

    call.status = 'ACCEPTED';
    call.acceptedAt = new Date().toISOString();
    emergencyCallsStore.set(callId, call);

    // Notify patient in DB and via Socket
    await prisma.notification.create({
      data: {
        userId: call.patientUserId,
        title: `✅ Emergency Call Accepted by ${call.assignedDoctorName}`,
        body: `${call.assignedDoctorName} (${call.assignedDoctorSpecialization}) has joined your emergency live video call.`,
        type: 'EMERGENCY_ALERT',
        data: call as any,
      },
    }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to(`user:${call.patientUserId}`).emit('emergency_accepted', call);
      io.to(`user:${call.patientUserId}`).emit('emergency_status', call);
      io.to(`user:${call.assignedDoctorUserId}`).emit('emergency_status', call);
    }

    sendUserNotification(call.patientUserId, {
      title: `✅ Emergency Call Accepted`,
      body: `${call.assignedDoctorName} has accepted your emergency call and is connecting via live video.`,
      type: 'EMERGENCY_ALERT',
      data: call,
    });

    return call;
  }

  async endEmergencyCall(callId: string, userId: string, notes?: string): Promise<EmergencyCallRecord> {
    this.clearTimer(callId);
    const call = emergencyCallsStore.get(callId);
    if (!call) {
      throw new AppError('Emergency call not found', 404, 'NOT_FOUND');
    }

    call.status = 'COMPLETED';
    call.endedAt = new Date().toISOString();
    if (notes) call.notes = notes;
    emergencyCallsStore.set(callId, call);

    const io = getIO();
    if (io) {
      io.to(`user:${call.patientUserId}`).emit('emergency_ended', call);
      io.to(`user:${call.assignedDoctorUserId}`).emit('emergency_ended', call);
      io.to(`video:${call.roomId}`).emit('webrtc_call_ended', { callId, endedBy: userId });
    }

    return call;
  }

  async getCallHistory(userId: string, role: string): Promise<EmergencyCallRecord[]> {
    const inMemory = Array.from(emergencyCallsStore.values()).filter((c) =>
      role === 'DOCTOR' ? c.assignedDoctorUserId === userId || c.triedDoctorUserIds.includes(userId) : c.patientUserId === userId
    );

    // Also pull historical emergency records from Notifications table so history persists across server restarts
    const dbNotifications = await prisma.notification.findMany({
      where: {
        userId,
        type: { in: ['EMERGENCY_ALERT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const combinedMap = new Map<string, EmergencyCallRecord>();
    for (const item of inMemory) {
      combinedMap.set(item.id, item);
    }

    for (const notif of dbNotifications) {
      const data = notif.data as unknown as EmergencyCallRecord | null;
      if (data && data.id && !combinedMap.has(data.id)) {
        combinedMap.set(data.id, data);
      }
    }

    return Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getActiveCallForUser(userId: string): Promise<EmergencyCallRecord | null> {
    for (const call of emergencyCallsStore.values()) {
      if (
        (call.patientUserId === userId || call.assignedDoctorUserId === userId) &&
        (call.status === 'RINGING' || call.status === 'ACCEPTED')
      ) {
        return call;
      }
    }
    return null;
  }
}

export const emergencyService = new EmergencyService();
