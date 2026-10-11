import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { successResponse } from '../../types/common';

export class AdminController {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getUsers(req.query as any);
      res.json({
        success: true,
        message: 'Users retrieved',
        data: data.users,
        users: data.users,
        meta: data.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive } = req.body;
      const data = await adminService.toggleUserStatus(req.user!.id, req.params.id, Boolean(isActive), req);
      res.json(successResponse('User status updated', data));
    } catch (err) {
      next(err);
    }
  }

  async verifyDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isVerified } = req.body;
      const data = await adminService.verifyDoctor(req.user!.id, req.params.id, Boolean(isVerified), req);
      res.json(successResponse('Doctor verification status updated', data));
    } catch (err) {
      next(err);
    }
  }

  async getUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getUsageAnalytics();
      res.json(successResponse('Usage analytics', data));
    } catch (err) {
      next(err);
    }
  }

  async getDiseaseTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getDiseaseTrends();
      res.json(successResponse('Disease trend analytics', data));
    } catch (err) {
      next(err);
    }
  }

  async getAiPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getAiPerformance();
      res.json(successResponse('AI performance analytics', data));
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getAuditLogs(req.query as any);
      res.json({
        success: true,
        message: 'Audit logs',
        data: data.items,
        items: data.items,
        meta: data.meta,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
