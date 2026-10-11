import { Router } from 'express';
import { doctorController } from './doctor.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createDoctorNoteSchema,
  createPrescriptionSchema,
  updateDoctorProfileSchema,
} from './doctor.schema';

const router = Router();

router.use(authenticate, authorize('DOCTOR'));

router.get('/profile', doctorController.getProfile.bind(doctorController));
router.put('/profile', validate(updateDoctorProfileSchema), doctorController.updateProfile.bind(doctorController));

router.get('/patients', doctorController.getAssignedPatients.bind(doctorController));
router.get('/patients/:patientId', doctorController.getPatientDetail.bind(doctorController));

router.post('/patients/:patientId/notes', validate(createDoctorNoteSchema), doctorController.addNote.bind(doctorController));
router.post('/patients/:patientId/prescription', validate(createPrescriptionSchema), doctorController.addPrescription.bind(doctorController));

router.get('/appointments', doctorController.getAppointments.bind(doctorController));
router.patch('/appointments/:appointmentId/status', doctorController.updateStatus.bind(doctorController));

export default router;
