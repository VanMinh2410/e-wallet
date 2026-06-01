# Day 3 (May 22) - Tasks & Deliverables

## 🎯 Focus: Database Schema & Data Model

### Morning (9:00 - 12:00)

#### Task 3.1: Refine MongoDB Collections
- **Owner**: Backend Lead + DB Architect
- **Duration**: 3h
- **Steps**:
  1. Review existing DB_DESIGN.md (30 phút)
  2. Thêm field details & validation rules (1h)
  3. Xác định indexes & TTL policies (1h)
  4. Define enum values & constraints (30 phút)
- **Deliverable**: DB_DESIGN.md updated with full schema details
- **Acceptance**: All 8 collections defined with field types, validation, indexes

#### Task 3.2 (Concurrent): ER Diagram MongoDB
- **Owner**: Backend Lead
- **Duration**: 2h (can overlap with 3.1)
- **Steps**:
  1. Vẽ relationships giữa collections (1h)
  2. Xác định foreign keys pattern (documents thay vì relational joins) (30 phút)
  3. Document embedding vs. linking decisions (30 phút)
- **Deliverable**: ER diagram (ASCII/Mermaid or image) in DB_DESIGN.md
- **Acceptance**: Diagram shows all collections & their relationships

### Afternoon (13:00 - 17:00)

#### Task 3.3: Draft Mongoose Schemas (TypeScript)
- **Owner**: Backend Lead
- **Duration**: 3h
- **Steps**:
  1. Create folder structure: `backend/src/database/schemas/`
  2. User.schema.ts - skeleton with validation (45 phút)
  3. Wallet.schema.ts - skeleton (45 phút)
  4. Transaction.schema.ts - skeleton (45 phút)
  5. Bank.schema.ts - skeleton (30 phút)
- **Deliverable**: 4 schema files in backend/src/database/schemas/
- **Acceptance**: Schemas are skeletons (NOT finalized), match DB_DESIGN.md

#### Task 3.4: Migration Strategy
- **Owner**: Backend Lead
- **Duration**: 1h
- **Steps**:
  1. Create `backend/src/database/migrations/` folder
  2. Document migration approach (versioning, rollback) (30 phút)
  3. Create sample migration template (30 phút)
- **Deliverable**: DB_DESIGN.md section "Migrations" + migration template
- **Acceptance**: Clear strategy for managing schema evolution

---

## 📊 Deliverables Location

- **DB_DESIGN.md** - updated in docs/
- **Mongoose schemas** - in `backend/src/database/schemas/`
- **ER Diagram** - in `stage1/day3/` (if image format)
- **Migration templates** - in `backend/src/database/migrations/`

---

## ✅ End-of-Day Checklist

- [ ] DB_DESIGN.md complete with all 8 collections
- [ ] ER diagram created (Mermaid or image)
- [ ] 4 Mongoose schema skeletons created
- [ ] Migration folder & template created
- [ ] Backend lead reviewed all schemas for correctness

---

## 📝 Notes
- Mongoose schemas should have inline comments explaining each field
- TTL indexes must be documented (e.g., refresh tokens, OTP records)
- Keep schemas as skeletons - full implementation is in Phase 2
- Migration strategy should support zero-downtime deployments
