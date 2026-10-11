import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export async function sendVerificationEmail(to: string, firstName: string, token: string): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email/${token}`;

  // Log link in development for quick access
  logger.info(`🔗 Email verification link for ${to}: ${verifyUrl}`);

  try {
    await transporter.sendMail({
      from: `"DocAI" <${env.EMAIL_FROM}>`,
      to,
      subject: 'Verify your DocAI account',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Welcome to DocAI, ${firstName}!</h2>
          <p>Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a>
          <p style="color:#6b7280;font-size:14px;margin-top:24px">Link expires in 24 hours. If you did not create this account, please ignore this email.</p>
        </div>`,
    });
    logger.info(`Verification email sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to deliver verification email to ${to}: ${(err as Error).message}`);
    logger.warn(`👉 Complete verification by opening this URL directly: ${verifyUrl}`);
  }
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;

  logger.info(`🔗 Password reset link for ${to}: ${resetUrl}`);

  try {
    await transporter.sendMail({
      from: `"DocAI" <${env.EMAIL_FROM}>`,
      to,
      subject: 'Reset your DocAI password',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Password Reset Request</h2>
          <p>Hi ${firstName}, click below to reset your password.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a>
          <p style="color:#6b7280;font-size:14px;margin-top:24px">Link expires in 1 hour. If you did not request this, please ignore this email.</p>
        </div>`,
    });
    logger.info(`Password reset email sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to deliver password reset email to ${to}: ${(err as Error).message}`);
    logger.warn(`👉 Reset password directly by opening this URL: ${resetUrl}`);
  }
}

export async function sendAppointmentConfirmationEmail(
  to: string,
  firstName: string,
  doctorName: string,
  date: string,
  slot: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"DocAI" <${env.EMAIL_FROM}>`,
      to,
      subject: 'Appointment Confirmation — DocAI',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>Appointment Confirmed</h2>
          <p>Hi ${firstName}, your appointment has been booked.</p>
          <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${slot}</li>
          </ul>
          <p style="color:#6b7280;font-size:14px">Please arrive 10 minutes early. For online appointments, the meeting link will be shared 15 minutes before.</p>
        </div>`,
    });
    logger.info(`Appointment confirmation email sent to ${to}`);
  } catch (err) {
    logger.error(`Failed to send appointment confirmation to ${to}: ${(err as Error).message}`);
  }
}
