import api from './api';

export const doctorService = {
  getProfile: () => api.get('/doctor/profile'),

  updateProfile: (data: Record<string, unknown>) => api.put('/doctor/profile', data),

  getAssignedPatients: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/doctor/patients', { params }),

  getPatientDetail: (patientId: string) =>
    api.get(`/doctor/patients/${patientId}`),

  addNote: (patientId: string, data: { appointmentId?: string; noteType: string; content: string; diagnosis?: string; icdCodes?: string[]; followUpDate?: string }) =>
    api.post(`/doctor/patients/${patientId}/notes`, data),

  addPrescription: (patientId: string, data: { appointmentId?: string; medications: any[]; instructions?: string; validUntil?: string }) =>
    api.post(`/doctor/patients/${patientId}/prescription`, data),

  getAppointments: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/doctor/appointments', { params }),

  updateAppointmentStatus: (appointmentId: string, status: string, meetingLink?: string) =>
    api.patch(`/doctor/appointments/${appointmentId}/status`, { status, meetingLink }),
};
