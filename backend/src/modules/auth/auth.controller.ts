import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../types/common';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body, req);
      res.status(201).json(successResponse(result.message));
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body, req);
      res.json(successResponse('OTP verification code sent to your email', result));
    } catch (err) { next(err); }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.verifyOtp(req.body, req);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json(successResponse('OTP verified successfully', {
        accessToken: result.accessToken,
        user: result.user,
      }));
    } catch (err) { next(err); }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resendOtp(req.body);
      res.json(successResponse(result.message, result));
    } catch (err) { next(err); }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) { res.status(401).json({ success: false, message: 'Refresh token required' }); return; }
      const result = await authService.refreshToken(token);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json(successResponse('Token refreshed', { accessToken: result.accessToken }));
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (token && req.user) await authService.logout(req.user.id, token, req);
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.json(successResponse('Logged out successfully'));
    } catch (err) { next(err); }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.verifyEmail(req.params.token);
      res.json(successResponse(result.message));
    } catch (err) { next(err); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body, req);
      res.json(successResponse(result.message));
    } catch (err) { next(err); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      res.json(successResponse(result.message));
    } catch (err) { next(err); }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json(successResponse('User info', req.user));
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
