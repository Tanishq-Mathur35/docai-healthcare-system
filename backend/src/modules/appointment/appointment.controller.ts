import { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointment.service';
import { successResponse } from '../../types/common';
import { CancelledBy } from '@prisma/client';

export class AppointmentController {
  async searchDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await appointmentService.searchDoctors(req.query as any);
      res.json(successResponse('Doctors found', data.doctors, data.meta));
    } catch (err) {
      next(err);
    }
  }

  async getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        res.status(400).json({ success: false, message: 'date query parameter is required (YYYY-MM-DD)' });
        return;
      }
      const data = await appointmentService.getAvailableSlots(doctorId, date);
      res.json(successResponse('Available slots', data));
    } catch (err) {
      next(err);
    }
  }

  async book(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await appointmentService.bookAppointment(req.user!.id, req.body, req);
      res.status(201).json(successResponse('Appointment booked successfully', data));
    } catch (err) {
      next(err);
    }
  }

  async getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await appointmentService.getPatientAppointments(req.user!.id, req.query as any);
      res.json(successResponse('My appointments', data.items, data.meta));
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const role = req.user!.role as CancelledBy;
      const data = await appointmentService.cancelAppointment(req.user!.id, req.params.id, reason, role, req);
      res.json(successResponse('Appointment cancelled', data));
    } catch (err) {
      next(err);
    }
  }
}

export const appointmentController = new AppointmentController();
