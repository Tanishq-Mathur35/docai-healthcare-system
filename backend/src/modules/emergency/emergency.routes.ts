import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { emergencyService } from './emergency.service';
import { successResponse } from '../../types/common';

const router = Router();

router.use(authenticate);

// Request an emergency video call (Patient)
router.post('/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await emergencyService.requestEmergencyCall(req.user!.id, req.body?.reason);
    res.status(201).json(successResponse('Emergency request initiated. Connecting to available doctor...', call));
  } catch (err) {
    next(err);
  }
});

// Doctor accepts the emergency call
router.post('/:callId/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await emergencyService.acceptEmergencyCall(req.params.callId, req.user!.id);
    res.json(successResponse('Emergency call accepted', call));
  } catch (err) {
    next(err);
  }
});

// Doctor or Patient triggers reassignment if doctor is unavailable
router.post('/:callId/reassign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await emergencyService.reassignToNextDoctor(req.params.callId, req.body?.reason || 'Doctor unavailable');
    res.json(successResponse(`Emergency call reassigned to ${call.assignedDoctorName}`, call));
  } catch (err) {
    next(err);
  }
});

// End emergency call
router.post('/:callId/end', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await emergencyService.endEmergencyCall(req.params.callId, req.user!.id, req.body?.notes);
    res.json(successResponse('Emergency call ended', call));
  } catch (err) {
    next(err);
  }
});

// Get active call for current user
router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const call = await emergencyService.getActiveCallForUser(req.user!.id);
    res.json(successResponse('Active emergency call status', call));
  } catch (err) {
    next(err);
  }
});

// Get emergency call history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await emergencyService.getCallHistory(req.user!.id, req.user!.role);
    res.json(successResponse('Emergency call history fetched', history));
  } catch (err) {
    next(err);
  }
});

export default router;

