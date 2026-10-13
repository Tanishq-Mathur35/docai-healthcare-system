import { prisma } from '../../config/database';
import { RefreshTokenStore, redis } from '../../config/redis';
import { hashPassword, comparePassword } from '../../utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, generateSecureToken } from '../../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail, sendLoginOtpEmail } from '../../utils/email';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../middleware/auditLogger';
import { Role } from '@prisma/client';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto, ResendOtpDto } from './auth.schema';
import { env } from '../../config/env';
import { Request } from 'express';
import crypto from 'crypto';

interface OtpRecord {
  userId: string;
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: number;
}

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

// In-memory store with Redis mirror for 100% reliability
const memoryOtpStore = new Map<string, OtpRecord>();

async function saveOtpRecord(email: string, record: OtpRecord): Promise<void> {
  const normalized = email.toLowerCase().trim();
  memoryOtpStore.set(normalized, record);
  try {
    await redis.set(`otp:2fa:${normalized}`, JSON.stringify(record), { ex: OTP_EXPIRY_SECONDS });
  } catch {
    // Fallback to in-memory store if Redis is unreachable
  }
}

async function getOtpRecord(email: string): Promise<OtpRecord | null> {
  const normalized = email.toLowerCase().trim();
  const mem = memoryOtpStore.get(normalized);
  if (mem) return mem;
  try {
    const raw = await redis.get(`otp:2fa:${normalized}`);
    if (!raw) return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as OtpRecord);
    memoryOtpStore.set(normalized, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function deleteOtpRecord(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  memoryOtpStore.delete(normalized);
  try {
    await redis.del(`otp:2fa:${normalized}`);
  } catch {
    // Ignore
  }
}

function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export class AuthService {
  async register(dto: RegisterDto, req: Request) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      if (!existing.isEmailVerified) {
        const emailVerifyToken = generateSecureToken();
        const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerifyToken, emailVerifyExpires },
        });
        await sendVerificationEmail(existing.email, existing.firstName, emailVerifyToken);
        return { message: 'Account pending verification. A new verification link has been sent.' };
      }
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(dto.password);
    const emailVerifyToken = generateSecureToken();
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          emailVerifyToken,
          emailVerifyExpires,
          isEmailVerified: env.NODE_ENV === 'development',
        },
      });

      if (dto.role === Role.PATIENT) {
        await tx.patient.create({ data: { userId: newUser.id } });
      } else if (dto.role === Role.DOCTOR) {
        await tx.doctor.create({
          data: {
            userId: newUser.id,
            specialization: dto.specialization!,
            licenseNumber: dto.licenseNumber!,
            experienceYears: dto.experienceYears ?? 0,
            hospital: dto.hospital,
          },
        });
      }

      return newUser;
    });

    await sendVerificationEmail(user.email, user.firstName, emailVerifyToken);
    await createAuditLog({ userId: user.id, action: 'USER_REGISTERED', entity: 'User', entityId: user.id, req });

    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(dto: LoginDto, req: Request) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    if (!user.isActive) throw new AppError('Account is deactivated. Contact support.', 403, 'ACCOUNT_INACTIVE');
    if (!user.isEmailVerified) {
      if (env.NODE_ENV === 'development') {
        await prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      } else {
        throw new AppError('Please verify your email before logging in.', 403, 'EMAIL_NOT_VERIFIED');
      }
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    // Generate 6-digit Email OTP for 2FA (both Doctors & Patients)
    const otp = generateSixDigitOtp();
    const now = Date.now();
    const otpRecord: OtpRecord = {
      userId: user.id,
      email: user.email,
      otp,
      expiresAt: now + OTP_EXPIRY_SECONDS * 1000,
      attempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
      resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
    };

    await saveOtpRecord(user.email, otpRecord);
    await sendLoginOtpEmail(user.email, user.firstName, otp);

    return {
      requiresOtp: true,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
      resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
      maxAttempts: MAX_OTP_ATTEMPTS,
      // Provide OTP in development mode so local testing works even without live SMTP
      devOtpHint: env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, req: Request) {
    const record = await getOtpRecord(dto.email);
    if (!record) {
      throw new AppError('No active OTP found or code has expired. Please request a new OTP.', 400, 'OTP_NOT_FOUND');
    }

    if (Date.now() > record.expiresAt) {
      await deleteOtpRecord(dto.email);
      throw new AppError('Your OTP code has expired (valid for 5 minutes). Please click Resend OTP.', 400, 'OTP_EXPIRED');
    }

    if (record.attempts >= record.maxAttempts) {
      await deleteOtpRecord(dto.email);
      throw new AppError('Maximum verification attempts (5) exceeded. Please sign in or resend a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
    }

    if (record.otp !== dto.otp.trim()) {
      record.attempts += 1;
      const remaining = Math.max(0, record.maxAttempts - record.attempts);
      if (remaining === 0) {
        await deleteOtpRecord(dto.email);
        throw new AppError('Maximum verification attempts (5) reached. Your OTP has been invalidated. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
      }
      await saveOtpRecord(dto.email, record);
      throw new AppError(`Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 401, 'INVALID_OTP');
    }

    // Valid OTP — clear OTP record and issue tokens
    await deleteOtpRecord(dto.email);

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || !user.isActive) {
      throw new AppError('Account not found or inactive', 401, 'UNAUTHORIZED');
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const refreshToken = signRefreshToken({ id: user.id });
    const tokenHash = hashToken(refreshToken);

    try {
      await RefreshTokenStore.set(user.id, tokenHash, 7 * 24 * 60 * 60);
    } catch {
      // Non-fatal if Redis is offline
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createAuditLog({ userId: user.id, action: 'USER_LOGIN', entity: 'User', entityId: user.id, req });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
    }

    const existing = await getOtpRecord(dto.email);
    const now = Date.now();
    if (existing && now < existing.resendAvailableAt) {
      const waitSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
      throw new AppError(`Please wait ${waitSec} seconds before requesting another OTP.`, 429, 'OTP_COOLDOWN');
    }

    const otp = generateSixDigitOtp();
    const otpRecord: OtpRecord = {
      userId: user.id,
      email: user.email,
      otp,
      expiresAt: now + OTP_EXPIRY_SECONDS * 1000,
      attempts: 0,
      maxAttempts: MAX_OTP_ATTEMPTS,
      resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
    };

    await saveOtpRecord(user.email, otpRecord);
    await sendLoginOtpEmail(user.email, user.firstName, otp);

    return {
      message: 'A new 6-digit OTP has been sent to your email.',
      email: user.email,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
      resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
      maxAttempts: MAX_OTP_ATTEMPTS,
      devOtpHint: env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async refreshToken(token: string) {
    let payload: { id: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const tokenHash = hashToken(token);
    const exists = await RefreshTokenStore.exists(payload.id, tokenHash);
    if (!exists) throw new AppError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');

    // Rotate: delete old, issue new
    await RefreshTokenStore.delete(payload.id, tokenHash);
    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const newRefreshToken = signRefreshToken({ id: user.id });
    const newTokenHash = hashToken(newRefreshToken);
    await RefreshTokenStore.set(user.id, newTokenHash, 7 * 24 * 60 * 60);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, refreshToken: string, req: Request) {
    const tokenHash = hashToken(refreshToken);
    await RefreshTokenStore.delete(userId, tokenHash);
    await createAuditLog({ userId, action: 'USER_LOGOUT', entity: 'User', entityId: userId, req });
    return { message: 'Logged out successfully' };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
        isEmailVerified: false,
      },
    });
    if (!user) throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });
    await createAuditLog({ userId: user.id, action: 'EMAIL_VERIFIED', entity: 'User', entityId: user.id });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(dto: ForgotPasswordDto, req: Request) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const token = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
    await sendPasswordResetEmail(user.email, user.firstName, token);
    await createAuditLog({ userId: user.id, action: 'PASSWORD_RESET', entity: 'User', entityId: user.id, req });
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');

    const passwordHash = await hashPassword(dto.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });
    // Invalidate all refresh tokens for this user
    await RefreshTokenStore.deleteAll(user.id);
    return { message: 'Password reset successfully. Please log in with your new password.' };
  }
}

export const authService = new AuthService();
