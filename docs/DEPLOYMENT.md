# 🚀 Deployment & DevOps - E-Wallet

## 1. Development Environment Setup

### 1.1 Prerequisites

```bash
# Required tools
- Node.js v20+ (LTS)
- npm v9+
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose
- Git
- VS Code (recommended)
```

### 1.2 Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/e-wallet.git
cd e-wallet

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cd ../backend
cp .env.example .env
# Edit .env with local values

cd ../frontend
cp .env.example .env
```

### 1.3 Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: ewallet_mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - ewallet_network

  redis:
    image: redis:7.0
    container_name: ewallet_redis
    ports:
      - "6379:6379"
    networks:
      - ewallet_network

  mongodb-express:
    image: mongo-express:1.0.0
    container_name: ewallet_mongo_express
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: password
      ME_CONFIG_MONGODB_URL: mongodb://admin:password@mongodb:27017/
    ports:
      - "8081:8081"
    depends_on:
      - mongodb
    networks:
      - ewallet_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ewallet_backend
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://admin:password@mongodb:27017/ewallet?authSource=admin
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend/src:/app/src
    networks:
      - ewallet_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ewallet_frontend
    ports:
      - "3001:3001"
    volumes:
      - ./frontend/src:/app/src
    networks:
      - ewallet_network

volumes:
  mongodb_data:

networks:
  ewallet_network:
    driver: bridge
```

### 1.4 Running Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Access applications
- Backend API: http://localhost:3000
- Frontend: http://localhost:3001
- MongoDB Express: http://localhost:8081
- Swagger Docs: http://localhost:3000/api/docs
```

---

## 2. Docker Configuration

### 2.1 Backend Dockerfile

```dockerfile
# Multi-stage build for optimization

# Build stage
FROM node:20-alpine AS builder
WORKDIR /build

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy from builder
COPY --from=builder --chown=nestjs:nodejs /build/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /build/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /build/package*.json ./

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main"]
```

### 2.2 Frontend Dockerfile

```dockerfile
# Multi-stage build

# Build stage
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build React app
RUN npm run build

# Runtime stage - use Nginx to serve
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder
COPY --from=builder /build/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2.3 Nginx Configuration

```nginx
# default.conf
upstream api {
  server backend:3000;
}

server {
  listen 80;
  server_name _;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

  # Gzip compression
  gzip on;
  gzip_min_length 1000;
  gzip_proxied any;
  gzip_types text/plain text/css text/xml text/javascript 
             application/x-javascript application/xml+rss 
             application/json application/javascript;

  # Static files
  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
    
    # Cache busting for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }

  # API proxy
  location /api/ {
    proxy_pass http://api/api/;
    proxy_http_version 1.1;
    
    # Headers
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # Health check endpoint
  location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
  }
}
```

---

## 3. CI/CD with GitHub Actions

### 3.1 Workflow Structure

```
.github/workflows/
├── test.yml           # Run tests on PR
├── build.yml          # Build images on push
├── deploy-staging.yml # Deploy to staging
└── deploy-prod.yml    # Deploy to production
```

### 3.2 Test Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
      
      redis:
        image: redis:7.0
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linter
        working-directory: backend
        run: npm run lint

      - name: Run tests
        working-directory: backend
        run: npm run test:cov
        env:
          MONGODB_URI: mongodb://localhost:27017/ewallet-test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run linter
        working-directory: frontend
        run: npm run lint

      - name: Run tests
        working-directory: frontend
        run: npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
```

### 3.3 Build & Push Workflow

```yaml
# .github/workflows/build.yml
name: Build & Push

on:
  push:
    branches: [main, develop]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:latest
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/frontend:latest
            ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3.4 Deploy to Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    environment:
      name: staging

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /app/ewallet
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d
            
            # Run migrations
            docker-compose -f docker-compose.staging.yml exec -T backend npm run migrate
            
            # Verify deployment
            curl -f http://localhost:3000/health || exit 1

      - name: Notify Slack
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Deployed to staging",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ Staging deployment successful\n*Commit:* ${{ github.sha }}\n*Branch:* develop"
                  }
                }
              ]
            }
```

### 3.5 Deploy to Production

```yaml
# .github/workflows/deploy-prod.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    environment:
      name: production
      
    steps:
      - uses: actions/checkout@v3

      - name: Backup database
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app/ewallet
            docker-compose exec -T mongodb mongodump --out /backups/$(date +%Y%m%d-%H%M%S)

      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app/ewallet
            
            # Pull latest images
            docker-compose -f docker-compose.prod.yml pull
            
            # Stop current containers gracefully
            docker-compose -f docker-compose.prod.yml down
            
            # Start new version
            docker-compose -f docker-compose.prod.yml up -d
            
            # Run migrations
            docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate
            
            # Health checks
            for i in {1..10}; do
              curl -f http://localhost:3000/health && break || sleep 10
            done
            
            # Verify
            if [ $? -eq 0 ]; then
              echo "Deployment successful"
            else
              echo "Deployment failed"
              exit 1
            fi

      - name: Smoke tests
        run: |
          npm install
          npm run test:smoke
        env:
          API_URL: ${{ secrets.PROD_API_URL }}

      - name: Notify
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production deployment complete",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚀 Production deployment successful\n*Version:* ${{ github.ref }}"
                  }
                }
              ]
            }
```

---

## 4. Database Migrations

### 4.1 Migration Structure

```
backend/src/database/migrations/
├── 001_create_users_collection.ts
├── 002_create_wallets_collection.ts
├── 003_add_indexes.ts
└── 004_create_transactions_collection.ts
```

### 4.2 Migration Example

```typescript
// Migration interface
export interface Migration {
  name: string;
  version: number;
  up(db: Db): Promise<void>;
  down(db: Db): Promise<void>;
}

// 001_create_users_collection.ts
export const migration001: Migration = {
  name: 'CreateUsersCollection',
  version: 1,
  
  async up(db: Db) {
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password_hash', 'created_at'],
          properties: {
            _id: { bsonType: 'objectId' },
            email: { bsonType: 'string' },
            password_hash: { bsonType: 'string' },
            created_at: { bsonType: 'date' }
          }
        }
      }
    });
    
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },
  
  async down(db: Db) {
    await db.dropCollection('users');
  }
};
```

### 4.3 Migration Runner

```typescript
// scripts/migrate.ts
import { MongoClient, Db } from 'mongodb';
import * as migrations from '../database/migrations';

async function runMigrations() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const db = client.db('ewallet');
  
  try {
    // Get migration history
    const historyCollection = db.collection('migrations');
    const history = await historyCollection
      .find({})
      .toArray();
    
    const appliedVersions = history.map(h => h.version);
    
    // Run pending migrations
    const allMigrations = Object.values(migrations);
    
    for (const migration of allMigrations) {
      if (!appliedVersions.includes(migration.version)) {
        console.log(`Running migration: ${migration.name}`);
        
        await migration.up(db);
        
        await historyCollection.insertOne({
          version: migration.version,
          name: migration.name,
          executedAt: new Date()
        });
        
        console.log(`✅ Migration completed: ${migration.name}`);
      }
    }
    
    console.log('All migrations completed');
  } finally {
    await client.close();
  }
}

// Run in package.json: "migrate": "ts-node src/scripts/migrate.ts"
```

---

## 5. Monitoring & Observability

### 5.1 Application Monitoring

```typescript
// Prometheus metrics
import { collectDefaultMetrics, register } from 'prom-client';

collectDefaultMetrics();

// Custom metrics
import { Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const transactionCounter = new Counter({
  name: 'transactions_total',
  help: 'Total number of transactions',
  labelNames: ['type', 'status']
});

export const walletBalance = new Gauge({
  name: 'wallet_balance_total',
  help: 'Total balance across all wallets',
  labelNames: ['currency']
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

### 5.2 Logging Configuration

```typescript
// Winston logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Usage
logger.info('Application started');
logger.error('An error occurred', { error: err });
```

### 5.3 Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/node";

// Initialize
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.requestHandler());

// Capture exceptions
try {
  // code
} catch (error) {
  Sentry.captureException(error);
}

app.use(Sentry.Handlers.errorHandler());
```

---

## 6. Backup & Recovery

### 6.1 MongoDB Backup

```bash
# Automated daily backup
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup
docker-compose exec -T mongodb mongodump \
  --uri="mongodb://admin:password@mongodb:27017/ewallet?authSource=admin" \
  --out="${BACKUP_DIR}/${DATE}"

# Compress
tar -czf "${BACKUP_DIR}/${DATE}.tar.gz" "${BACKUP_DIR}/${DATE}"
rm -rf "${BACKUP_DIR}/${DATE}"

# Keep last 30 days
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${DATE}.tar.gz" s3://ewallet-backups/
```

### 6.2 Recovery Procedure

```bash
# List backups
aws s3 ls s3://ewallet-backups/ | head -10

# Download backup
aws s3 cp s3://ewallet-backups/BACKUP_DATE.tar.gz ./

# Extract
tar -xzf BACKUP_DATE.tar.gz

# Restore
docker-compose exec -T mongodb mongorestore \
  --uri="mongodb://admin:password@mongodb:27017/?authSource=admin" \
  dump/
```

---

## 7. Scaling Strategy

### 7.1 Horizontal Scaling (Kubernetes)

```yaml
# k8s deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ewallet-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ewallet-backend
  template:
    metadata:
      labels:
        app: ewallet-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/org/ewallet/backend:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 7.2 Caching Strategy

- Redis for session management
- Cache frequently accessed data (wallet balances)
- CDN for static assets
- Database query optimization

---

## 8. Production Checklist

**Before Going Live:**
- [ ] All tests passing (90%+ coverage)
- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Performance testing OK (< 200ms response)
- [ ] Monitoring & logging configured
- [ ] Backup strategy tested
- [ ] Disaster recovery plan ready
- [ ] Team trained & on-call
- [ ] Documentation complete
- [ ] SLA/uptime targets defined
- [ ] Incident response plan ready
- [ ] User communication plan ready

---

## 9. Post-Deployment Monitoring

### 9.1 Health Checks

```bash
# Check all services
curl http://api.ewallet.com/health
curl http://ewallet.com/health

# Verify database
mongo --eval "db.adminCommand('ping')"

# Check Redis
redis-cli ping

# Monitor logs
tail -f logs/application.log
```

### 9.2 Metrics to Track

- API response time (p50, p95, p99)
- Error rate (5xx, 4xx)
- Database query time
- Cache hit ratio
- Transaction throughput
- User count & DAU
- System resource usage (CPU, memory, disk)

---

## 10. Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| High memory usage | Check for memory leaks, optimize queries |
| Slow database | Add indexes, query optimization, scale DB |
| API timeouts | Scale horizontally, optimize business logic |
| Cache misses | Review cache TTL, key strategy |
| Deployment failures | Check logs, run migrations, verify config |
| Connection errors | Check network, firewall, credentials |

---

## 11. Useful Commands

```bash
# Docker Compose
docker-compose ps
docker-compose logs -f service_name
docker-compose exec service_name sh
docker-compose down --volumes

# Database
mongosh ewallet_db
db.collections()
db.users.find()

# Redis
redis-cli
KEYS *
GET key_name

# Deployment
git tag v1.0.0
git push origin v1.0.0
```

---

## 12. Next Steps

1. Finalize infrastructure requirements
2. Choose cloud provider (AWS, Azure, GCP)
3. Set up CI/CD pipeline
4. Create deployment documentation
5. Train team on deployment procedures
6. Perform dry-run deployment to staging
7. Schedule production launch
