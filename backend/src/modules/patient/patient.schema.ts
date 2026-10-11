import { z } from 'zod';
import { Gender, BloodGroup, ConditionType, Severity, DocumentType } from '@prisma/client';

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

export const updateProfileSchema = z.object({
  age: z.number().int().min(0).max(150).optional(),
  dateOfBirth: optionalFlexibleDateSchema,
  gender: z.nativeEnum(Gender).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  allergies: z.array(z.string()).optional(),
  chronicDiseases: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  emergencyContactRelation: z.string().max(50).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  insuranceProvider: z.string().max(100).optional(),
  insurancePolicyNumber: z.string().max(100).optional(),
});

export const addMedicalHistorySchema = z.object({
  conditionName: z.string().min(1).max(200),
  conditionType: z.nativeEnum(ConditionType).default('OTHER'),
  description: z.string().max(2000).optional(),
  diagnosedAt: optionalFlexibleDateSchema,
  resolvedAt: optionalFlexibleDateSchema,
  isActive: z.boolean().default(true),
  medications: z.array(z.string()).default([]),
  severity: z.nativeEnum(Severity).optional(),
  icdCode: z.string().max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType).default('OTHER'),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AddMedicalHistoryDto = z.infer<typeof addMedicalHistorySchema>;
export type UploadDocumentDto = z.infer<typeof uploadDocumentSchema>;
