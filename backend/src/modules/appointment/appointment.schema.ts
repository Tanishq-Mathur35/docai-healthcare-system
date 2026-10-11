import { z } from 'zod';
import { AppointmentStatus, AppointmentType, CancelledBy } from '@prisma/client';

export const searchDoctorsSchema = z.object({
  specialization: z.string().optional(),
  city: z.string().optional(),
  minRating: z.string().optional(),
  maxFee: z.string().optional(),
  query: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  slotStart: z.string().regex(/^\d{2}:\d{2}$/, 'Slot must be HH:MM'),
  slotEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Slot must be HH:MM'),
  type: z.nativeEnum(AppointmentType).default('IN_PERSON'),
  chiefComplaint: z.string().max(1000).optional(),
  consultationId: z.string().uuid().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  meetingLink: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export type SearchDoctorsDto = z.infer<typeof searchDoctorsSchema>;
export type BookAppointmentDto = z.infer<typeof bookAppointmentSchema>;
export type CancelAppointmentDto = z.infer<typeof cancelAppointmentSchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof updateAppointmentStatusSchema>;
