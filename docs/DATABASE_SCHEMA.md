# Database Schema & Entity-Relationship Model

The application utilizes **PostgreSQL** managed through **Prisma ORM**.

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o| Patient : "has profile"
    User ||--o| Doctor : "has profile"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "initiates"

    Patient ||--o{ MedicalHistory : "records"
    Patient ||--o{ Document : "uploads"
    Patient ||--o{ Appointment : "books"
    Patient ||--o{ Consultation : "undergoes"
    Patient ||--o{ Prescription : "receives"
    Patient ||--o{ ChatRoom : "participates in"

    Doctor ||--o{ Availability : "defines"
    Doctor ||--o{ Appointment : "conducts"
    Doctor ||--o{ Prescription : "issues"
    Doctor ||--o{ ChatRoom : "participates in"

    Appointment ||--o| Consultation : "associated with"
    Appointment ||--o| Prescription : "linked to"

    Consultation ||--o{ ConsultationMessage : "contains"
    Consultation ||--o| Report : "generates"

    ChatRoom ||--o{ Message : "contains"

    User {
        string id PK
        string email UK
        string passwordHash
        Role role
        string firstName
        string lastName
        string phone
        string avatarUrl
        boolean isEmailVerified
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Patient {
        string id PK
        string userId FK
        int age
        datetime dateOfBirth
        Gender gender
        BloodGroup bloodGroup
        string[] allergies
        string[] chronicDiseases
        string emergencyContactName
        string emergencyContactPhone
    }

    Doctor {
        string id PK
        string userId FK
        string specialization
        string licenseNumber UK
        int experienceYears
        string hospital
        float consultationFee
        boolean isVerified
        boolean isAvailable
        float rating
        int totalRatings
    }

    Appointment {
        string id PK
        string patientId FK
        string doctorId FK
        string consultationId FK
        datetime appointmentDate
        string slotStart
        string slotEnd
        AppointmentStatus status
        AppointmentType type
        string chiefComplaint
        float fee
    }

    Prescription {
        string id PK
        string doctorId FK
        string patientId FK
        string appointmentId FK
        string diagnosis
        json medications
        string careInstructions
        datetime validUntil
        datetime followUpDate
        datetime createdAt
    }

    Consultation {
        string id PK
        string patientId FK
        string chiefComplaint
        ConsultationStatus status
        datetime startedAt
        datetime completedAt
    }

    Report {
        string id PK
        string consultationId FK
        string patientId FK
        RiskLevel riskLevel
        float confidenceScore
        json possibleConditions
        json recommendedSpecialties
        json suggestedMedications
        string summary
        string reportUrl
        datetime generatedAt
    }

    ChatRoom {
        string id PK
        string patientId FK
        string doctorId FK
        ChatRoomType type
        datetime createdAt
    }

    Message {
        string id PK
        string chatRoomId FK
        string senderId FK
        string content
        boolean isRead
        datetime createdAt
    }
```

---

## 2. Key Enums

| Enum | Possible Values | Description |
| :--- | :--- | :--- |
| `Role` | `PATIENT`, `DOCTOR`, `ADMIN` | User access level across the platform. |
| `Gender` | `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY` | Patient biological/identified gender. |
| `BloodGroup` | `A_POSITIVE`, `A_NEGATIVE`, `B_POSITIVE`, `B_NEGATIVE`, `AB_POSITIVE`, `AB_NEGATIVE`, `O_POSITIVE`, `O_NEGATIVE`, `UNKNOWN` | Blood group identification. |
| `AppointmentStatus` | `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` | Current state of doctor booking. |
| `AppointmentType` | `IN_PERSON`, `ONLINE_VIDEO`, `PHONE` | Consultation medium. |
| `RiskLevel` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | AI triage classification. |
| `ConditionType` | `CHRONIC`, `ACUTE`, `SURGERY`, `ALLERGY`, `GENETIC`, `OTHER` | Category in medical history. |
| `Severity` | `MILD`, `MODERATE`, `SEVERE`, `CRITICAL` | Patient condition intensity. |
| `DocumentType` | `PRESCRIPTION`, `LAB_REPORT`, `IMAGING_XRAY`, `IMAGING_MRI`, `IMAGING_CT`, `DISCHARGE_SUMMARY`, `OTHER` | Categorization for uploaded records. |
| `AuditAction` | `USER_REGISTERED`, `USER_LOGIN`, `USER_LOGOUT`, `APPOINTMENT_BOOKED`, `CONSULTATION_STARTED`, `REPORT_GENERATED`, etc. | Security audit event types. |

---

## 3. Database Indexing Strategy

1. **User Table:**
   - Unique Index on `email`.
   - Index on `role` and `isActive` for swift filtering during admin operations.
2. **Appointment Table:**
   - Composite index on `[doctorId, appointmentDate, slotStart]` ensuring rapid slot lookup and avoiding double-booking collisions.
   - Index on `patientId` for fast retrieval of patient consultation history.
3. **Prescription Table:**
   - Index on `patientId` and `createdAt` to support quick dashboard rendering of recent medication plans.
   - Index on `appointmentId` to link prescriptions with specific consultation sessions.
4. **Chat & Message Tables:**
   - Index on `[chatRoomId, createdAt]` to paginate message histories in milliseconds.
