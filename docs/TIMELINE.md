# ⏱️ Timeline - Kế hoạch thời gian

## Tổng quan

**Dự kiến hoàn thành:** 6-7 tháng (27 tuần)
**Mục tiêu MVP:** 4 tuần sau (Phase 1-2)
**Mục tiêu Beta:** 11 tuần sau (Phase 1-3)

---

## Phase 1: Foundation (Tuần 1-3)

### Tuần 1: Project Setup
**Mục tiêu:** Thiết lập cơ sở hạ tầng dự án

| Ngày | Task | Duration | Owner |
|------|------|----------|-------|
| Day 1-2 | Initialize NestJS backend | 1.5 days | Backend |
| Day 1-2 | Initialize React frontend | 1.5 days | Frontend |
| Day 2-3 | Setup MongoDB + Redis | 1.5 days | DevOps |
| Day 3 | Docker & Docker Compose setup | 1 day | DevOps |
| Day 4-5 | Configure environment & Git | 1 day | DevOps |

**Deliverables:**
- ✅ NestJS app running on localhost:3000
- ✅ React app running on localhost:3001
- ✅ Docker containers operational
- ✅ Environment variables configured

**Blockers:** None anticipated

---

### Tuần 2: Backend Foundation
**Mục tiêu:** Xây dựng lớp cơ bản backend

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Database config (MongoDB, Mongoose) | 1.5 days | Backend | TBD |
| Redis client setup | 1 day | Backend | TBD |
| JWT configuration | 1.5 days | Backend | TBD |
| Exception filters & validation pipes | 1.5 days | Backend | TBD |
| Swagger/OpenAPI setup | 1 day | Backend | TBD |
| Winston logging | 1 day | Backend | TBD |

**Deliverables:**
- ✅ Database & cache connected
- ✅ Logging system in place
- ✅ Exception handling framework
- ✅ Swagger UI accessible at /api/docs

---

### Tuần 3: Frontend Foundation
**Mục tiêu:** Xây dựng lớp cơ bản frontend

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| TypeScript & Tailwind CSS setup | 1 day | Frontend | TBD |
| React Router configuration | 1 day | Frontend | TBD |
| Zustand store setup | 1 day | Frontend | TBD |
| Axios interceptors & API service | 1.5 days | Frontend | TBD |
| Base layout components | 1.5 days | Frontend | TBD |
| Testing setup (Vitest) | 1 day | Frontend | TBD |

**Deliverables:**
- ✅ Frontend boilerplate ready
- ✅ Routing working
- ✅ State management configured
- ✅ Test environment setup

---

## Phase 2: Authentication (Tuần 4-7)

### Tuần 4: Authentication Backend
**Mục tiêu:** Xây dựng auth module backend

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| User registration endpoint | 2 days | Backend | TBD |
| Email verification flow | 2 days | Backend | TBD |
| Login/Logout logic | 1.5 days | Backend | TBD |
| JWT & Refresh token generation | 1.5 days | Backend | TBD |
| Unit tests for auth service | 1 day | Backend | TBD |

**Deliverables:**
- ✅ Register, Login, Logout endpoints working
- ✅ Email verification implemented
- ✅ 80%+ test coverage for auth

---

### Tuần 5: Authentication Frontend
**Mục tiêu:** Xây dựng auth UI & flow

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Login page & form | 1.5 days | Frontend | TBD |
| Register page & form | 1.5 days | Frontend | TBD |
| OTP verification component | 1.5 days | Frontend | TBD |
| Auth guards & route protection | 1.5 days | Frontend | TBD |
| Token storage (httpOnly cookies) | 1 day | Frontend | TBD |

**Deliverables:**
- ✅ Full auth UI implemented
- ✅ Login/Register/Logout flows working end-to-end
- ✅ Protected routes functional

---

### Tuần 6: User Profile & RBAC
**Mục tiêu:** Hoàn thành user profile & role-based access

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| User profile endpoints | 2 days | Backend | TBD |
| RBAC decorator & guard | 1.5 days | Backend | TBD |
| Profile UI & edit form | 2 days | Frontend | TBD |
| Role-based route protection | 1 day | Frontend | TBD |
| Integration tests | 1.5 days | QA | TBD |

**Deliverables:**
- ✅ User profile management complete
- ✅ RBAC system functional
- ✅ Integration tests passing

---

### Tuần 7: Testing & Polish
**Mục tiêu:** QA & chỉnh sửa giai đoạn 2

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| E2E tests for auth flow | 2 days | QA | TBD |
| Security audit (OWASP) | 2 days | Security | TBD |
| Performance optimization | 1.5 days | DevOps | TBD |
| Bug fixes & refinements | 1.5 days | Team | TBD |

**Milestone:** ✅ **MVP Ready** (Auth + Basic UI)

---

## Phase 3: Wallet & Transactions (Tuần 8-11)

### Tuần 8: Wallet Module
**Mục tiêu:** Implement wallet system

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Wallet schema & model | 1.5 days | Backend | TBD |
| Wallet endpoints (CRUD) | 2 days | Backend | TBD |
| Balance calculation logic | 1.5 days | Backend | TBD |
| Wallet UI components | 2 days | Frontend | TBD |
| Unit tests | 1.5 days | Backend | TBD |

**Deliverables:**
- ✅ Wallets can be created & managed
- ✅ Balance displayed correctly
- ✅ UI fully functional

---

### Tuần 9: Transaction Core
**Mục tiêu:** Implement transfer transactions

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Transaction schema | 1 day | Backend | TBD |
| Transfer logic & validation | 2.5 days | Backend | TBD |
| Transaction history endpoints | 1.5 days | Backend | TBD |
| Transfer form & flow | 2 days | Frontend | TBD |
| Unit & integration tests | 1.5 days | Backend | TBD |

**Deliverables:**
- ✅ Transfers working between wallets
- ✅ Transaction history viewable
- ✅ Balance updates in real-time

---

### Tuần 10: Bank Integration Prep
**Mục tiêu:** Setup bank account linking

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Bank account schema | 1 day | Backend | TBD |
| Bank linking endpoints | 2 days | Backend | TBD |
| Encryption for bank data | 1.5 days | Backend | TBD |
| Bank account UI | 1.5 days | Frontend | TBD |
| Verification flow (OTP) | 1.5 days | Backend | TBD |

**Deliverables:**
- ✅ Bank accounts can be linked
- ✅ OTP verification working
- ✅ Data encryption in place

---

### Tuần 11: Advanced Features & Testing
**Mục tiêu:** QA & advanced features

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| QR code generation | 2 days | Backend | TBD |
| QR payment implementation | 2 days | Frontend | TBD |
| E2E tests for transactions | 2 days | QA | TBD |
| Performance testing | 1.5 days | DevOps | TBD |

**Milestone:** ✅ **Beta Ready** (Core features complete)

---

## Phase 4: Bank Integration (Tuần 12-15)

### Tuần 12-13: Deposit System
**Tasks:**
- Bank deposit webhook setup (3 days)
- Payment reference generation (2 days)
- Deposit approval flow (2 days)
- Testing & integration (2 days)

**Deliverables:**
- ✅ Deposits can be initiated
- ✅ Webhooks receiving bank confirmations
- ✅ Balance updates automatically

---

### Tuần 14-15: Withdrawal System
**Tasks:**
- Withdrawal request handling (2.5 days)
- Bank API integration (2.5 days)
- Withdrawal approval workflow (2 days)
- Testing & monitoring (2.5 days)

**Deliverables:**
- ✅ Withdrawals working end-to-end
- ✅ Bank processing confirmed
- ✅ Status tracking implemented

---

## Phase 5: Real-time & Admin (Tuần 16-18)

### Tuần 16: Socket.IO Setup
**Tasks:**
- Socket.IO server configuration (1.5 days)
- Namespace & rooms setup (1.5 days)
- Notification service (2 days)
- Frontend WebSocket client (2 days)

**Deliverables:**
- ✅ Real-time connections working
- ✅ Notifications pushing to clients

---

### Tuần 17-18: Admin Dashboard
**Tasks:**
- Admin endpoints (2 days)
- User management page (2 days)
- Transaction approval UI (2 days)
- Analytics dashboard (2 days)
- Testing (1.5 days)

**Deliverables:**
- ✅ Admin panel fully functional
- ✅ User management working
- ✅ Analytics displaying

---

## Phase 6: Security & Advanced (Tuần 19-21)

### Tuần 19: Security Hardening
**Tasks:**
- Rate limiting implementation (1.5 days)
- Account lockout mechanism (1.5 days)
- Device fingerprinting (2 days)
- Encryption improvements (2 days)

**Deliverables:**
- ✅ Security controls in place
- ✅ Rate limiting active
- ✅ Advanced protections enabled

---

### Tuần 20-21: Audit & Advanced Features
**Tasks:**
- Audit logging (2 days)
- Referral system (2 days)
- Loyalty points (2 days)
- Testing (2 days)

**Deliverables:**
- ✅ All audit logs recorded
- ✅ Advanced features implemented

---

## Phase 7: Testing & Quality (Tuần 22-24)

### Tuần 22: Unit & Integration Tests
**Tasks:**
- 90%+ code coverage (backend) (3 days)
- Frontend component tests (2 days)
- Integration test suite (2 days)

---

### Tuần 23: E2E & Performance
**Tasks:**
- E2E test scenarios (2 days)
- Performance benchmarking (2 days)
- Load testing (API & DB) (2 days)

---

### Tuần 24: Security & Compatibility
**Tasks:**
- Security audit & penetration testing (2 days)
- Vulnerability scanning (1.5 days)
- Cross-browser testing (1.5 days)
- Bug fixes (2 days)

**Milestone:** ✅ **QA Complete**

---

## Phase 8: Deployment (Tuần 25-27)

### Tuần 25: CI/CD & DevOps
**Tasks:**
- GitHub Actions setup (2 days)
- Docker optimization (1.5 days)
- Production config (1.5 days)
- Monitoring setup (1.5 days)

---

### Tuần 26: Staging & Training
**Tasks:**
- Deploy to staging (1 day)
- Smoke tests & validation (1.5 days)
- Team training (2 days)
- Documentation finalization (2.5 days)

---

### Tuần 27: Launch Preparation
**Tasks:**
- Final testing (1 day)
- Backup & recovery testing (1 day)
- Go-live checklist (1 day)
- Production deployment (1 day)
- Post-launch monitoring (1 day)

**Milestone:** ✅ **PRODUCTION LAUNCH**

---

## Project Timeline Gantt Chart

```
Phase 1: Foundation       [===]  (Weeks 1-3)
Phase 2: Auth            [====]  (Weeks 4-7)
Phase 3: Wallet/TX       [====]  (Weeks 8-11)
Phase 4: Bank            [====]  (Weeks 12-15)
Phase 5: Realtime/Admin  [===]   (Weeks 16-18)
Phase 6: Security        [===]   (Weeks 19-21)
Phase 7: Testing         [===]   (Weeks 22-24)
Phase 8: Deployment      [===]   (Weeks 25-27)
```

---

## Key Milestones & Gate Reviews

| Milestone | Week | Gate Criteria |
|-----------|------|---------------|
| **Foundation** | 3 | ✅ Setup complete, services running |
| **MVP Ready** | 7 | ✅ Auth + UI, all core endpoints |
| **Beta Ready** | 11 | ✅ Wallet + Transactions working |
| **Feature Complete** | 21 | ✅ All features implemented |
| **QA Complete** | 24 | ✅ 90%+ test coverage, security pass |
| **Go-Live** | 27 | ✅ Production ready |

---

## Resource Allocation

### Backend Team (2-3 Developers)
- Phase 1: 1 dev (setup) + 2 devs (auth)
- Phase 2: 3 devs (wallets + transactions)
- Phase 3-8: 2 devs (maintenance + features)

### Frontend Team (2 Developers)
- Phase 1: 1 dev (setup) + 1 dev (boilerplate)
- Phase 2-8: 2 devs (features + UI)

### QA Team (1-2 QA Engineers)
- Phase 1-3: 1 QA (smoke testing)
- Phase 4-8: 2 QA (comprehensive testing)

### DevOps/Infrastructure (1 Engineer)
- All phases: Docker, CI/CD, monitoring

### Project Manager (1 PM)
- All phases: Planning, tracking, communication

**Total Team Size:** 6-8 people

---

## Buffer & Risk Management

- **Buffer Time:** 2-3 weeks built into timeline
- **Risk Contingency:** Each phase has 20% time buffer
- **Critical Path:** Phases 1-3 are critical for MVP
- **Parallel Work:** Phases can overlap (e.g., Phase 2 & 3 frontend work)

---

## Sprint Structure (Agile)

### Sprint Duration: 2 weeks
- **Sprint Planning:** Mondays, 10:00 AM
- **Daily Standup:** 9:30 AM
- **Sprint Review:** Fridays, 4:00 PM
- **Sprint Retro:** Fridays, 4:30 PM

### Deployment Schedule
- **Staging Deploy:** Every Friday
- **Production Deploy:** Bi-weekly (Wednesdays)
- **Hotfixes:** On-demand

---

## Success Metrics

By week 27:
- ✅ 99.9% uptime
- ✅ API response time < 200ms
- ✅ 90%+ test coverage
- ✅ 0 critical bugs
- ✅ 100% documented
- ✅ Team trained & ready
