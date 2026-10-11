# REST API Reference Specification

Base URL: `http://localhost:5000/api/v1`

---

## 1. Conventions & Response Format

### Authentication Header
Protected endpoints require an `Authorization` header containing the Bearer access token:
```http
Authorization: Bearer <jwt_access_token>
```

### Standard Response Envelope
All API endpoints follow a consistent JSON response structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

In the event of an error:
```json
{
  "success": false,
  "message": "Detailed error explanation",
  "error": "ERROR_CODE"
}
```

---

## 2. Authentication API (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new `PATIENT` or `DOCTOR`. |
| `POST` | `/auth/login` | Public | Authenticate user, returns access token + sets HTTP-only refresh cookie. |
| `POST` | `/auth/refresh` | Public | Rotates refresh token and issues fresh access token. |
| `POST` | `/auth/logout` | Authenticated | Revokes refresh token in Redis and clears session cookie. |
| `GET` | `/auth/verify-email/:token` | Public | Validates email confirmation token. |
| `POST` | `/auth/forgot-password` | Public | Sends password reset email link with secure single-use token. |
| `POST` | `/auth/reset-password` | Public | Resets password using verification token. |
| `GET` | `/auth/me` | Authenticated | Returns currently authenticated user context. |

### Register Payload Example
```json
{
  "email": "doctor.smith@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "licenseNumber": "MD-883719",
  "experienceYears": 12,
  "hospital": "Metropolitan Heart Center"
}
```

---

## 3. Patient API (`/api/v1/patient`)

Role Required: `PATIENT`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/patient/profile` | Fetches personal health record profile and emergency contacts. |
| `PUT` | `/patient/profile` | Updates personal demographics, blood group, allergies, conditions. |
| `GET` | `/patient/medical-history` | Paginated list of diagnosed chronic or acute medical conditions. |
| `POST` | `/patient/medical-history` | Add condition, severity, onset date, and ongoing medications. |
| `DELETE`| `/patient/medical-history/:id` | Remove a medical history entry. |
| `GET` | `/patient/documents` | List uploaded lab reports, DICOM scans, or medical documents. |
| `POST` | `/patient/documents/upload` | Upload document (`multipart/form-data`, file key: `file`). |
| `DELETE`| `/patient/documents/:id` | Delete document from database and object storage. |
| `GET` | `/patient/consultations` | Get previous AI consultations and summary reports. |
| `GET` | `/patient/reports/:id` | Get specific AI consultation clinical summary. |
| `GET` | `/patient/prescriptions` | Retrieve all doctor-issued prescriptions with medications and dosage. |

---

## 4. Doctor API (`/api/v1/doctor`)

Role Required: `DOCTOR`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/doctor/dashboard` | Returns doctor KPIs: today's appointments, total patients, pending tasks. |
| `GET` | `/doctor/profile` | Doctor biography, qualifications, fees, and verification status. |
| `PUT` | `/doctor/profile` | Update bio, consultation fees, and hospital affiliations. |
| `GET` | `/doctor/availability` | Fetch weekly schedule slots (Monday to Sunday). |
| `PUT` | `/doctor/availability` | Update working time ranges and break intervals. |
| `GET` | `/doctor/appointments` | List all scheduled, completed, and cancelled appointments. |
| `PATCH`| `/doctor/appointments/:id/status` | Update status (`CONFIRMED`, `COMPLETED`, `CANCELLED`). |
| `GET` | `/doctor/patients` | List of patients who have booked or completed visits with this doctor. |
| `GET` | `/doctor/patients/:id` | In-depth patient record: history, uploaded docs, and past prescriptions. |
| `POST` | `/doctor/prescriptions` | Issue a digital prescription with medications, instructions, and dates. |

### Issue Prescription Payload Example
```json
{
  "patientId": "cm1abcdefg000008l01",
  "appointmentId": "cm1hijklmn000108l02",
  "diagnosis": "Acute Bronchitis with mild wheezing",
  "careInstructions": "Drink plenty of warm fluids, rest for 3 days, avoid cold exposure.",
  "validUntil": "2026-11-05T00:00:00.000Z",
  "followUpDate": "2026-10-15T00:00:00.000Z",
  "medications": [
    {
      "name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "Three times a day",
      "duration": "7 days",
      "instructions": "Take after meals"
    },
    {
      "name": "Levocetirizine",
      "dosage": "5mg",
      "frequency": "Once daily at bedtime",
      "duration": "5 days",
      "instructions": "May cause drowsiness"
    }
  ]
}
```

---

## 5. Appointments API (`/api/v1/appointments`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/appointments/doctors` | Authenticated | Search doctors by name, specialty, and location. |
| `GET` | `/appointments/doctors/:id` | Authenticated | View doctor profile and rating metrics. |
| `GET` | `/appointments/doctors/:id/slots?date=YYYY-MM-DD` | Authenticated | View available 30-min time slots for date. |
| `POST` | `/appointments/book` | `PATIENT` | Book consultation slot and link optional AI consultation. |
| `GET` | `/appointments/my` | `PATIENT` | Fetch list of booked appointments with doctor & Rx data. |
| `PATCH`| `/appointments/:id/cancel` | `PATIENT` / `DOCTOR` | Cancel appointment with cancellation reason. |

---

## 6. AI Consultation API (`/api/v1/ai`)

Role Required: `PATIENT`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/ai/consultation/start` | Initiates new LangGraph clinical consultation session. |
| `POST` | `/ai/consultation/:id/message` | Sends patient response and streams back clinical follow-ups. |
| `POST` | `/ai/consultation/:id/finalize`| Completes session and triggers differential diagnostic analysis. |
| `GET` | `/ai/consultation/:id/report` | Returns JSON summary, differential diagnosis, and risk score. |
| `GET` | `/ai/consultation/:id/report/pdf` | Streams formatted PDF report directly with medical disclaimer. |

---

## 7. Real-Time Chat API (`/api/v1/chat`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/chat/rooms` | Authenticated | Returns all active chat rooms for current user. |
| `GET` | `/chat/rooms/:id/messages` | Authenticated | Fetches chat history for specified room. |
| `POST` | `/chat/rooms/:id/messages` | Authenticated | Fallback HTTP endpoint for sending chat messages. |

---

## 8. Admin API (`/api/v1/admin`)

Role Required: `ADMIN`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/stats` | System metrics: registered users, completed appointments, reports. |
| `GET` | `/admin/users` | List users with filtering by role and active status. |
| `PATCH`| `/admin/users/:id/status` | Activate or suspend user accounts. |
| `GET` | `/admin/doctors/pending` | Doctors awaiting credential and license verification. |
| `PATCH`| `/admin/doctors/:id/verify` | Approve or reject doctor verification request. |
| `GET` | `/admin/audit-logs` | Comprehensive security audit log inspection with IP/User Agent tracking. |
