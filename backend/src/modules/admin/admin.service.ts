import { prisma } from '../../config/database';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';
import { createAuditLog } from '../../middleware/auditLogger';
import { AppError } from '../../middleware/errorHandler';
import { Request } from 'express';
import { Role, AuditAction } from '@prisma/client';

export class AdminService {
  // 1. User Management
  async getUsers(query: { role?: Role; search?: string; isActive?: string; page?: string; limit?: string }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = {};

    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          isEmailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          patient: { select: { id: true, bloodGroup: true, age: true } },
          doctor: { select: { id: true, specialization: true, isVerified: true, isAvailable: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: buildPaginationMeta(total, page, limit) };
  }

  async toggleUserStatus(adminId: string, targetUserId: string, isActive: boolean, req: Request) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });

    await createAuditLog({
      userId: adminId,
      action: 'ADMIN_ACTION',
      entity: 'User',
      entityId: targetUserId,
      oldValue: { isActive: user.isActive },
      newValue: { isActive },
      req,
    });

    return updated;
  }

  async verifyDoctor(adminId: string, doctorId: string, isVerified: boolean, req: Request) {
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new AppError('Doctor not found', 404, 'NOT_FOUND');

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { isVerified },
    });

    await createAuditLog({
      userId: adminId,
      action: 'ADMIN_ACTION',
      entity: 'Doctor',
      entityId: doctorId,
      oldValue: { isVerified: doctor.isVerified },
      newValue: { isVerified },
      req,
    });

    return updated;
  }

  // 2. Platform Analytics
  async getUsageAnalytics() {
    const [
      totalPatients,
      totalDoctors,
      totalConsultations,
      totalAppointments,
      totalReports,
      completedConsultations,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.consultation.count(),
      prisma.appointment.count(),
      prisma.report.count(),
      prisma.consultation.count({ where: { status: 'COMPLETED' } }),
    ]);

    // Monthly consultation trend for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const consultations = await prisma.consultation.findMany({
      where: { startedAt: { gte: sixMonthsAgo } },
      select: { startedAt: true, status: true },
    });

    const monthlyMap: Record<string, { total: number; completed: number }> = {};
    consultations.forEach((c) => {
      const monthYear = c.startedAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = { total: 0, completed: 0 };
      }
      monthlyMap[monthYear].total += 1;
      if (c.status === 'COMPLETED') monthlyMap[monthYear].completed += 1;
    });

    const monthlyTrends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return {
      kpi: {
        totalPatients,
        totalDoctors,
        totalConsultations,
        totalAppointments,
        totalReports,
        completionRate: totalConsultations > 0 ? ((completedConsultations / totalConsultations) * 100).toFixed(1) : '0',
      },
      monthlyTrends,
    };
  }

  async getDiseaseTrends() {
    const reports = await prisma.report.findMany({
      select: { possibleConditions: true, riskLevel: true, generatedAt: true },
      take: 200,
      orderBy: { generatedAt: 'desc' },
    });

    const conditionCountMap: Record<string, number> = {};
    const riskLevelMap: Record<string, number> = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };

    reports.forEach((r) => {
      riskLevelMap[r.riskLevel] = (riskLevelMap[r.riskLevel] || 0) + 1;

      if (Array.isArray(r.possibleConditions)) {
        r.possibleConditions.forEach((c: any) => {
          if (c?.name) {
            conditionCountMap[c.name] = (conditionCountMap[c.name] || 0) + 1;
          }
        });
      }
    });

    const topConditions = Object.entries(conditionCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const riskDistribution = Object.entries(riskLevelMap).map(([risk, count]) => ({
      risk,
      count,
    }));

    return { topConditions, riskDistribution };
  }

  async getAiPerformance() {
    const reports = await prisma.report.findMany({
      select: { confidenceScore: true, tavilyUsed: true, riskLevel: true },
      take: 500,
    });

    const total = reports.length;
    if (total === 0) {
      return {
        avgConfidence: 0,
        tavilyFallbackRate: '0%',
        confidenceHistogram: [],
      };
    }

    const avgConfidence = (reports.reduce((acc, r) => acc + r.confidenceScore, 0) / total).toFixed(2);
    const tavilyCount = reports.filter((r) => r.tavilyUsed).length;
    const tavilyFallbackRate = `${((tavilyCount / total) * 100).toFixed(1)}%`;

    // Histogram brackets: <0.6, 0.6-0.7, 0.7-0.8, 0.8-0.9, 0.9-1.0
    const brackets = {
      '< 60%': 0,
      '60-70%': 0,
      '70-80%': 0,
      '80-90%': 0,
      '90-100%': 0,
    };

    reports.forEach((r) => {
      const score = r.confidenceScore;
      if (score < 0.6) brackets['< 60%']++;
      else if (score < 0.7) brackets['60-70%']++;
      else if (score < 0.8) brackets['70-80%']++;
      else if (score < 0.9) brackets['80-90%']++;
      else brackets['90-100%']++;
    });

    const confidenceHistogram = Object.entries(brackets).map(([range, count]) => ({ range, count }));

    return {
      avgConfidence: Number(avgConfidence),
      tavilyFallbackRate,
      confidenceHistogram,
    };
  }

  // 3. Audit Logs
  async getAuditLogs(query: { action?: AuditAction; entity?: string; page?: string; limit?: string }) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = {};

    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }
}

export const adminService = new AdminService();
