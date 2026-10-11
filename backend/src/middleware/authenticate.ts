import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof req.query.token === 'string' && req.query.token.trim()) {
      token = req.query.token.trim();
    }

    if (!token) {
      throw new AppError('Access token required', 401, 'UNAUTHORIZED');
    }
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role as any,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    next();
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    if (err.name === 'TokenExpiredError') return next(new AppError('Access token expired', 401, 'TOKEN_EXPIRED'));
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid access token', 401, 'INVALID_TOKEN'));
    next(new AppError('Authentication failed', 401, 'UNAUTHORIZED'));
  }
}
