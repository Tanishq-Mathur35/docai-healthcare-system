import { z } from 'zod';
import { NoteType } from '@prisma/client';

const optionalFlexibleDateSchema = z
  .union([
    z.string().datetime(),
    z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Must be YYYY-MM-DD or ISO datetime'),
    z.string().length(0),
    z.null(),
    z.undefined(),
  ])
  .optional()
  .transform((val) => {
    if (!val || typeof val !== 'string' || !val.trim()) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  });

const optionalUuidSchema = z
  .union([z.string().uuid(), z.string().length(0), z.null(), z.undefined()])
  .optional()
  .transform((val) => (val && typeof val === 'string' && val.trim() ? val : undefined));

export const createDoctorNoteSchema = z.object({
  appointmentId: optionalUuidSchema,
  noteType: z.nativeEnum(NoteType).default('GENERAL'),
  content: z.string().min(1, 'Content is required'),
  diagnosis: z.string().optional(),
  icdCodes: z.array(z.string()).default([]),
  followUpDate: optionalFlexibleDateSchema,
});

export const medicationItemSchema = z.object({
  name: z.string().min(1, 'Medication name required'),
  dosage: z.string().min(1, 'Dosage required (e.g. 500mg)'),
  frequency: z.string().min(1, 'Frequency required (e.g. Twice daily)'),
  duration: z.string().min(1, 'Duration required (e.g. 7 days)'),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  appointmentId: optionalUuidSchema,
  medications: z.array(medicationItemSchema).min(1, 'At least one medication is required'),
  instructions: z.string().optional(),
  validUntil: optionalFlexibleDateSchema,
});

export const updateDoctorProfileSchema = z.object({
  specialization: z.string().min(1).optional(),
  subSpecializations: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  hospital: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  bio: z.string().max(2000).optional(),
});

export type CreateDoctorNoteDto = z.infer<typeof createDoctorNoteSchema>;
export type CreatePrescriptionDto = z.infer<typeof createPrescriptionSchema>;
export type UpdateDoctorProfileDto = z.infer<typeof updateDoctorProfileSchema>;
