# 🔄 Workflow: Feature Lifecycle

## Vòng đời Tính năng – Từ Ý tưởng đến Production

```
[Idea] → [Design] → [Dev] → [Review] → [QA] → [Staging] → [Production]
```

## Giai đoạn 1: Ý tưởng & Phân tích

**Ai làm**: Project Manager + Systems Architect

1. Nhận yêu cầu từ stakeholder / user feedback
2. Làm rõ yêu cầu (dùng `prompts/ask-missing-info.md`)
3. Xác định scope và dependencies
4. Ước lượng effort (story points)
5. Thêm vào backlog / sprint planning

**Output**: User story, acceptance criteria

## Giai đoạn 2: Thiết kế

**Ai làm**: Systems Architect + UI/UX Designer

1. UI/UX Designer tạo wireframe + mockup
2. Systems Architect viết ADR nếu cần thay đổi kiến trúc
3. Backend Lead thiết kế API contract
4. Frontend Lead review API contract
5. Review và approve design

**Output**: Figma mockup, API design doc, ADR (nếu có)

## Giai đoạn 3: Development

**Ai làm**: Backend Lead + Frontend Lead

1. Tạo branch: `feature/<scope>-<description>`
2. Backend implement: schema → service → controller → test
3. Frontend implement: types → hooks → components → test
4. Daily standup để sync tiến độ
5. Code review lẫn nhau trong team

**Output**: Code + test + passing CI

## Giai đoạn 4: Code Review

**Ai làm**: Peer review + Tech Lead review

1. Tạo PR theo mẫu `templates/pr-template.md`
2. Tự review lại theo checklist `commands/review.md`
3. Request review từ 2 người
4. Address tất cả comment
5. CI phải pass trước khi merge

**Output**: Approved PR

## Giai đoạn 5: QA

**Ai làm**: QA Engineer

1. Deploy lên môi trường dev/staging
2. Test theo test case trong `skills/testing-flows/`
3. Test edge cases và regression
4. Report bug (nếu có) vào `context/known-bugs.md`
5. Sign-off khi pass

**Output**: QA sign-off

## Giai đoạn 6: Staging

1. Merge vào main → tự động deploy staging
2. Smoke test trên staging
3. Stakeholder demo (nếu cần)
4. Performance test nếu là tính năng lớn

## Giai đoạn 7: Production Release

Theo `workflows/release-process.md`

## Definition of Done (DoD)

Tính năng được coi là HOÀN THÀNH khi:
- [ ] Code implement đầy đủ
- [ ] Unit test coverage đạt ngưỡng theo `rules/testing.md`
- [ ] Integration test pass
- [ ] Code review approved (≥ 2 approvers)
- [ ] QA sign-off
- [ ] Documentation cập nhật
- [ ] No open P1/P2 bugs liên quan
- [ ] Deployed và verified trên staging
