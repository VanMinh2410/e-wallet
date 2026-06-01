# Backlog & Phân công nhiệm vụ (Giai đoạn MVP)

## Tổng quan backlog (Epic -> Stories -> Tasks)

### Epic A: Foundation & Infra
- Story A1: Khởi tạo dự án backend (NestJS)
  - Task: init repo, eslint, tsconfig (Assignee: Backend-1)
  - Task: DB config (MongoDB) (Backend-1)
  - Task: Redis setup (DevOps)
- Story A2: Khởi tạo frontend (React + Vite)
  - Task: project scaffold, routing (Frontend-1)
  - Task: global styles & theme (Frontend-1)

### Epic B: Authentication
- Story B1: Register/Login
  - Task: API endpoints (Backend-1)
  - Task: JWT + refresh tokens (Backend-1)
  - Task: UI: Login/Register (Frontend-1)
- Story B2: OTP verification
  - Task: OTP service (Redis) (Backend-2)
  - Task: UI: OTP modal (Frontend-1)

### Epic C: Wallet & Transactions
- Story C1: Wallet CRUD
  - Task: Wallet model & API (Backend-2)
  - Task: Wallet UI (Frontend-2)
- Story C2: Transfer money
  - Task: Transfer API & transaction atomic (Backend-1)
  - Task: Transfer form + confirm modal (Frontend-2)
  - Task: Socket.IO events (Backend-2 + Frontend-2)
- Story C3: Transaction history
  - Task: API history + filters (Backend-1)
  - Task: UI list & pagination (Frontend-2)

### Epic D: Deposit & Withdraw
- Story D1: Deposit flow
  - Task: Create deposit request (Backend-2)
  - Task: Webhook handler (Backend-2)
  - Task: Deposit UI (Frontend-1)
- Story D2: Withdraw flow
  - Task: Withdrawal request API (Backend-1)
  - Task: Admin approval endpoint (Backend-1)
  - Task: Withdraw UI (Frontend-2)

### Epic E: Admin
- Story E1: Admin basic
  - Task: Users list API (Backend-2)
  - Task: Transactions approval API (Backend-1)
  - Task: Admin UI (Frontend-Admin)

## Sprint plan (Sprint 1: 2 tuần)
- Goal: Foundation + Auth basic
- Assigned:
  - Backend-1: init backend, auth endpoints, JWT
  - Backend-2: DB, redis, OTP service
  - Frontend-1: init frontend, login/register UI
  - DevOps: docker-compose, local setup

## Sprint 2 (2 tuần)
- Goal: Wallet CRUD + Transfer core
- Assigned:
  - Backend-1: transfer API, transaction model
  - Backend-2: wallet model, socket events
  - Frontend-2: wallet UI, transfer form
  - QA: write integration tests

## Task sizing (T-shirt)
- Small: < 1 day
- Medium: 1-3 days
- Large: > 3 days

## Initial assignments (suggested)
- Backend Lead: Backend-1
- Backend Engineer: Backend-2
- Frontend Lead: Frontend-1
- Frontend Engineer: Frontend-2
- DevOps: DevOps
- QA: QA
- PM: Project Manager

## How to use this backlog
- Move Stories into current sprint board
- Break stories into issues in GitHub with labels: `backend/frontend/infra/qa`
- Add estimates and assignees on GitHub issues

---

## Quick start checklist for Sprint 1
- [ ] Create GitHub repo and branches (main, develop)
- [ ] Setup docker-compose local (MongoDB, Redis)
- [ ] Create initial issues from Story list
- [ ] Assign team and start work

Kết luận: Backlog này đủ để bắt đầu 2 sprint đầu và dễ dàng mở rộng.