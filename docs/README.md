# DocAI — System Documentation

Welcome to the comprehensive technical documentation for the **DocAI** Doctor-Patient Consultation and Management Platform.

---

## 📚 Documentation Index

| Document                                                     | Description                                                                                                                                              |
| :----------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**1. System Architecture**](./ARCHITECTURE.md)              | High-level system design, multi-tier architecture, LangGraph state graph, real-time WebSocket communication, and component flow diagrams (with Mermaid). |
| [**2. REST API Reference**](./API_REFERENCE.md)              | Exhaustive API endpoint reference covering Authentication, Patient, Doctor, Appointments, AI Consultations, Chat, Reports, and Admin routes.             |
| [**3. Database & ER Diagram**](./DATABASE_SCHEMA.md)         | Entity-Relationship (ER) diagram, PostgreSQL/Prisma relational schema, field definitions, relationships, and indexing strategies.                        |
| [**4. AI & RAG Pipeline**](./AI_AND_RAG_PIPELINE.md)         | Deep dive into Mistral AI integration, LangGraph agent workflows, Qdrant vector database RAG search, document ingestion, and medical report generation.  |
| [**5. Setup & Deployment Guide**](./SETUP_AND_DEPLOYMENT.md) | Prerequisites, environment variable specifications, local installation instructions, Docker Compose stack, and Nginx reverse proxy setup.                |
| [**6. Security & Compliance**](./SECURITY_AND_COMPLIANCE.md) | Security controls, JWT token rotation, bcrypt hashing, rate limiting, audit trails, and healthcare privacy guidelines.                                   |

---

## 🛠️ Technology Stack Overview

### Frontend

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI Primitives + Lucide Icons
- **State & Data Fetching:** Zustand, TanStack React Query v5
- **Communication:** Axios (HTTP client with auto-refresh interceptors), Socket.IO Client

### Backend

- **Runtime:** Node.js + Express (TypeScript with `tsx`)
- **ORM & DB:** Prisma ORM connected to PostgreSQL (Neon DB / Local PostgreSQL)
- **Caching & Rate Limiting:** Upstash Redis (REST) / Redis
- **Real-time:** Socket.IO (bidirectional doctor-patient messaging)
- **Object Storage:** MinIO / AWS S3 client with graceful fallbacks
- **Validation:** Zod Schema Validation

### AI & Vector Service

- **LLM Engine:** Mistral AI (`mistral-large-latest`, `open-mistral-7b`)
- **Agent Orchestration:** LangGraph & LangChain StateGraph
- **Vector Database:** Qdrant Cloud (`medical_documents` collection)
- **Microservice:** FastAPI Python service for OCR and PDF chunking (optional worker)
