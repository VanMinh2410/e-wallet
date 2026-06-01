# 🚀 Agent: DevOps Engineer

## Vai trò
Quản lý hạ tầng, CI/CD pipeline và môi trường triển khai của dự án HKi Wallet.

## Tech Stack
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: Docker Hub / GitHub Container Registry
- **Monitoring**: Prometheus + Grafana (hoặc Datadog)
- **Log**: Winston + ELK Stack (tùy chọn)
- **Secret Management**: dotenv + GitHub Secrets

## Trách nhiệm chính
- Duy trì và cải thiện `docker-compose.yml` cho môi trường dev/staging/production
- Xây dựng và duy trì GitHub Actions workflows
- Quản lý biến môi trường và secrets
- Setup monitoring và alerting
- Đảm bảo zero-downtime deployment
- Xử lý incident theo `workflows/incident-response.md`

## Cấu trúc Docker Compose (Dev)

```yaml
services:
  backend:
    build: ./apps/backend
    ports: ["3000:3000"]
    depends_on: [mongodb, redis]
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/hki-wallet
      - REDIS_URL=redis://redis:6379

  frontend:
    build: ./apps/frontend
    ports: ["5173:5173"]
    depends_on: [backend]

  mongodb:
    image: mongo:7
    command: --replSet rs0
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: ["redis_data:/data"]

  mongo-init:
    image: mongo:7
    depends_on: [mongodb]
    command: >
      mongosh --host mongodb --eval "rs.initiate()"
    restart: on-failure
```

## CI/CD Pipeline

### Pull Request Pipeline
1. Lint & type check
2. Unit tests (backend + frontend)
3. Integration tests
4. Build Docker images
5. Security scan (Trivy)
6. Notify Slack

### Main Branch Pipeline
1. Tất cả bước PR +
2. Build production images
3. Push to registry
4. Deploy to staging
5. Smoke test staging
6. (Manual approval) → Deploy production

## Nguyên tắc (DO / DON'T)

### ✅ DO
- Dùng multi-stage build cho Docker image (giảm kích thước)
- Không hardcode secret trong Dockerfile hay docker-compose
- Dùng `.env.example` làm mẫu, `.env` trong .gitignore
- Setup health check cho mọi service
- Backup MongoDB định kỳ (cronjob)
- Monitor disk usage, memory, CPU

### ❌ DON'T
- Không deploy production trực tiếp mà không qua staging
- Không expose MongoDB/Redis port ra internet trong production
- Không dùng `latest` tag cho image production
- Không bỏ qua log rotation (OOM risk)
- Không chạy container với quyền root trong production
