import { Request, Response, NextFunction } from 'express';
import { clinicalToolsService } from './clinicalTools.service';
import { successResponse, errorResponse } from '../../types/common';
import { logger } from '../../config/logger';

export class ClinicalToolsController {
  // --- T01: Two-Minute Doctor ---
  async getTwoMinuteDoctorQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { complaint, history } = req.body;
      if (!complaint || typeof complaint !== 'string' || !complaint.trim()) {
        res.status(400).json(errorResponse('Chief complaint is required'));
        return;
      }

      const questions = await clinicalToolsService.generateTwoMinuteQuestions(complaint, history);
      res.json(successResponse('Adaptive clinical questions generated', { questions }));
    } catch (err) {
      next(err);
    }
  }

  async summarizeTwoMinuteDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaint = req.body.complaint || '';
      if (!complaint.trim() && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
        res.status(400).json(errorResponse('Either a complaint or paperwork documents must be provided'));
        return;
      }

      let followUpAnswers: Array<{ question: string; answer: string }> = [];
      if (typeof req.body.followUpAnswers === 'string') {
        try {
          followUpAnswers = JSON.parse(req.body.followUpAnswers);
        } catch {
          followUpAnswers = [];
        }
      } else if (Array.isArray(req.body.followUpAnswers)) {
        followUpAnswers = req.body.followUpAnswers;
      }

      const documentsText = req.body.documentsText || '';
      const files = (req.files as Express.Multer.File[]) || [];

      const result = await clinicalToolsService.summarizeForDoctor(
        complaint,
        followUpAnswers,
        documentsText,
        files
      );

      res.json(successResponse('OPD 60-second summary created successfully', result));
    } catch (err) {
      next(err);
    }
  }

  // --- T02: Report Decoded ---
  async decodeReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const reportText = req.body.reportText;

      if (!file && (!reportText || !reportText.trim())) {
        res.status(400).json(errorResponse('Please upload a lab report image/PDF or paste report text'));
        return;
      }

      const result = await clinicalToolsService.decodeLabReport(reportText, file);
      res.json(successResponse('Lab report decoded successfully', result));
    } catch (err) {
      next(err);
    }
  }

  // --- T03: Going Home Right ---
  async generateDischargePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      const dischargeText = req.body.dischargeText;

      if (!file && (!dischargeText || !dischargeText.trim())) {
        res.status(400).json(errorResponse('Please upload a discharge summary file or paste the text'));
        return;
      }

      const result = await clinicalToolsService.parseDischargeCarePlan(dischargeText, file);
      res.json(successResponse('Discharge care plan generated successfully', result));
    } catch (err) {
      next(err);
    }
  }

  // --- T04: Bol Ke Batao ---
  async processSpeechHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { transcript, dialectHint } = req.body;

      if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
        res.status(400).json(errorResponse('Patient transcript in Hindi, Hinglish, or Marwari is required'));
        return;
      }

      const result = await clinicalToolsService.processBolKeBataoSpeech(transcript.trim(), dialectHint);
      res.json(successResponse('Clinical history extracted with exact source phrases', result));
    } catch (err) {
      next(err);
    }
  }
}

export const clinicalToolsController = new ClinicalToolsController();

