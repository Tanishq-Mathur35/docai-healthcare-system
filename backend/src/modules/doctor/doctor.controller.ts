import { Request, Response, NextFunction } from 'express';
import { doctorService } from './doctor.service';
import { successResponse } from '../../types/common';
import { AppointmentStatus } from '@prisma/client';

export class DoctorController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.getProfile(req.user!.id);
      res.json(successResponse('Doctor profile', data));
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.updateProfile(req.user!.id, req.body, req);
      res.json(successResponse('Profile updated', data));
    } catch (err) {
      next(err);
    }
  }

  async getAssignedPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.getAssignedPatients(req.user!.id, req.query as any);
      res.json({
        success: true,
        message: 'Assigned patients',
        data: data.patients,
        patients: data.patients,
        meta: data.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPatientDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.getAssignedPatientDetail(req.user!.id, req.params.patientId);
      res.json(successResponse('Patient detail', data));
    } catch (err) {
      next(err);
    }
  }

  async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.addDoctorNote(req.user!.id, req.params.patientId, req.body, req);
      res.status(201).json(successResponse('Doctor note added', data));
    } catch (err) {
      next(err);
    }
  }

  async addPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.addPrescription(req.user!.id, req.params.patientId, req.body, req);
      res.status(201).json(successResponse('Prescription created', data));
    } catch (err) {
      next(err);
    }
  }

  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await doctorService.getDoctorAppointments(req.user!.id, req.query as any);
      res.json({
        success: true,
        message: 'Doctor appointments',
        data: data.items,
        items: data.items,
        meta: data.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, meetingLink } = req.body;
      const data = await doctorService.updateAppointmentStatus(req.user!.id, req.params.appointmentId, status as AppointmentStatus, meetingLink);
      res.json(successResponse('Appointment updated', data));
    } catch (err) {
      next(err);
    }
  }
}

export const doctorController = new DoctorController();
