import { Router } from 'express';
import { patientController } from './patient.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { updateProfileSchema, addMedicalHistorySchema } from './patient.schema';

const router = Router();

router.use(authenticate, authorize('PATIENT'));

router.get('/profile', patientController.getProfile.bind(patientController));
router.put('/profile', validate(updateProfileSchema), patientController.updateProfile.bind(patientController));

router.get('/medical-history', patientController.getMedicalHistory.bind(patientController));
router.post('/medical-history', validate(addMedicalHistorySchema), patientController.addMedicalHistory.bind(patientController));
router.delete('/medical-history/:id', patientController.deleteMedicalHistory.bind(patientController));

router.get('/documents', patientController.getDocuments.bind(patientController));
router.post('/documents/upload', upload.single('file'), patientController.uploadDocument.bind(patientController));
router.delete('/documents/:id', patientController.deleteDocument.bind(patientController));

router.get('/consultations', patientController.getConsultations.bind(patientController));
router.get('/reports/:id', patientController.getReport.bind(patientController));

router.get('/prescriptions', patientController.getPrescriptions.bind(patientController));
router.get('/notifications', patientController.getNotifications.bind(patientController));
router.patch('/notifications/:id/read', patientController.markNotificationAsRead.bind(patientController));
router.patch('/notifications/read-all', patientController.markAllNotificationsAsRead.bind(patientController));

export default router;
