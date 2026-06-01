# 🛠️ Tech Stack - Công nghệ sử dụng

## 1. Backend - Node.js + NestJS

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/core` | ^10.0.0 | NestJS core framework |
| `@nestjs/common` | ^10.0.0 | Common decorators & utilities |
| `@nestjs/platform-express` | ^10.0.0 | HTTP server driver |
| `express` | ^4.18.0 | Web server framework |
| `class-validator` | ^0.14.0 | DTO validation |
| `class-transformer` | ^0.5.0 | Transform/serialize objects |

### Database & Cache
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/mongoose` | ^10.0.0 | MongoDB integration |
| `mongoose` | ^8.0.0 | MongoDB ODM |
| `redis` | ^4.6.0 | Redis client |
| `@nestjs-modules/ioredis` | ^2.0.0 | Redis integration |

### Authentication & Security
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/jwt` | ^11.0.0 | JWT token handling |
| `@nestjs/passport` | ^10.0.0 | Authentication middleware |
| `passport` | ^0.7.0 | Authentication framework |
| `passport-jwt` | ^4.0.0 | JWT strategy |
| `bcrypt` | ^5.1.0 | Password hashing |
| `helmet` | ^7.0.0 | Security headers |

### Validation & Serialization
| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^3.22.0 | TypeScript-first schema validation |
| `@nestjs/swagger` | ^7.0.0 | API documentation (Swagger/OpenAPI) |
| `swagger-ui-express` | ^5.0.0 | Swagger UI |

### Real-time Communication
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/websockets` | ^10.0.0 | WebSocket integration |
| `@nestjs/socket.io` | ^10.0.0 | Socket.IO wrapper |
| `socket.io` | ^4.6.0 | Real-time bidirectional communication |

### Logging & Monitoring
| Package | Version | Purpose |
|---------|---------|---------|
| `winston` | ^3.11.0 | Logging library |
| `nestjs-pino` | ^3.5.0 | Pino logger integration |
| `pino` | ^8.0.0 | Fast logger |

### Task Scheduling & Queues
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/schedule` | ^4.0.0 | Task scheduling |
| `@nestjs/bull` | ^10.0.0 | Job queue integration |
| `bull` | ^4.11.0 | Redis-based queue |

### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | ^29.0.0 | Testing framework |
| `@nestjs/testing` | ^10.0.0 | NestJS testing utilities |
| `supertest` | ^6.3.0 | HTTP assertion library |
| `@types/jest` | ^29.0.0 | Jest types |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `dotenv` | ^16.0.0 | Environment variables |
| `axios` | ^1.6.0 | HTTP client |
| `moment` | ^2.29.0 | Date/time utilities |
| `uuid` | ^9.0.0 | UUID generation |

### DevDependencies
```json
{
  "@nestjs/cli": "^10.0.0",
  "@types/node": "^20.0.0",
  "@types/express": "^4.17.0",
  "typescript": "^5.0.0",
  "ts-loader": "^9.0.0",
  "ts-node": "^10.0.0",
  "prettier": "^3.0.0",
  "eslint": "^8.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0"
}
```

---

## 2. Frontend - React + TypeScript

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI library |
| `react-dom` | ^18.2.0 | DOM rendering |
| `typescript` | ^5.0.0 | Type safety |

### Routing & Navigation
| Package | Version | Purpose |
|---------|---------|---------|
| `react-router-dom` | ^6.0.0 | Client-side routing |

### State Management
| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | ^4.4.0 | Lightweight state management |
| `@tanstack/react-query` | ^5.0.0 | Server state management |

### Form Management & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | ^7.45.0 | Form state management |
| `zod` | ^3.22.0 | Schema validation |

### UI Component Libraries
| Package | Version | Purpose |
|---------|---------|---------|
| `@mui/material` | ^5.14.0 | Material UI components |
| `@mui/icons-material` | ^5.14.0 | Material icons |
| `@emotion/react` | ^11.0.0 | CSS-in-JS |
| `@emotion/styled` | ^11.0.0 | Styled components |
| OR |
| `tailwindcss` | ^3.3.0 | Utility-first CSS |
| `autoprefixer` | ^10.0.0 | PostCSS plugin |
| `postcss` | ^8.0.0 | CSS processor |

### HTTP & API Client
| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.6.0 | HTTP client |
| `@tanstack/react-query` | ^5.0.0 | Data fetching library |

### Real-time Communication
| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io-client` | ^4.6.0 | WebSocket client |

### Charts & Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | ^2.8.0 | React charting library |
| `chart.js` | ^4.0.0 | Chart library |
| `react-chartjs-2` | ^5.0.0 | Chart.js React wrapper |

### QR Code & Barcode
| Package | Version | Purpose |
|---------|---------|---------|
| `qrcode.react` | ^1.0.0 | QR code generation |
| `react-qr-reader` | ^3.0.0 | QR code scanner |
| `jsbarcode` | ^3.11.0 | Barcode generation |

### Date/Time Handling
| Package | Version | Purpose |
|---------|---------|---------|
| `dayjs` | ^1.11.0 | Lightweight date library |
| `react-date-range` | ^1.4.0 | Date range picker |

### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| `@testing-library/react` | ^14.0.0 | React testing utilities |
| `@testing-library/jest-dom` | ^6.0.0 | Jest DOM matchers |
| `vitest` | ^0.34.0 | Unit testing framework |
| `cypress` | ^13.0.0 | E2E testing |

### Build & Development
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^4.4.0 | Build tool |
| `@vitejs/plugin-react` | ^4.0.0 | Vite React plugin |

### Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| `lodash` | ^4.17.0 | Utility library |
| `classnames` | ^2.3.0 | Class name utilities |
| `uuid` | ^9.0.0 | UUID generation |

### DevDependencies
```json
{
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@types/node": "^20.0.0",
  "eslint": "^8.0.0",
  "eslint-plugin-react": "^7.32.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "prettier": "^3.0.0"
}
```

---

## 3. Database - MongoDB

### Schema & Indexing
- **Collections**: 8-10 (users, wallets, transactions, bank_accounts, etc.)
- **Indexing Strategy**: Indexes on frequently queried fields
- **Aggregation**: Complex queries for analytics

### Backup & Recovery
- Automated backup strategy
- Point-in-time recovery capability

---

## 4. Caching & Session - Redis

### Use Cases
1. **Session Management**: Store user sessions
2. **Rate Limiting**: Track API request counts
3. **Cache**: Cache frequently accessed data
4. **Queue**: Background job processing

### Key Operations
```typescript
// Set cache with TTL
await redis.setex(key, ttl, value);

// Rate limiting
await redis.incr(`rate:${userId}:${minute}`);

// Session storage
await redis.setex(`session:${token}`, 3600, userData);
```

---

## 5. Real-time - Socket.IO

### Configuration
- **Namespace**: `/notifications`, `/transactions`
- **Rooms**: Per user, per wallet, per admin
- **Events**: Custom events for different actions

### Performance Optimization
- Connection pooling
- Message compression
- Selective broadcasting

---

## 6. API Documentation - Swagger

### Setup
- **Swagger UI**: Auto-generated from NestJS decorators
- **OpenAPI 3.0**: Full API specification
- **Examples**: Request/response examples

### Endpoint Documentation
All endpoints documented with:
- Request body schema
- Response schema
- Error codes
- Authentication requirements

---

## 7. Docker & DevOps

### Docker Images
```dockerfile
# Backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Services
- **Backend**: NestJS API
- **Frontend**: React app (Nginx)
- **MongoDB**: Database
- **Redis**: Cache & session store
- **MongoDB Express** (dev only): MongoDB UI

---

## 8. CI/CD - GitHub Actions

### Workflows
1. **Unit Tests**: Run on every push
2. **Build**: Build Docker images
3. **Integration Tests**: Run API tests
4. **Deploy**: Deploy to production

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_EXPIRY=900
REFRESH_TOKEN_EXPIRY=604800
```

---

## 9. Monitoring & Logging

### Application Logging
- **Winston**: Structured logging
- **Log Levels**: Error, warn, info, debug
- **Log Rotation**: Daily log file rotation

### Performance Monitoring
- **Response time**: Track API response times
- **Database queries**: Monitor slow queries
- **Redis operations**: Track cache hit rates

### Error Tracking (Optional)
- **Sentry**: Error tracking & reporting
- **DataDog**: APM & monitoring

---

## 10. Security Tools

### Code Quality
- **ESLint**: Linting
- **Prettier**: Code formatting
- **SonarQube**: Code quality analysis

### Dependency Scanning
- **npm audit**: Vulnerability scanning
- **Snyk**: Dependency security

### Performance Testing
- **Apache JMeter**: Load testing
- **Artillery**: API load testing

---

## 11. Recommended Versions Summary

### Backend Stack
```
Node.js: v20 LTS
NestJS: ^10.0
MongoDB: ^6.0
Redis: ^7.0
TypeScript: ^5.0
```

### Frontend Stack
```
React: ^18.2
TypeScript: ^5.0
Vite: ^4.4
Tailwind CSS: ^3.3 (or MUI ^5.14)
```

---

## 12. Installation Quick Reference

### Backend
```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install @nestjs/mongoose mongoose
npm install redis @nestjs-modules/ioredis
npm install @nestjs/jwt @nestjs/passport passport-jwt bcrypt
npm install zod class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install @nestjs/websockets @nestjs/socket.io socket.io
npm install winston nestjs-pino pino
npm install dotenv axios moment uuid

npm install --save-dev jest @nestjs/testing supertest
npm install --save-dev typescript ts-loader @types/node @types/express
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Frontend
```bash
npm install react react-dom typescript
npm install react-router-dom
npm install zustand @tanstack/react-query
npm install react-hook-form zod
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
# OR
npm install tailwindcss autoprefixer postcss -D

npm install axios socket.io-client
npm install recharts
npm install qrcode.react react-qr-reader
npm install dayjs

npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev @types/react @types/react-dom eslint prettier
```

---

## 13. Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| API Response Time | < 200ms | New Relic / DataDog |
| Frontend Load Time | < 3s | Lighthouse |
| Database Query | < 100ms | MongoDB Profiler |
| Cache Hit Rate | > 80% | Redis INFO |
| Uptime | 99.9% | Monitoring Tool |

---

## 14. Kết luận

Stack này được chọn vì:
- ✅ **Production-ready**: Được sử dụng rộng rãi
- ✅ **Scalable**: Dễ mở rộng
- ✅ **Community Support**: Cộng đồng lớn
- ✅ **Type-safe**: TypeScript cho cả backend & frontend
- ✅ **Performance**: Tối ưu cho tốc độ
- ✅ **Security**: Bảo mật tích hợp sẵn
