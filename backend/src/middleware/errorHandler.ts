import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { errorResponse } from '../types/common';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });

  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json(errorResponse('Validation failed', JSON.stringify(err.flatten().fieldErrors)));
    return;
  }

  // Application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code));
    return;
  }

  // Prisma unique constraint
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ');
      res.status(409).json(errorResponse(`A record with this ${fields} already exists`));
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json(errorResponse('Record not found'));
      return;
    }
  }

  // Default 500
  res.status(500).json(errorResponse('Internal server error'));
}
