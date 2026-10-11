# DocAI — AI Doctor-Patient Consultation & Appointment System

An enterprise-grade, full-stack AI healthcare platform combining multi-agent clinical diagnostic interviews (powered by **LangGraph** and **Mistral AI**), hybrid **RAG** vector search (powered by **Qdrant**), an autonomous **FastAPI** medical computer vision/OCR microservice, appointment management, doctor clinical portals, and real-time HIPAA-compliant communication.

---

## Architecture Overview

```
                                  ┌───────────────────────────────┐
                                  │      Client Applications      │
                                  │   (React 19 / TypeScript)     │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │      Nginx Reverse Proxy      │
                                  │  (SSL, WebSockets, Load Bal)  │
                                  └───────┬───────────────┬───────┘
                                          │               │
                     ┌────────────────────┘               └──────────────────┐
                     ▼                                                       ▼
        ┌─────────────────────────┐                            ┌───────────────────────────┐
        │   Backend API Gateway   │                            │  FastAPI ML Microservice  │
        │  Node.js 20 / Express   │                            │   Python 3.11 / PyTorch   │
        └────────────┬────────────┘                            └─────────────┬─────────────┘
                     │                                                       │
      ┌──────────────┼──────────────┬──────────────┐                         │
      ▼              ▼              ▼              ▼                         │
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│PostgreSQL │  │   Redis   │  │   MinIO   │  │  Qdrant   │◄──────────────────┘
│ Prisma ORM│  │Token Store│  │ S3 Storage│  │Vector RAG │ (384-dim Embeddings)
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

---

## Tech Stack

| Layer                       | Technologies                                                                                                                            |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**                | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, Axios, Recharts, Socket.IO Client                      |
| **Backend API**             | Node.js 20, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, JWT (Access & Rotating Refresh), Zod, Helmet, Winston, Socket.IO Server |
| **AI / Diagnostic Core**    | LangChain JS, LangGraph JS (`StateGraph`), Mistral AI (`mistral-small-latest`), Tavily Medical Search Fallback                          |
| **Python Microservice**     | FastAPI, EasyOCR, Tesseract OCR, PyPDF, Sentence Transformers (`all-MiniLM-L6-v2`, 384 dimensions), Torch                               |
| **Vector Store & Storage**  | Qdrant Hybrid RAG (`medical_documents`), MinIO / AWS S3 (`doctor-patient-files`)                                                        |
| **DevOps & Infrastructure** | Docker, Docker Compose, Nginx, GitHub Actions CI/CD, Jest, Pytest                                                                       |

---

## Key Features

1. **Intelligent LangGraph Consultation Engine:**
   - Multi-stage diagnostic interview: red-flag emergency check, patient context retrieval, dynamic LLM question generation (no hardcoded questionnaires), sufficiency evaluation, and report synthesis.
   - Medical safety triage: Immediate escalation on red-flag keywords (chest pain, stroke, breathing distress, etc.).
   - Tavily medical literature retrieval triggered dynamically when AI diagnostic confidence drops below 75%.
2. **Hybrid RAG Medical Memory:**
   - Vector indexing in Qdrant of past prescriptions, lab tests, and clinical diagnoses.
   - Sidebar of historical conditions asking: _"Is your current consultation related to past condition X?"_ If confirmed, relevant clinical history is retrieved to steer diagnostic inquiry.
3. **Automated Clinical Reports:**
   - Generates comprehensive PDF + JSON clinical summaries containing chief complaints, triage risk rating, differential conditions with probabilities, recommended tests, OTC suggestions, precautions, and referral notes.
4. **Physician Portal & Clinical Charts:**
   - View assigned patient rosters with strict data isolation.
   - Comprehensive patient chart: AI reports, documented history, uploaded radiology scans, and laboratory reports.
   - Integrated SOAP clinical note generator and multi-drug prescription writer.
5. **Appointment Booking Engine:**
   - Search doctors by specialty, ratings, location, and fees.
   - Dynamic real-time slot calendar for online telehealth and in-person consultations.
6. **Administrator Control Center & Analytics:**
   - System KPIs and monthly throughput graphing with Recharts.
   - User account activation controls and physician license credential verification.
   - Disease prevalence tracking, triage risk distribution, and AI confidence calibration histograms.
   - Immutable security audit log stream tracking all data access.
7. **Real-Time Doctor-Patient Chat:**
   - Encrypted two-way messaging powered by Socket.IO with typing indicators and persistent storage.

---

## Quick Start (Docker Compose)

### 1. Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) (v24.0+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.20+)
- A [Groq API Key](https://console.groq.com/) and [Tavily API Key](https://tavily.com/)

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
# AI Provider Keys
GROQ_API_KEY=gsk_your_groq_api_key_here
TAVILY_API_KEY=tvly-your_tavily_api_key_here

# Security Secrets (Must be at least 32 characters)
JWT_ACCESS_SECRET=your_super_secret_jwt_access_token_key_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_token_key_32_chars
PYTHON_SERVICE_TOKEN=supersecretinternaltoken123

# Database & Infrastructure Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_DB=doctor_patient_db
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadminpassword
```

### 3. Launch the Complete Cluster

Run the following command in the root directory:

```bash
docker compose up --build -d
```

### 4. Initialize Database Schema & Seed Data

Once the containers are healthy, execute the Prisma migration and seed script:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed
```

### 5. Access the Services

| Service              | URL                               | Default Credentials                 |
| :------------------- | :-------------------------------- | :---------------------------------- |
| **Web Application**  | `http://localhost`                | Demo accounts below                 |
| **Backend REST API** | `http://localhost/api/v1`         | Bearer Token auth                   |
| **MinIO Console**    | `http://localhost:9001`           | `minioadmin` / `minioadminpassword` |
| **Qdrant Dashboard** | `http://localhost:6333/dashboard` | None                                |
| **Python ML Docs**   | `http://localhost:8000/docs`      | Swagger UI                          |

---

## Seed Accounts

| Role        | Email               | Password         |
| :---------- | :------------------ | :--------------- |
| **Patient** | `patient@docai.com` | `Patient@123456` |
| **Doctor**  | `doctor@docai.com`  | `Doctor@123456`  |
| **Admin**   | `admin@docai.com`   | `Admin@123456`   |

---

## Local Development (Without Full Docker)

If you prefer running services directly on your host machine:

```bash
# 1. Start backing services (Postgres, Redis, MinIO, Qdrant)
docker compose -f docker-compose.dev.yml up -d

# 2. Run Python Microservice
cd python-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Run Backend API
cd ../backend
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev

# 4. Run Frontend Client
cd ../frontend
npm install
npm run dev
```

---

## Automated Testing

### Backend Unit & Integration Tests

```bash
cd backend
npm test
```

### Python Microservice Tests

```bash
cd python-service
pytest tests/
```

---

## Medical Disclaimer

> **IMPORTANT:** DocAI is an auxiliary clinical decision-support and patient triage system. It does **NOT** provide definitive medical diagnoses or prescribe medications without licensed human physician authorization. In cases of acute pain, shortness of breath, severe trauma, or signs of stroke, users are escalated immediately to local emergency services.
