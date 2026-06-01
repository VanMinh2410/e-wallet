# Day 3 - Member 2 (Tech Lead/Backend Architect)

## 📋 Assigned Tasks

### Task 3.1: Refine MongoDB Collections & Schema
- **Duration**: 3h (9:00 - 12:00)
- **Steps**:
  1. Review existing DB_DESIGN.md (30 phút)
  2. Add field details, types & validation rules (1h)
  3. Xác định indexes & TTL policies (1h)
  4. Define enum values & constraints (30 phút)
- **Deliverable**: DB_DESIGN.md updated with complete collection specs
- **Acceptance**: All 8 collections defined (users, wallets, transactions, bank_accounts, refresh_tokens, otp_records, audit_logs, notifications)

### Task 3.2 (Concurrent): Create ER Diagram MongoDB
- **Duration**: 2h (9:30 - 11:30)
- **Steps**:
  1. Vẽ relationships giữa collections (1h)
  2. Document embedding vs. reference decisions (45 phút)
  3. Create diagram (Mermaid or PNG) (15 phút)
- **Deliverable**: ER diagram in DB_DESIGN.md + visual in stage1/day3/
- **Acceptance**: Diagram shows all collections & relationships clearly

### Task 3.3 (Afternoon): Draft Mongoose Schemas (TypeScript)
- **Duration**: 3h (13:00 - 16:00)
- **Steps**:
  1. Create folder: `backend/src/database/schemas/`
  2. User.schema.ts - skeleton with types & validation (45 phút)
  3. Wallet.schema.ts - skeleton (45 phút)
  4. Transaction.schema.ts - skeleton with atomicity notes (45 phút)
  5. Bank.schema.ts - skeleton (30 phút)
- **Deliverable**: 4 Mongoose schema files
- **Acceptance**: Schemas are skeletons matching DB_DESIGN.md, with TypeScript types

### Task 3.4 (Late Afternoon): Migration & Seed Strategy
- **Duration**: 1h (16:00 - 17:00)
- **Steps**:
  1. Create `backend/src/database/migrations/` folder
  2. Document migration versioning approach
  3. Create seed data template (test data for development)
- **Deliverable**: migration/ & seeds/ folders with templates
- **Acceptance**: Clear path for schema evolution

---

## 📝 Collaboration Notes
- Sync with Member 1 on data fields needed for UI (forms, display)
- Mongoose schemas should have inline TypeScript types
- Keep schemas as skeletons - detailed implementation in Phase 2

---

## ✅ End-of-Day Checklist

- [ ] DB_DESIGN.md complete (8 collections)
- [ ] ER diagram created
- [ ] 4 Mongoose schema skeletons created
- [ ] Migration & seed folders created
- [ ] All schemas reviewed for correctness
