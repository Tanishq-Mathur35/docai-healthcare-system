import api from './api';

export const adminService = {
  getUsers: (params?: { role?: string; search?: string; isActive?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),

  getUserProfile: (userId: string) =>
    api.get(`/admin/users/${userId}`),

  toggleUserStatus: (userId: string, isActive: boolean) =>
    api.patch(`/admin/users/${userId}/status`, { isActive }),

  verifyDoctor: (doctorId: string, isVerified: boolean) =>
    api.patch(`/admin/doctors/${doctorId}/verify`, { isVerified }),

  getUsageAnalytics: () =>
    api.get('/admin/analytics/usage'),

  getDiseaseTrends: () =>
    api.get('/admin/analytics/diseases'),

  getAiPerformance: () =>
    api.get('/admin/analytics/ai-performance'),

  getAuditLogs: (params?: { action?: string; entity?: string; page?: number; limit?: number }) =>
    api.get('/admin/audit-logs', { params }),
};
