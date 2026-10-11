import api from './api';

export const patientService = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/patient/profile', data),
  getMedicalHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/patient/medical-history', { params }),
  addMedicalHistory: (data: Record<string, unknown>) => api.post('/patient/medical-history', data),
  deleteMedicalHistory: (id: string) => api.delete(`/patient/medical-history/${id}`),
  getDocuments: (params?: { page?: number; limit?: number; documentType?: string }) =>
    api.get('/patient/documents', { params }),
  uploadDocument: (formData: FormData) =>
    api.post('/patient/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (id: string) => api.delete(`/patient/documents/${id}`),
  getConsultations: (params?: { page?: number; limit?: number }) =>
    api.get('/patient/consultations', { params }),
  getReport: (id: string) => api.get(`/patient/reports/${id}`),
  getPrescriptions: (params?: { page?: number; limit?: number }) =>
    api.get('/patient/prescriptions', { params }),
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/patient/notifications', { params }),
  markNotificationAsRead: (id: string) => api.patch(`/patient/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/patient/notifications/read-all'),
};
