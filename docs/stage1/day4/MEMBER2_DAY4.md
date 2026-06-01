# Day 4 - Member 2 (Tech Lead/Backend Architect)

## 📋 Assigned Tasks

### Task 4.1: Define API Endpoints cho MVP
- **Duration**: 3h (9:00 - 12:00)
- **Steps**:
  1. Auth endpoints: register, login, logout, OTP verify (45 phút)
  2. Wallet endpoints: list, create, get, update (45 phút)
  3. Transaction: transfer, deposit, withdraw, history, approve (45 phút)
  4. Admin: user list, transaction approve (30 phút)
- **Deliverable**: API_SPEC.md finalized
- **Acceptance**: 20+ endpoints defined with full request/response specs

### Task 4.2 (Concurrent): Create API schemas & types
- **Duration**: 2h (10:00 - 12:00)
- **Steps**:
  1. Create `backend/src/types/api.types.ts` with Zod schemas
  2. Define DTO (Data Transfer Objects) for each endpoint
  3. Define error response types
- **Deliverable**: api.types.ts file in backend/src/types/
- **Acceptance**: All endpoints have typed request/response

### Task 4.3 (Afternoon): Create backend folder structure
- **Duration**: 1.5h (13:00 - 14:30)
- **Steps**:
  1. Create folder structure:
     - src/modules/ (auth, users, wallets, transactions, etc.)
     - src/services/ (business logic)
     - src/controllers/ (route handlers)
     - src/guards/ (auth, rate-limit)
     - src/filters/ (error handling)
  2. Create module.ts skeletons
- **Deliverable**: Backend folder structure created
- **Acceptance**: Project structure is clean & scalable

### Task 4.4 (Afternoon): Estimate & plan backend tasks
- **Duration**: 1.5h (14:30 - 16:00)
- **Steps**:
  1. Review BACKLOG.md from Member 1
  2. Estimate backend task sizes (S/M/L story points)
  3. Identify dependencies & critical path
  4. Add to SPRINT1_PLAN.md
- **Deliverable**: Backend task estimates in SPRINT1_PLAN.md
- **Acceptance**: Task estimates are realistic

---

## 📝 Collaboration Notes
- Coordinate with Member 1 on feature complexity & priorities
- API schema file will be shared between backend & frontend
- Backend structure will guide Sprint 1 development

---

## ✅ End-of-Day Checklist

- [ ] API_SPEC.md finalized
- [ ] api.types.ts created with Zod schemas
- [ ] Backend folder structure created
- [ ] Task estimates added to SPRINT1_PLAN.md
- [ ] Backend tasks clearly defined for Phase 2
