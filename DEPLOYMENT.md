# DocAI Enterprise Deployment & Operations Guide

This guide details instructions for provisioning, securing, and operating the **DocAI** platform in a production cloud environment (AWS, Google Cloud, Azure, or Bare-Metal Linux servers).

---

## 1. System Requirements & Hardware Sizing

### Recommended Production Specifications
| Tier | Concurrent Users | CPU | Memory | Storage | Recommended Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard** | 50 – 250 | 4 vCPU | 16 GB RAM | 100 GB NVMe | AWS `t3.xlarge` / GCP `e2-standard-4` |
| **Enterprise**| 250 – 1,500 | 8 vCPU | 32 GB RAM | 250 GB NVMe | AWS `c6i.2xlarge` / GCP `c2-standard-8` |

> **Note on Machine Learning:** The Python microservice utilizes `all-MiniLM-L6-v2` for dense embeddings and `EasyOCR` for document extraction. While optimized for CPU inference via PyTorch ONNX runtime, attaching an NVIDIA T4 GPU can increase OCR throughput by 400%.

---

## 2. Production Domain & SSL/TLS Termination

In production, terminate SSL at the Nginx reverse proxy using Let's Encrypt / Certbot.

### Step 1: Provision DNS Records
Point your domain records to the server public IP:
- `app.yourdomain.com` -> `A` record -> `<SERVER_IP>`
- `api.yourdomain.com` -> `A` record -> `<SERVER_IP>`

### Step 2: Install Certbot on the Host or Container
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d app.yourdomain.com -d api.yourdomain.com
```

### Step 3: Update `nginx/conf.d/default.conf` for HTTPS
```nginx
server {
    listen 80;
    server_name app.yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS (Strict-Transport-Security)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Routes to services...
    location /api/ {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io/ {
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    location / {
        proxy_pass http://frontend_upstream;
    }
}
```

---

## 3. Database Backup & Disaster Recovery

### Automated Daily PostgreSQL Backups
Create a backup script at `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/docai"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Perform compressed streaming dump
docker exec docai-postgres pg_dump -U postgres doctor_patient_db | gzip > "$FILENAME"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "postgres_backup_*.sql.gz" -mtime +14 -delete

echo "✅ Backup completed successfully: $FILENAME"
```

Configure `cron` to run every midnight:
```bash
crontab -e
# Add line:
0 0 * * * /opt/scripts/backup-db.sh >> /var/log/docai_backup.log 2>&1
```

### Restoring from Backup
```bash
gunzip < /var/backups/docai/postgres_backup_YYYYMMDD.sql.gz | docker exec -i docai-postgres psql -U postgres doctor_patient_db
```

---

## 4. Zero-Downtime Rolling Deployment Workflow

When releasing updates to production:

```bash
# 1. Pull latest master commits
git pull origin main

# 2. Build updated images without stopping active cluster
docker compose build backend frontend python-service

# 3. Perform rolling restarts
docker compose up -d --no-deps --build backend
docker compose up -d --no-deps --build frontend
docker compose up -d --no-deps --build python-service

# 4. Run database migrations safely
docker compose exec backend npx prisma migrate deploy

# 5. Verify service health
curl -f http://localhost/health
```

---

## 5. Security & Compliance Checklist (HIPAA / GDPR)

| Control | Status | Implementation |
| :--- | :--- | :--- |
| **Data Encryption in Transit** | Enabled | TLS 1.3, HTTPS forced via Nginx, WSS WebSockets |
| **Data Encryption at Rest** | Enabled | Encrypted PostgreSQL volume, MinIO encrypted buckets |
| **Access Control (RBAC)** | Strict | Role verification on all API endpoints (`PATIENT`, `DOCTOR`, `ADMIN`) |
| **Data Isolation** | Strict | Doctors restricted to queries where `doctorId == user.doctor.id` |
| **Session Revocation** | Enabled | Refresh tokens hashed with SHA-256 and stored in Redis with instant invalidation |
| **Audit Trails** | Immutable | Every login, report generation, and note creation recorded in `AuditLog` |
| **Rate Limiting** | Enabled | Redis-backed sliding window limiter (100 req/15min globally, 10 req/15min for auth) |

---

## 6. Monitoring & Runbooks

### Checking Container Health Status
```bash
docker compose ps
```

### Viewing Real-time Aggregated Logs
```bash
# View backend logs
docker compose logs -f backend

# View Python AI inference logs
docker compose logs -f python-service

# View Nginx reverse proxy access/error logs
docker compose logs -f nginx
```

### Incident Runbook: Groq LLM API Rate Limit or Degradation
- If Groq encounters API rate limits (`429`), the consultation StateGraph logs a warning and automatically falls back to secondary diagnostic prompts.
- Ensure `GROQ_API_KEY` has active payment billing enabled.
- Check Tavily fallback connectivity via `curl -H "Authorization: Bearer $TAVILY_API_KEY" https://api.tavily.com/search`.
