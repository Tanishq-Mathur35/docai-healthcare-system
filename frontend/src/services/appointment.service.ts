import api from './api';

export const appointmentService = {
  searchDoctors: (params: { specialization?: string; city?: string; minRating?: string; query?: string; page?: number; limit?: number }) =>
    api.get('/appointments/doctors/search', { params }),

  getSlots: (doctorId: string, date: string) =>
    api.get(`/appointments/doctors/${doctorId}/slots`, { params: { date } }),

  book: (data: { doctorId: string; appointmentDate: string; slotStart: string; slotEnd: string; type: string; chiefComplaint?: string; consultationId?: string }) =>
    api.post('/appointments', data),

  getMyAppointments: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/appointments/me', { params }),

  cancel: (appointmentId: string, reason: string) =>
    api.patch(`/appointments/${appointmentId}/cancel`, { reason }),
};
