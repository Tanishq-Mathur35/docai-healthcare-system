import { Request, Response, NextFunction } from 'express';
import { patientService } from './patient.service';
import { successResponse } from '../../types/common';
import { DocumentType } from '@prisma/client';

export class PatientController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getProfile(req.user!.id);
      res.json(successResponse('Profile fetched', data));
    } catch (err) { next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.updateProfile(req.user!.id, req.body, req);
      res.json(successResponse('Profile updated', data));
    } catch (err) { next(err); }
  }

  async getMedicalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getMedicalHistory(req.user!.id, req.query as any);
      res.json(successResponse('Medical history fetched', data.items, data.meta));
    } catch (err) { next(err); }
  }

  async addMedicalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.addMedicalHistory(req.user!.id, req.body, req);
      res.status(201).json(successResponse('Medical history added', data));
    } catch (err) { next(err); }
  }

  async deleteMedicalHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.deleteMedicalHistory(req.user!.id, req.params.historyId, req);
      res.json(successResponse('Medical history deleted', data));
    } catch (err) { next(err); }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getDocuments(req.user!.id, req.query as any);
      res.json(successResponse('Documents fetched', data.items, data.meta));
    } catch (err) { next(err); }
  }

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documentType = req.body.documentType as DocumentType;
      const data = await patientService.uploadDocument(req.user!.id, req.file!, documentType, req);
      res.status(201).json(successResponse('Document uploaded', data));
    } catch (err) { next(err); }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.deleteDocument(req.user!.id, req.params.documentId, req);
      res.json(successResponse('Document deleted', data));
    } catch (err) { next(err); }
  }

  async getConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getConsultations(req.user!.id, req.query as any);
      res.json(successResponse('Consultations fetched', data.items, data.meta));
    } catch (err) { next(err); }
  }

  async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getReport(req.user!.id, req.params.reportId);
      res.json(successResponse('Report fetched', data));
    } catch (err) { next(err); }
  }

  async getPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getPrescriptions(req.user!.id, req.query as any);
      res.json(successResponse('Prescriptions fetched', data.items, data.meta));
    } catch (err) { next(err); }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.getNotifications(req.user!.id, req.query as any);
      res.json(successResponse('Notifications fetched', data));
    } catch (err) { next(err); }
  }

  async markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.markNotificationAsRead(req.user!.id, req.params.id);
      res.json(successResponse('Notification marked as read', data));
    } catch (err) { next(err); }
  }

  async markAllNotificationsAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await patientService.markAllNotificationsAsRead(req.user!.id);
      res.json(successResponse('All notifications marked as read', data));
    } catch (err) { next(err); }
  }
}

export const patientController = new PatientController();
