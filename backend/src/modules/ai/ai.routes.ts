import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('PATIENT'));

router.post('/consultation/start', aiController.start.bind(aiController));
router.post('/consultation/:id/respond', aiController.respond.bind(aiController));
router.post('/consultation/:id/relevance', aiController.setRelevance.bind(aiController));
router.get('/consultation/:id/state', aiController.getState.bind(aiController));
router.post('/consultation/:id/finish', aiController.finish.bind(aiController));
router.get('/reports/:id/pdf', aiController.getPdf.bind(aiController));
router.get('/reports/:id/download', aiController.downloadPdf.bind(aiController));

export default router;
