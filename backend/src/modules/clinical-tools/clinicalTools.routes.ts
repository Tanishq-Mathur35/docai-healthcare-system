import { Router } from 'express';
import { clinicalToolsController } from './clinicalTools.controller';
import { authenticate } from '../../middleware/authenticate';
import { upload } from '../../middleware/upload';

const router = Router();

// Allow authenticated users (both doctors and patients)
router.use(authenticate);

// T01 · /two-minute-doctor
router.post(
  '/two-minute-doctor/questions',
  clinicalToolsController.getTwoMinuteDoctorQuestions.bind(clinicalToolsController)
);
router.post(
  '/two-minute-doctor/summarize',
  upload.array('files', 5),
  clinicalToolsController.summarizeTwoMinuteDoctor.bind(clinicalToolsController)
);

// T02 · /report-decoded
router.post(
  '/report-decoded',
  upload.single('file'),
  clinicalToolsController.decodeReport.bind(clinicalToolsController)
);

// T03 · /going-home-right
router.post(
  '/going-home-right',
  upload.single('file'),
  clinicalToolsController.generateDischargePlan.bind(clinicalToolsController)
);

// T04 · /bol-ke-batao
router.post(
  '/bol-ke-batao',
  clinicalToolsController.processSpeechHistory.bind(clinicalToolsController)
);

export default router;

