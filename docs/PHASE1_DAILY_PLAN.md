# Phase 1: Phân tích & Thiết kế - Kế hoạch 5 ngày chi tiết

## Mục tiêu chung
Hoàn thành yêu cầu, thiết kế hệ thống, và sẵn sàng để Phase 2 (Development) bắt đầu.

---

## 📅 Ngày 1 (MAY 20): Yêu cầu & MVP Chốt

### Sáng (9:00 - 12:00)
**Task 1.1: Review yêu cầu nghiệp vụ từ stakeholders**
- Họp với team để xác nhận scope (1 giờ)
- Làm rõ target users, pain points, unique selling points (30 phút)
- Ghi lại constraints: bảo mật, throughput, compliance (30 phút)
- **Deliverable**: REQUIREMENTS.md hoàn tất (✅ Đã có)

**Task 1.2: Chốt MVP - Features bắt buộc vs. Future**
- Review danh sách đầy đủ từ Stakeholder
- Lọc theo "must-have", "nice-to-have", "future"
- Viết acceptance criteria cho mỗi feature MVP (2 giờ)
- **Deliverable**: MVP.md hoàn tất (✅ Đã có)

### Chiều (13:00 - 17:00)
**Task 1.3: Security & Performance requirements**
- Định nghĩa SLA: API latency, uptime, throughput (1 giờ)
- Danh sách bảo mật: encryption, auth, rate limit (1.5 giờ)
- Ghi vào REQUIREMENTS.md phần "Non-functional" (1 giờ)
- **Deliverable**: REQUIREMENTS.md phần NFR updated

**Task 1.4: Tạo ban sơ Gantt chart (5 ngày + 2 Sprint sau)**
- Ghi vào file PHASE1_TIMELINE.md
- Phân bổ task theo ngày hôm nay
- **Deliverable**: PHASE1_TIMELINE.md tạo

### Kết thúc ngày 1
- [ ] REQUIREMENTS.md final
- [ ] MVP.md final
- [ ] PHASE1_TIMELINE.md created
- [ ] Team alignment on scope

---

## 📅 Ngày 2 (MAY 21): Luồng người dùng & Wireframe

### Sáng (9:00 - 12:00)
**Task 2.1: Vẽ User Flows chính**
- Luồng đăng ký/login (30 phút)
- Luồng chuyển tiền (45 phút)
- Luồng nạp/rút (45 phút)
- Luồng Admin (30 phút)
- **Deliverable**: USER_FLOWS.md tái cập nhật chi tiết (✅ Đã có)

**Task 2.2: Tạo Flowchart trong lucidchart / draw.io (optional)**
- Upload diagram cho team review
- **Deliverable**: PNG/SVG flowcharts (nếu có thời gian)

### Chiều (13:00 - 17:00)
**Task 2.3: Sketch Wireframe cơ bản**
- Dashboard mockup (Figma/Balsamiq - 1.5 giờ)
- Transfer form mockup (45 phút)
- Transaction list mockup (45 phút)
- **Deliverable**: UI_UX.md tái cập nhật + wireframe images

**Task 2.4: Design System - Colors, Typography, Components**
- Define color palette (xanh dương trust, vàng warning)
- Define button styles, card layout
- Responsive grid (mobile-first)
- **Deliverable**: Design guide add vào UI_UX.md

### Kết thúc ngày 2
- [ ] USER_FLOWS.md final
- [ ] UI_UX.md updated + wireframes
- [ ] Design system drafted

---

## 📅 Ngày 3 (MAY 22): Database Schema & Data Model

### Sáng (9:00 - 12:00)
**Task 3.1: Refine MongoDB Collections**
- Review existing DB_DESIGN.md (✅ Đã có)
- Thêm field details & validation rules (1.5 giờ)
- Xác định indexes & TTL policies (1 giờ)
- **Deliverable**: DB_DESIGN.md updated

**Task 3.2: ER Diagram MongoDB**
- Vẽ relationships giữa collections (1.5 giờ)
- Xác định foreign keys pattern (documents thay vì relational joins)
- Ghi vào DB_DESIGN.md
- **Deliverable**: ER diagram (text or image)

### Chiều (13:00 - 17:00)
**Task 3.3: Draft Mongoose Schemas (TypeScript)**
- Tạo folder `backend/src/database/schemas/`
- User.schema.ts - skeleton (45 phút)
- Wallet.schema.ts - skeleton (45 phút)
- Transaction.schema.ts - skeleton (45 phút)
- Bank.schema.ts - skeleton (30 phút)
- **Deliverable**: 4 schema files (skeleton, NOT finalized)

**Task 3.4: Migration strategy**
- Ghi vào DB_DESIGN.md cách quản lý schema changes
- Ví dụ: migrations folder structure
- **Deliverable**: DB_DESIGN.md section "Migrations"

### Kết thúc ngày 3
- [ ] DB_DESIGN.md final
- [ ] Mongoose schema skeletons created
- [ ] Migration strategy documented

---

## 📅 Ngày 4 (MAY 23): API Spec & Backlog Refinement

### Sáng (9:00 - 12:00)
**Task 4.1: Define API Endpoints cho MVP**
- Auth: register, login, logout, OTP verify (30 phút)
- Wallet: list, create, get, update (30 phút)
- Transaction: transfer, deposit, withdraw, history (45 phút)
- Admin: user list, transaction approve (30 phút)
- **Deliverable**: API_SPEC.md tái cập nhật (✅ Đã có - review & finalize)

**Task 4.2: Request/Response schemas**
- Write Zod/TypeScript interfaces cho mỗi endpoint
- Error codes & status
- **Deliverable**: api_schemas.ts skeleton (create in backend/)

### Chiều (13:00 - 17:00)
**Task 4.3: Refine Backlog - Stories & Tasks**
- Review BACKLOG.md (✅ Đã có)
- Break down each Story vào concrete Tasks
- Thêm acceptance criteria
- **Deliverable**: BACKLOG.md updated with detailed tasks

**Task 4.4: Create GitHub Issues template**
- Create GitHub issue templates (.github/ISSUE_TEMPLATE/)
- Add labels: `backend`, `frontend`, `infra`, `bug`, `epic`, etc.
- Create sample issues từ 2 stories đầu
- **Deliverable**: GitHub issues created + labels

### Kết thúc ngày 4
- [ ] API_SPEC.md final
- [ ] api_schemas.ts skeleton created
- [ ] BACKLOG.md refined with detailed tasks
- [ ] GitHub issues & labels created

---

## 📅 Ngày 5 (MAY 24): Team Sync, Documentation Review & Kickoff

### Sáng (9:00 - 12:00)
**Task 5.1: Internal Review & Alignment**
- PM + Tech Lead review all docs (1 giờ)
- Fix inconsistencies, gaps (1 giờ)
- Q&A session với team (1 giờ)
- **Deliverable**: All docs consistent & final

**Task 5.2: Create Phase1 Summary Document**
- 1-page overview: goals achieved, deliverables, next steps
- Summary of MVP, tech stack decisions
- **Deliverable**: PHASE1_SUMMARY.md created

### Chiều (13:00 - 17:00)
**Task 5.3: Team Kickoff Presentation (1.5 giờ)**
- Present: Requirements, MVP, User flows, API spec, Backlog
- Live Q&A, address concerns (1.5 giờ)
- Assign tasks for Sprint 1
- **Deliverable**: Team aligned & ready to code

**Task 5.4: Setup repo & CI/CD skeleton**
- Create GitHub repo (if not exist)
- Add .github/workflows/ skeleton (CI test, lint, build)
- Add initial branch protection rules
- **Deliverable**: Repo ready for development

### Kết thúc ngày 5 (EOD)
- [ ] All Phase 1 docs finalized
- [ ] Team sync & alignment
- [ ] GitHub repo & CI/CD ready
- [ ] Phase 2 (Development) can start immediately Monday

---

## 📊 Checklist - Deliverables Phase 1

### Documentation (✅ Ready)
- [x] REQUIREMENTS.md - business & non-functional requirements
- [x] MVP.md - 10 core features + success criteria
- [x] USER_FLOWS.md - 7 main user flows
- [x] DB_DESIGN.md - 8 MongoDB collections
- [x] UI_UX.md - wireframes & design system
- [x] BACKLOG.md - 5 Epics, 15+ Stories, 50+ Tasks
- [x] API_SPEC.md - 20+ endpoints

### Technical Artifacts
- [x] Mongoose schema skeletons (4 main schemas)
- [x] api_schemas.ts structure
- [ ] GitHub Issues (20-30) - created Day 5

### Team Artifacts
- [ ] PHASE1_SUMMARY.md - 1-pager
- [ ] PHASE1_TIMELINE.md - daily plan
- [ ] Figma/wireframes shared link (optional)

### Repository Setup
- [ ] GitHub repo with branch protection
- [ ] .github/workflows/ with CI skeleton
- [ ] Initial README with dev setup
- [ ] CONTRIBUTING.md guidelines

---

## 🎯 Daily Stand-up Points

**Day 1**: "MVP & requirements locked. Security & SLA defined."
**Day 2**: "User flows & wireframes complete. Design system ready."
**Day 3**: "Database schema finalized. Mongoose skeletons done."
**Day 4**: "API spec complete. Backlog refined with tasks. Issues created."
**Day 5**: "Docs aligned. Team kickoff done. Ready to code."

---

## ⏰ Time Allocation (40 hours total)

| Ngày | Morning (3h) | Afternoon (4h) | Total |
|------|-------------|----------------|-------|
| Day 1 | Req + MVP (3h) | Security + Gantt (4h) | 7h |
| Day 2 | Flows (3h) | Wireframe + Design (4h) | 7h |
| Day 3 | DB Schema (3h) | Mongoose + Migration (4h) | 7h |
| Day 4 | API Spec (3h) | Backlog + GitHub (4h) | 7h |
| Day 5 | Review + Alignment (3h) | Kickoff + Repo (4h) | 7h |
| **TOTAL** | | | **35h** |

*Note: 5 hours buffer cho unexpected issues*

---

## ✅ Success Criteria - End of Phase 1

1. ✅ All 7 core docs complete & peer-reviewed
2. ✅ MVP features locked (no scope creep)
3. ✅ Tech team confident in architecture
4. ✅ Backlog ready for Sprint 1 (20-25 story points)
5. ✅ GitHub repo & CI/CD skeleton ready
6. ✅ Team can start coding Phase 2 without waiting
7. ✅ All Q&A resolved, decisions documented

---

## Notes & Risk Mitigation

- **Risk**: Stakeholder unclear on MVP → Mitigation: Early review on Day 1, lock scope quickly
- **Risk**: Database design conflicts → Mitigation: Tech lead review on Day 3
- **Risk**: Team not aligned → Mitigation: Written decision log, Day 5 kickoff

---

**Good luck! 🚀 Phase 1 is about clarity & alignment, not perfection. Once docs are 80% finalized, move to Phase 2.**