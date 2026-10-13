import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  phone: z.string().optional(),
  role: z.enum([Role.PATIENT, Role.DOCTOR]),
  // Doctor-specific fields (required when role=DOCTOR)
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  hospital: z.string().optional(),
}).refine(
  (data) => {
    if (data.role === Role.DOCTOR) {
      return !!data.specialization && !!data.licenseNumber;
    }
    return true;
  },
  { message: 'Doctors must provide specialization and licenseNumber', path: ['specialization'] }
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().trim().length(6, 'OTP must be a 6-digit code'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;

