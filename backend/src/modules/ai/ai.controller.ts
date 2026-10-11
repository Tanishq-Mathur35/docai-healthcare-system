import { Request, Response, NextFunction } from 'express';
import { aiService } from './ai.service';
import { successResponse } from '../../types/common';

export class AiController {
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chiefComplaint } = req.body;
      if (!chiefComplaint || typeof chiefComplaint !== 'string') {
        res.status(400).json({ success: false, message: 'Chief complaint is required' });
        return;
      }
      const data = await aiService.startConsultation(req.user!.id, chiefComplaint, req);
      res.status(201).json(successResponse('Consultation started', data));
    } catch (err) {
      next(err);
    }
  }

  async respond(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { answer } = req.body;
      if (!answer || typeof answer !== 'string') {
        res.status(400).json({ success: false, message: 'Answer is required' });
        return;
      }
      const data = await aiService.respondToQuestion(req.user!.id, req.params.id, answer, req);
      res.json(successResponse('Response recorded', data));
    } catch (err) {
      next(err);
    }
  }

  async setRelevance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conditionId, relevance } = req.body;
      if (!conditionId || !['RELEVANT', 'NOT_RELEVANT'].includes(relevance)) {
        res.status(400).json({ success: false, message: 'Valid conditionId and relevance required' });
        return;
      }
      const data = await aiService.setConditionRelevance(req.user!.id, req.params.id, conditionId, relevance);
      res.json(successResponse(data.message));
    } catch (err) {
      next(err);
    }
  }

  async getState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await aiService.getConsultationState(req.user!.id, req.params.id);
      res.json(successResponse('Consultation state', data));
    } catch (err) {
      next(err);
    }
  }

  async finish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await aiService.finishConsultation(req.user!.id, req.params.id, req);
      res.json(successResponse('Consultation completed', data));
    } catch (err) {
      next(err);
    }
  }

  async getPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await aiService.getReportPdfUrl(req.user!.id, req.params.id);
      res.json(successResponse('Report PDF URL', data));
    } catch (err) {
      next(err);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buffer, fileName } = await aiService.getReportPdfBuffer(req.user!.id, req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
