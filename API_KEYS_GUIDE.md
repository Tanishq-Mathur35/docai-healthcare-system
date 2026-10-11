# 🔑 API Keys & Environment Variables Setup Guide

This guide explains **every environment variable** across all three `.env.example` files in this project and shows you exactly **where and how to obtain each API key or credential**.

---

## 📁 Files You Need to Create

Copy each example file and fill in your real values:

```bash
# Run these in your terminal from the project root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp python-service/.env.example python-service/.env
```

---

## 1. `backend/.env` — Node.js API Server

### 🤖 AI Service Keys (Required)

#### `GEMINI_API_KEY` (Recommended — 100% Free Tier)

Google's Gemini 1.5 Flash / 2.0 Flash engine for adaptive, empathetic medical dialogue.

**How to get it:**
1. Go to **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google Account
3. Click **"Create API key"**
4. Copy the key (starts with `AIzaSy...`)

```
GEMINI_API_KEY=AIzaSy...
```

> **Free tier:** 15 RPM, 1,500 requests/day, 1,000,000 TPM with no credit card required.

---

#### `GROQ_API_KEY` (Alternative — High Speed Free Tier)

Ultra-fast open models (Llama 3.3 70B Versatile).

**How to get it:**
1. Go to **[https://console.groq.com/keys](https://console.groq.com/keys)**
2. Sign up or log in
3. Click **"Create API Key"**
4. Copy the key (starts with `gsk_...`)

```
GROQ_API_KEY=gsk_...
```

---

#### `MISTRAL_API_KEY`

Mistral AI platform (`mistral-small-latest`).

**How to get it:**
1. Go to **[https://console.mistral.ai](https://console.mistral.ai)**
2. Sign up or log in
3. Click **"API Keys"** in the left sidebar
4. Click **"Create new key"** and copy

```
MISTRAL_API_KEY=your_mistral_api_key_here
```

---

#### `TAVILY_API_KEY`

Medical literature web search fallback — triggered automatically when AI diagnostic confidence drops below 75%.

**How to get it:**

1. Go to **[https://app.tavily.com](https://app.tavily.com)**
2. Sign up with Google or email
3. On the dashboard, your API key is shown immediately
4. Copy the key — it starts with `tvly-`

```
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Free tier:** 1,000 searches/month. Sufficient for development.

---

#### `QDRANT_API_KEY`

Authentication key for the Qdrant vector database (for hybrid RAG medical document search).

**Two options:**

**Option A — Self-hosted (Local/Docker):**

- Leave `QDRANT_API_KEY=` blank. No key needed when running via Docker Compose.

**Option B — Qdrant Cloud (Managed):**

1. Go to **[https://cloud.qdrant.io](https://cloud.qdrant.io)**
2. Sign up and create a **free cluster** (1 GB free)
3. Once created, click on your cluster → **"API Keys"** tab
4. Click **"Create API Key"** and copy it
5. Also copy the cluster **URL** (e.g., `https://xxxx.us-east-1-0.aws.cloud.qdrant.io`)

```
QDRANT_URL=https://xxxx.us-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_cloud_api_key
```

---

### ⚡ Upstash Redis (Serverless Cache & Token Store)

#### `REDIS_URL`

Upstash Redis is used for rotating refresh token invalidation and API rate limiting.

**How to get it:**

1. Go to **[https://console.upstash.com/redis](https://console.upstash.com/redis)**
2. Sign up or log in (free tier includes 10,000 commands/day)
3. Click **"Create Database"**
   - Name: `docai-redis`
   - Region: Select the region closest to you
   - Type: Regional or Global
4. In the database details page, scroll down to the **"Connect"** section
5. Select the **"Node"** or **"ioredis / redis-cli"** tab
6. Copy the connection URL (`rediss://...`):
   ```
   REDIS_URL=rediss://default:your_password@your-database.upstash.io:6379
   ```
   _(Note: The backend automatically parses both `rediss://...` and `https://...` formats!)_

---

### 🗄️ Database

#### `DATABASE_URL`

PostgreSQL connection string. No external account needed — runs via Docker.

**For Docker Compose (recommended):**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doctor_patient_db
```

**For a cloud database (e.g., Supabase, Railway, Neon):**

| Provider     | Free Tier | Link                                                                                         |
| :----------- | :-------- | :------------------------------------------------------------------------------------------- |
| **Supabase** | 500 MB    | [supabase.com](https://supabase.com) → New Project → Settings → Database → Connection String |
| **Neon**     | 0.5 GB    | [neon.tech](https://neon.tech) → New Project → Dashboard → Connection Details                |
| **Railway**  | $5 credit | [railway.app](https://railway.app) → New → PostgreSQL → Connect                              |

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

---

### 📧 Email (SMTP)

#### `SMTP_USER` and `SMTP_PASS`

Used to send email verification and password reset emails.

**Option A — Gmail App Password (Recommended for dev/testing):**

1. Go to your **Google Account → Security**
2. Enable **2-Step Verification** (required)
3. Search for **"App Passwords"** in the Security section
4. Select app: **"Mail"** → Select device: **"Other"** → name it `DocAI`
5. Copy the 16-character app password generated

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

**Option B — Resend (API-based, free 3,000 emails/month):**

1. Go to **[https://resend.com](https://resend.com)** → Sign up
2. Create API key → Add your domain (or use `onboarding@resend.dev` for testing)
3. Resend provides SMTP bridge: `smtp.resend.com` port `465`, user `resend`, password = your API key

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key
```

**Option C — Mailtrap (Fake inbox for testing — never sends real emails):**

1. Go to **[https://mailtrap.io](https://mailtrap.io)** → Sign up free
2. Click **"Email Testing"** → Inboxes → your inbox → **SMTP Settings**
3. Copy host, port, user, and password

```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_password
```

---

### 🔐 JWT Secrets

#### `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

These are **self-generated** secrets — no external service needed. Must be at least 64 characters.

**Generate them with this command:**

```bash
# Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(64, 10)

# Or Node.js (run anywhere)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or online (use a trusted generator)
# https://generate-secret.vercel.app/64
```

```
JWT_ACCESS_SECRET=a9f3e8c2d1b047a3e6f9c8b5d2a7f4e1c0b3d6a9f2e5c8b1d4a7f0e3c6b9d2a5f8
JWT_REFRESH_SECRET=b1d4a7f0e3c6b9d2a5f8e1c4b7d0a3f6e9c2b5d8a1f4e7c0b3d6a9f2e5c8b1d4a7
```

> ⚠️ **Use completely different values** for access and refresh secrets!

---

### 🪣 MinIO / S3 Storage

#### `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY`

Credentials for file uploads (prescriptions, X-rays, MRI scans, lab reports).

**Option A — Local MinIO via Docker (default):**

```
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
```

**Option B — AWS S3:**

1. Go to **[https://aws.amazon.com](https://aws.amazon.com)** → Sign in to Console
2. Search for **IAM** → Users → Create User
3. Attach policy: `AmazonS3FullAccess`
4. Go to the user → **Security credentials** → Create Access Key
5. Copy **Access Key ID** and **Secret Access Key**
6. Create an S3 bucket and note the region

```
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
STORAGE_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STORAGE_BUCKET=your-docai-bucket-name
STORAGE_REGION=us-east-1
```

> **AWS Free Tier:** 5 GB S3 storage free for 12 months.

**Option C — Cloudflare R2 (S3-compatible, no egress fees):**

1. Go to **[https://dash.cloudflare.com](https://dash.cloudflare.com)** → R2 Object Storage
2. Create a bucket → **Manage R2 API Tokens**
3. Copy account ID, access key, and secret key

```
STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=your_r2_access_key
STORAGE_SECRET_KEY=your_r2_secret_key
```

---

### 🔗 Internal Service Token

#### `PYTHON_SERVICE_TOKEN`

A shared secret between the Node.js backend and the Python FastAPI microservice. You **generate this yourself** — no external service needed.

```bash
# Generate a secure random token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the **same value** in both `backend/.env` and `python-service/.env`.

```
# In backend/.env
PYTHON_SERVICE_TOKEN=your_generated_64_char_hex_token

# In python-service/.env
PYTHON_SERVICE_TOKEN=your_generated_64_char_hex_token   ← must match exactly
```

---

## 2. `frontend/.env` — React 19 Web App

These are **not secrets** — they are public URLs embedded in the browser bundle.

| Variable            | Value in Dev                   | Value in Production             |
| :------------------ | :----------------------------- | :------------------------------ |
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | `https://yourdomain.com/api/v1` |
| `VITE_WS_URL`       | `http://localhost:5000`        | `https://yourdomain.com`        |
| `VITE_APP_NAME`     | `"AI Doctor Consultation"`     | `"AI Doctor Consultation"`      |

No external accounts needed. Just update the domain when deploying.

---

## 3. `python-service/.env` — FastAPI ML Microservice

Most variables are shared with the backend. The one specific to Python:

| Variable          | Description                                                                                             |
| :---------------- | :------------------------------------------------------------------------------------------------------ |
| `EMBEDDING_MODEL` | Hugging Face model name. Default `all-MiniLM-L6-v2` (downloaded automatically from HF Hub on first run) |
| `STORAGE_USE_SSL` | `false` for local MinIO, `true` for AWS S3/R2                                                           |

The model download is automatic — no Hugging Face account required for `all-MiniLM-L6-v2` (public model).

---

## ✅ Summary: External Accounts You Need

| Service                       | Purpose                       | Free Tier         | Sign-Up URL                                                            |
| :---------------------------- | :---------------------------- | :---------------- | :--------------------------------------------------------------------- |
| **Mistral AI**                | LLM inference (Mistral Small) | ✅ Free credits   | [console.mistral.ai](https://console.mistral.ai)                       |
| **Tavily**                    | Medical web search fallback   | ✅ 1,000/month    | [app.tavily.com](https://app.tavily.com)                               |
| **Gmail**                     | Transactional emails          | ✅ Free           | [myaccount.google.com/security](https://myaccount.google.com/security) |
| **Qdrant Cloud** _(optional)_ | Managed vector DB             | ✅ 1 GB free      | [cloud.qdrant.io](https://cloud.qdrant.io)                             |
| **AWS S3** _(optional)_       | Production file storage       | ✅ 5 GB/12 months | [aws.amazon.com](https://aws.amazon.com)                               |

> **Qdrant and MinIO run locally via Docker Compose by default** — no cloud account needed for development.

---

## 🚀 Minimum Setup for Local Development

The absolute minimum to get the app running locally:

```bash
# backend/.env — only these 4 are strictly required to start
MISTRAL_API_KEY=...         # from console.mistral.ai
TAVILY_API_KEY=tvly-...     # from app.tavily.com
JWT_ACCESS_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<different 64-char random string>
```

Everything else (Postgres, Redis, MinIO, Qdrant) is handled automatically by:

```bash
docker compose -f docker-compose.dev.yml up -d
```
