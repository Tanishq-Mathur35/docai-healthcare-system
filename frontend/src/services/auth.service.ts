import api from './api';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR';
  specialization?: string;
  licenseNumber?: string;
  experienceYears?: number;
  hospital?: string;
}

export interface LoginPayload { email: string; password: string; }

export const authService = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login: (data: LoginPayload) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  me: () => api.get('/auth/me'),
};
