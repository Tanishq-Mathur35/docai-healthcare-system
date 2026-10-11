# Setup, Configuration & Deployment Guide

This guide describes how to run and deploy the DocAI platform locally or in a containerized production environment.

---

## 1. Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **Package Manager:** npm (v10+)
- **Database:** PostgreSQL (Neon Cloud or local PostgreSQL 15+)
- **Redis Cache:** Upstash Redis or local Redis 7+
- **Docker & Docker Compose:** (Optional for containerized deployments)

---

## 2. Environment Variables Reference

### Backend (`backend/.env`)

```ini
# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database (PostgreSQL / Neon)
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# Redis (Upstash Redis or Local Redis)
REDIS_URL="redis://default:<token>@<host>:<port>"

# Authentication Secrets (Must be 32+ characters)
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-minimum-32-chars"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-minimum-32-chars"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# AI & LLM Providers
MISTRAL_API_KEY="your-mistral-api-key"
TAVILY_API_KEY="your-tavily-api-key"

# Vector Database (Qdrant)
QDRANT_URL="https://your-qdrant-cluster.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY="your-qdrant-api-key"
QDRANT_COLLECTION_NAME="medical_documents"

# Object Storage (MinIO or S3)
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_ACCESS_KEY="minioadmin"
STORAGE_SECRET_KEY="minioadmin"
STORAGE_BUCKET="doctor-patient-files"

# Microservices & Frontend Links
PYTHON_SERVICE_URL="http://localhost:8000"
PYTHON_SERVICE_TOKEN="secure-internal-microservice-token"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env`)

```ini
VITE_API_BASE_URL="http://localhost:5000/api/v1"
VITE_SOCKET_URL="http://localhost:5000"
```

---

## 3. Local Development Setup

### A. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma Client & sync schema to database
npx prisma generate
npx prisma db push

# (Optional) Seed demo doctors, patients, and admin
npx tsx prisma/seed.ts

# Start backend in development mode with live watch
npm run dev
```
The backend starts at `http://localhost:5000`.

### B. Frontend Setup
```bash
# Navigate to frontend directory in another terminal
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend is accessible at `http://localhost:3000`.

---

## 4. Docker Compose Deployment

A complete production-ready container stack is preconfigured:

```bash
# Build and launch all services in background
docker-compose up --build -d

# Check service status
docker-compose ps

# View unified application logs
docker-compose logs -f
```

### Services launched by `docker-compose.yml`:
1. `backend`: Node.js Express server on internal port 5000.
2. `frontend`: Production build served via Nginx on internal port 80.
3. `nginx`: Public reverse proxy exposing port 80/443, routing `/api` and `/socket.io` to the backend and root paths to the frontend.
4. `redis`: Redis cache for rate limiting and token revocation.
5. `python-service`: FastAPI OCR worker for processing scanned lab reports.
