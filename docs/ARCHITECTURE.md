# System Architecture & Design

This document details the architectural layout, data flow, component interactions, and multi-agent AI pipeline of the **DocAI** platform.

---

## 1. High-Level System Architecture

The application is structured into a modern decoupled architecture:
1. **Frontend Client:** React 19 SPA running on Vite with TypeScript, Tailwind CSS, and TanStack Query.
2. **Backend API Gateway:** Express.js REST API with Socket.IO real-time server, Zod validations, and JWT authentication.
3. **Data & Cache Layer:** PostgreSQL (via Prisma ORM) and Redis (Upstash Redis) for token blocklisting, caching, and rate limiting.
4. **AI & Intelligence Engine:** Mistral AI combined with LangGraph state workflows and Qdrant vector database for Retrieval-Augmented Generation (RAG).
5. **Storage & Documents:** MinIO / AWS S3 object store with on-the-fly dynamic PDF generation fallback.

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client Layer (Vite + React 19)"]
        UI_Patient["Patient Portal\n(Dashboard, Appointments, AI Chat, Rx)"]
        UI_Doctor["Doctor Portal\n(Patients, Consultations, Rx Issuance)"]
        UI_Admin["Admin Portal\n(Analytics, Audit Logs, Verification)"]
    end

    subgraph GatewayLayer["Gateway & Real-time Layer (Node.js / Express)"]
        ReverseProxy["Nginx Reverse Proxy / Load Balancer (:80 / :443)"]
        ExpressAPI["Express API Server (:5000)"]
        SocketServer["Socket.IO Server (:5000)\nReal-time Doctor-Patient Chat"]
        AuthMiddleware["JWT Auth & Role Guard\n(Patient / Doctor / Admin)"]
        RateLimiter["Rate Limiter\n(Upstash Redis Store)"]
    end

    subgraph ServiceLayer["Core Domain Services"]
        AuthSvc["Auth & Audit Service"]
        PatientSvc["Patient & Medical History Service"]
        DoctorSvc["Doctor & Availability Service"]
        ApptSvc["Appointment Booking Service"]
        AISvc["AI Consultation & Report Service"]
        ChatSvc["Chat & Messaging Service"]
        StorageSvc["Storage & PDF Generator Service"]
    end

    subgraph IntelligenceLayer["AI & Vector Search Engine"]
        MistralAI["Mistral AI API\n(mistral-large-latest / open-mistral-7b)"]
        LangGraph["LangGraph State Machine\n(Symptom Intake -> Analysis -> Diagnosis -> Triage)"]
        Qdrant["Qdrant Vector Database\n('medical_documents' Collection)"]
        PythonOCR["FastAPI Microservice (:8000)\n(PyTesseract OCR & PyPDF Parser)"]
    end

    subgraph PersistenceLayer["Data & Persistence Layer"]
        PostgresDB[("PostgreSQL Database\n(Prisma ORM - Neon / Local)")]
        RedisStore[("Upstash Redis Cache\n(Token Store, Rate Limiting)")]
        MinIOStore[("MinIO / S3 Object Storage\n(Lab Reports, Patient Docs)")]
    end

    %% Connections
    ClientLayer -->|HTTPS / WSS| ReverseProxy
    ReverseProxy --> ExpressAPI
    ReverseProxy --> SocketServer

    ExpressAPI --> AuthMiddleware
    AuthMiddleware --> RateLimiter
    RateLimiter --> ServiceLayer

    ServiceLayer --> PostgresDB
    ServiceLayer --> RedisStore
    ServiceLayer --> MinIOStore

    AISvc --> LangGraph
    LangGraph --> MistralAI
    LangGraph --> Qdrant
    StorageSvc --> PythonOCR
    SocketServer --> ChatSvc
```

---

## 2. LangGraph AI Consultation Lifecycle

The consultation engine uses a directed state graph powered by **LangGraph** and **Mistral AI** to mimic a clinical interview:

```mermaid
stateDiagram-v2
    [*] --> SymptomIntake: Patient initiates chat & shares symptoms
    
    SymptomIntake --> EmergencyCheck: Evaluate red-flag keywords
    EmergencyCheck --> EmergencyEscalation: Red flag detected (e.g., chest pain, stroke symptoms)
    EmergencyEscalation --> [*]: Display immediate 911 / ER alert banner

    EmergencyCheck --> DeepQuestioning: Symptoms safe for interview
    DeepQuestioning --> ContextRetrieval: Patient answers questions (duration, severity)
    
    ContextRetrieval --> DifferentialAnalysis: RAG vector retrieval from Qdrant & Medical DB
    DifferentialAnalysis --> DoctorReviewRecommendation: Generate structured differential diagnosis & confidence score
    
    DoctorReviewRecommendation --> ReportGeneration: Consultation finalized
    ReportGeneration --> [*]: PDF Report synthesized with Disclaimer & Doctor referral
```

### Agent Nodes Explained
1. **Intake Node:** Collects chief complaints and extracts clinical entities (onset, severity, body location).
2. **Emergency Node:** Scans input against a clinical list of red-flag keywords (`chest pain`, `shortness of breath`, `thunderclap headache`, `loss of consciousness`).
3. **Questioning Node:** Dynamically formulates up to 3 targeted follow-up questions to gather differential context.
4. **RAG Retrieval Node:** Searches Qdrant collection `medical_documents` for vector similarity against peer-reviewed medical guidance; falls back gracefully to internal medical knowledge if vector connection is unreachable.
5. **Report Generation Node:** Synthesizes structured JSON containing summary, possible conditions, risk score, recommended doctor specialties, and medication suggestions.

---

## 3. Real-Time Chat & Consultation Sequence

Real-time interactions between patient and doctor utilize **Socket.IO** with dual persistence in PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Frontend as Patient UI (React)
    participant Server as Socket.IO / Express API
    participant DB as PostgreSQL (Prisma)
    participant DoctorUI as Doctor UI (React)
    actor Doctor

    DoctorUI->>Server: join_room(chatRoomId)
    Frontend->>Server: join_room(chatRoomId)
    
    Patient->>Frontend: Type message & press send
    Frontend->>Server: send_message({ chatRoomId, content })
    Server->>DB: INSERT into messages (senderId, chatRoomId, content)
    Server-->>DoctorUI: receive_message(savedMessage)
    Server-->>Frontend: message_sent_ack(savedMessage)
    
    Doctor->>DoctorUI: View message & respond with advice / Rx
    DoctorUI->>Server: send_message({ chatRoomId, content })
    Server->>DB: INSERT into messages (senderId, chatRoomId, content)
    Server-->>Frontend: receive_message(savedMessage)
```

---

## 4. Prescription & Appointment Flow

```mermaid
flowchart LR
    A[Patient books appointment] --> B[Doctor receives notification]
    B --> C[Consultation completed]
    C --> D[Doctor issues prescription via Patient Detail Page]
    D --> E[Prescription saved to DB with Doctor & Patient linkage]
    E --> F[Patient views Rx in Dashboard, Prescriptions Page & My Bookings]
    F --> G[Patient prints or exports prescription]
```

---

## 5. Storage & On-the-Fly Document Pipeline

To ensure 100% operational reliability even when third-party object storage (MinIO or S3) is offline or undergoing maintenance:
- If MinIO is reachable: Files and reports are streamed directly to the designated S3 bucket.
- If MinIO is unreachable: The application automatically triggers **Dynamic On-the-Fly Generation** via `pdfkit` and streams formatted medical PDFs directly into the browser HTTP response with `Content-Type: application/pdf` and `Content-Disposition: inline`.
