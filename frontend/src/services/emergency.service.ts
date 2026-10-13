import api from './api';

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

export const emergencyService = {
  requestCall: (reason?: string) => api.post('/emergency/request', { reason }),
  acceptCall: (callId: string) => api.post(`/emergency/${callId}/accept`),
  reassignCall: (callId: string, reason?: string) => api.post(`/emergency/${callId}/reassign`, { reason }),
  endCall: (callId: string, notes?: string) => api.post(`/emergency/${callId}/end`, { notes }),
  getActiveCall: () => api.get('/emergency/active'),
  getHistory: () => api.get('/emergency/history'),
};

