import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// User management
router.get('/users', adminController.getUsers.bind(adminController));
router.patch('/users/:id/status', adminController.toggleStatus.bind(adminController));
router.patch('/doctors/:id/verify', adminController.verifyDoctor.bind(adminController));

// Analytics
router.get('/analytics/usage', adminController.getUsage.bind(adminController));
router.get('/analytics/diseases', adminController.getDiseaseTrends.bind(adminController));
router.get('/analytics/ai-performance', adminController.getAiPerformance.bind(adminController));

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

export default router;
