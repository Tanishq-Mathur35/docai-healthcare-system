import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { bookAppointmentSchema, cancelAppointmentSchema, searchDoctorsSchema } from './appointment.schema';

const router = Router();

router.use(authenticate);

// Search & Slots
router.get('/doctors/search', validate(searchDoctorsSchema, 'query'), appointmentController.searchDoctors.bind(appointmentController));
router.get('/doctors/:doctorId/slots', appointmentController.getSlots.bind(appointmentController));

// Patient Appointment operations
router.post('/', validate(bookAppointmentSchema), appointmentController.book.bind(appointmentController));
router.get('/me', appointmentController.getMyAppointments.bind(appointmentController));
router.patch('/:id/cancel', validate(cancelAppointmentSchema), appointmentController.cancel.bind(appointmentController));

export default router;
