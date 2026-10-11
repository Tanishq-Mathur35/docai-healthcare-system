<div align="center">

  <img src="https://avatars.githubusercontent.com/u/74301323?s=200&v=4" width="90" height="90" alt="Upstash" style="border-radius: 20px; box-shadow: 0 8px 24px rgba(0, 233, 163, 0.25);" />
  
  # 🏥 DocAI — Autonomous Healthcare & Clinical AI Suite

  <p align="center">
    <strong>Enterprise-Grade AI Doctor–Patient Consultation Platform, Real-Time Messaging & OPD Decision-Support System</strong>
  </p>

  <p align="center">
    <a href="#-key-features">Key Features</a> •
    <a href="#-clinical-ai-workstations-t01--t04">Clinical AI Suite</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-seed-credentials">Demo Accounts</a>
  </p>

  <!-- Badges Row 1: Frontend & Language -->
  <p align="center">
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>

  <!-- Badges Row 2: Backend, DB & Realtime -->
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js_20-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  </p>

  <!-- Badges Row 3: Cloud & AI Core -->
  <p align="center">
    <img src="https://img.shields.io/badge/Upstash_Redis-00E9A3?style=for-the-badge&logo=upstash&logoColor=000000" alt="Upstash Redis" />
    <img src="https://img.shields.io/badge/Google_Gemini_Flash-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Qdrant_Vector_DB-DC2626?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
  </p>

</div>

---

## 📖 Executive Summary

**DocAI** is a comprehensive, production-grade telemedicine and clinical management ecosystem engineered to bridge the operational gap between busy outpatient physicians and patients.

It combines **Google Gemini Flash multimodal vision**, **Upstash Serverless Redis caching**, **LangGraph multi-agent diagnostic interview graphs**, and **Socket.IO bidirectional messaging** to automate pre-consultation intake, laboratory interpretation, and family discharge routines.

---

## ⚡ High-Performance Infrastructure Powered by Upstash

<div align="center">
  <table>
    <tr>
      <td width="30%" align="center">
        <img src="https://avatars.githubusercontent.com/u/74301323?s=160&v=4" width="80" alt="Upstash Redis" />
        <br />
        <strong>Upstash Serverless Redis</strong>
      </td>
      <td width="70%">
        <ul>
          <li><strong>Ultra-Low Latency Token Verification:</strong> Secure rotation of Refresh Tokens with zero-cold-start performance.</li>
          <li><strong>Distributed Rate Limiting:</strong> Enforces medical API request throttling via Redis Token Buckets across patient and doctor clusters.</li>
          <li><strong>Real-Time Session Synchrony:</strong> Instantaneous coordination of Socket.IO user presence and notification channels.</li>
        </ul>
      </td>
    </tr>
  </table>
</div>

---

## 🔬 Specialized Clinical AI Workstations (T01 – T04)

Developed specifically to solve ground realities in high-volume hospitals and outpatient departments (OPDs):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DocAI Clinical Workstations                           │
├─────────────────────┬─────────────────────┬─────────────────────┬───────────────┤
│         T01         │         T02         │         T03         │      T04      │
│  The Two-Minute     │   Report, Decoded   │  Going Home Right   │ Bol Ke Batao  │
│      Doctor         │                     │                     │ (बोल के बताओ) │
├─────────────────────┼─────────────────────┼─────────────────────┼───────────────┤
│ 60-Sec OPD Briefing │ Rule-Based Lab Test │ Discharge Summary   │ Multilingual  │
│ & Paperwork Timeline│ Plain Translation   │ to Family Schedule  │ Voice History │
│ • No Diagnosis      │ • In/Out Rule Range │ • OD/BD/SOS Decoded │ • Hindi/Marwari│
│ • Allergy Detection │ • Doctor Questions  │ • Nurse Sign-Off    │ • Exact Quote │
│ • Contradiction Gap │ • Refuses Medical Dx│ • Red Warning Card  │   Traceability│
└─────────────────────┴─────────────────────┴─────────────────────┴───────────────┘
```

### 1. `T01 · /two-minute-doctor` — The Two-Minute Doctor

- **The Scenario:** In a crowded OPD with 140+ patients waiting, an attending physician has 60 seconds per patient. Patients arrive with crumpled prescriptions from three clinics, outdated lab slips, and blurry phone photos.
- **The Solution:** An AI Pre-Consultation Assistant that reads paperwork via Gemini Multimodal OCR and synthesizes a **60-second chronological timeline**, surfaces **critical penicillin / NSAID allergies**, and flags contradictions between patient memory and prior prescription records.
- **Clinical Guardrail:** Strictly source-linked triage facts; **strictly no diagnostic conclusions**.

### 2. `T02 · /report-decoded` — Report, Decoded

- **The Scenario:** Patients receive blood reports with confusing abbreviations (SGPT, HbA1c, TSH) and alarming bold "H" or "L" flags, causing panic before their doctor appointment.
- **The Solution:** Translates lab sheets into plain-language parameter cards explaining physiological function in everyday terms and providing constructive questions to bring to the physician.
- **Clinical Guardrail:** Parameter status (High / Low / Normal) is evaluated using **deterministic mathematical rules**, never AI speculation. Refuses diagnostic questions.

### 3. `T03 · /going-home-right` — Going Home Right

- **The Scenario:** Hospital discharge summaries filled with shorthand (`Tab Metoprolol 25 BD PC`, `Tab Sorbitrate SOS`) cause families to miss or double doses at home.
- **The Solution:** Converts discharge summaries into a clean **Morning (सुबह), Afternoon (दोपहर), Night (रात), and SOS** schedule for the refrigerator, decoding clinical abbreviations (`OD`, `BD`, `TDS`, `SOS`, `AC`, `PC`, `HS`).
- **Clinical Guardrail:** Any ambiguous or illegible instruction is tagged with `⚠️ Flagged for Hospital Nurse Sign-Off (Do Not Guess!)`. Includes condition-specific emergency warning cards.

### 4. `T04 · /bol-ke-batao` — Bol Ke Batao (बोल के बताओ)

- **The Scenario:** Language barriers between rural patients (speaking Marwari or Hindi dialects) and non-native resident doctors lead to symptoms being lost in translation (e.g. nocturnal burning, dizziness).
- **The Solution:** A multilingual voice intake assistant that listens to Hindi, Hinglish, and Marwari speech and generates a structured clinical English history.
- **Clinical Guardrail:** **Every single English observation maps back to the patient's verbatim spoken quote** (e.g., _"raat ko zyada hoti hai"_ $\rightarrow$ Nocturnal worsening). Clinician review & sign-off mode before EHR filing.

---

## 💬 Real-Time Doctor–Patient Chat & Telehealth

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant React as Patient UI (React 19)
    participant Socket as Socket.IO Server (Port 5000)
    participant DB as PostgreSQL + Upstash Redis
    actor Doctor

    Patient->>React: Types medical query
    React->>Socket: emit('typing', { roomId, isTyping: true })
    Socket-->>Doctor: Animated typing indicator (● ● ● typing)
    Patient->>React: Sends message
    React->>DB: POST /api/v1/chat/rooms/:id/messages (Persisted)
    DB->>Socket: io.to('room:id').emit('new_message')
    Socket-->>Doctor: Real-time message bubble rendered
    Doctor->>Socket: Issues Prescription
    Socket-->>Patient: Chime Notification + Sound Alert Badge
```

- **Instantaneous Socket Sync:** Dedicated `room:${roomId}` channels for every consultation.
- **Presence & Typing Indicator:** Real-time feedback with 2-second debounce auto-clearing.
- **Prescription Notification Chimes:** Real-time notification bells mounted on the patient layout alerting them when digital medicines are signed by their doctor.

---

## 🎨 Dual-Persona Interface Design

DocAI features two completely differentiated, bespoke UI environments:

| Feature               | 🩺 Doctor Clinical Workstation                             | 💙 Patient Comfort Portal                                    |
| :-------------------- | :--------------------------------------------------------- | :----------------------------------------------------------- |
| **Theme & Aesthetic** | Hospital-grade Dark Slate (`#070D1E`, Navy & Teal)         | Warm, reassuring Light Sky (`#F8FAFC`, Sky Blue & Emerald)   |
| **Focus**             | Information density, EHR charts, SOAP notes, analytics     | Calm readability, symptom assistance, family scheduling      |
| **Navigation**        | Fixed collapsible clinical sidebar with duty toggle        | Mobile-first rounded navigation bar with emergency hotline   |
| **Key Views**         | Priority triage queue, appointment manager, digital Rx pad | AI health assistant, lab decoders, interactive medicine pads |

---

## 🛠️ Complete Tech Stack

```bash
DocAI Tech Stack
│
├── Frontend (d:/Doctor - Patient/frontend)
│   ├── Framework: React 19 + Vite 5 + TypeScript
│   ├── Styling: Tailwind CSS + shadcn/ui + Lucide Icons + Framer Motion
│   ├── State & Data: Zustand + TanStack Query v5 + Axios
│   ├── Analytics: Recharts
│   └── Realtime: Socket.IO Client + Web Speech API (hi-IN)
│
├── Backend (d:/Doctor - Patient/backend)
│   ├── Runtime: Node.js 20 LTS + Express + TypeScript
│   ├── ORM & Database: Prisma ORM + PostgreSQL (Neon Cloud / Local)
│   ├── Cache & Rate Limit: Upstash Serverless Redis
│   ├── Realtime Server: Socket.IO Server (JWT Handshake Authenticated)
│   ├── Authentication: Dual JWT (15m Access Token + 7d Rotating Refresh Token)
│   └── Security: Helmet, CORS, Express Rate Limit, Zod Validation
│
├── AI & Intelligence Core
│   ├── Multi-Provider Gateway: Google Gemini Flash (Multimodal OCR), Groq Llama 3.3, Mistral AI
│   ├── Search Fallback: Tavily AI Medical Literature Retrieval
│   └── Vector Storage: Qdrant Cloud Hybrid Vector Database (384-dim embeddings)
│
└── Python Microservice (d:/Doctor - Patient/python-service)
    ├── Framework: FastAPI + Uvicorn
    ├── Optical Character Recognition: EasyOCR + Tesseract OCR + PyPDF
    └── Embeddings: Sentence Transformers (all-MiniLM-L6-v2) + PyTorch
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20+ LTS)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/) (Optional, for full containerization)

### 2. Clone and Configure Environment

```bash
git clone https://github.com/Tanishq-Mathur35/docai-healthcare-system.git
cd docai-healthcare-system
```

Copy and update the `.env` templates:

```bash
# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Ensure your `backend/.env` has your database and API keys:

```env
DATABASE_URL=postgresql://user:pass@ep-host.aws.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:token@romantic-swift-194769.upstash.io:6379
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### 3. Install & Start Development Servers

```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev

# Terminal 2: Frontend Web Client (Port 3000)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seed Demo Accounts

Use these pre-configured credentials to explore the system:

| Persona              | Email               | Password         | Primary Role & Views                                        |
| :------------------- | :------------------ | :--------------- | :---------------------------------------------------------- |
| **Attending Doctor** | `doctor@docai.com`  | `Doctor@123456`  | Hospital Workstation, Patient EHRs, Rx Signing, OPD Summary |
| **Patient**          | `patient@docai.com` | `Patient@123456` | Booking, Lab Decoder, Voice Intake, Discharge Care Plan     |
| **Hospital Admin**   | `admin@docai.com`   | `Admin@123456`   | Audit Logs, License Verifications, System Analytics         |

---

## ⚖️ Medical & Safety Disclaimer

> **IMPORTANT CLINICAL NOTICE:**  
> DocAI is an auxiliary clinical decision-support and communication aid for licensed physicians and patients. It does **NOT** provide definitive automated medical diagnoses or dispense pharmaceuticals without qualified human authorization. In situations involving acute chest pain, shortness of breath, sudden neurological deficits, or severe trauma, users are directed immediately to hospital emergency services (dial 112 / 108).

---

<div align="center">
  <sub>Built with care for doctors, patients, and healthcare workers. Powered by Upstash Redis & Google Gemini.</sub>
</div>
