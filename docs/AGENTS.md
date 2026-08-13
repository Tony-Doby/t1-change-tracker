# AGENTS.md — Quy tắc làm việc cho AI

> File này định nghĩa workflow, constraints và tiêu chuẩn chất lượng mà AI **phải tuân thủ** khi làm việc trên repo T1 Change Tracker.
>
> Đọc song song với `KNOWLEDGE.md` và `CHANGELOG.md`.
> Cập nhật file này khi workflow hoặc policy thay đổi.

---

## 1. Must-read trước khi code

Mỗi lần bắt đầu task mới, AI phải đọc theo thứ tự:

1. **`AGENTS.md`** (file này) — workflow & rules.
2. **`KNOWLEDGE.md`** — constraints kỹ thuật & business rules.
3. **`CHANGELOG.md`** — xác minh trạng thái thực tế của codebase.
4. **`PROGRESS.md`** — nếu cần nối lại công việc đang dang dở.

Nếu task liên quan feature/bug cụ thể:

- Feature active → `PLAN-feature-dev.md`
- Bug active → `PLAN-bug-fixes.md`
- Feature/bug đã xong → `PLAN-feature-archive.md` / `PLAN-bug-archive.md`

---

## 2. Quy tắc workflow cơ bản

### 2.1 Feature/Bug chưa có plan → không code

- Dù là refactor nhỏ hay sửa UI, nếu chưa có plan trong `PLAN-feature-dev.md` hoặc `PLAN-bug-fixes.md` → **phải hỏi user trước**.
- Các plan đã done/fixed được lưu ở `PLAN-feature-archive.md` / `PLAN-bug-archive.md`.
- Refactor nhỏ (< 3 files, không đổi behavior): có thể ghi vào `KNOWLEDGE.md` (coding guideline) rồi làm luôn khi có xác nhận.
- Refactor lớn: phải có plan trong `PLAN-feature-dev.md` với prefix `REFACTOR-xxx`.

### 2.2 Mọi feature phải qua plan

| Loại | Nơi lập plan | Tiêu đề mẫu |
|------|-------------|-------------|
| Feature mới | `PLAN-feature-dev.md` | `FEAT-XXX: <Tên feature>` |
| Refactor lớn | `PLAN-feature-dev.md` | `REFACTOR-XXX: <Tên refactor>` |
| Bug fix | `PLAN-bug-fixes.md` | `BUG-XXX: <Tóm tắt bug>` |

Một plan tối thiểu phải có:

1. Mô tả ngắn gọn.
2. Motivation / Why.
3. Scope (In scope / Out of scope).
4. Files cần sửa / tạo.
5. Schema / SQL changes (nếu có).
6. Test plan.
7. Rollout plan (nếu cần deploy/migration).

### 2.3 Không tự ý commit hoặc deploy

- **Tuyệt đối không** `git commit`, `git push`, `vercel --prod` khi chưa được user yêu cầu rõ ràng từng lần.
- Local repo nằm ở `track-t1-changes/webapp/.git` (không phải root `Main`).
- Nếu user yêu cầu deploy, phải chạy `npm run verify` và `npm run test` trước.

### 2.4 Cập nhật docs sau khi hoàn thành

Sau khi một task hoàn thành, AI phải:

1. Cập nhật status trong `PLAN-feature-dev.md` hoặc `PLAN-bug-fixes.md` (`done` / `fixed`).
2. Ghi nhận vào `CHANGELOG.md` với:
   - Ngày thực hiện.
   - Mô tả thay đổi.
   - Files sửa/tạo.
   - Test results.
   - Lưu ý triển khai (migration, env, Apps Script, v.v.).
3. Nếu feature/bug đã xong hoàn toàn, chuyển sang archive file tương ứng.
4. Nếu phát hiện gotcha mới, cập nhật `KNOWLEDGE.md`.

---

## 3. Quy tắc Unit Test (bắt buộc có điều kiện)

### 3.1 Bắt buộc viết unit test khi

- Thêm/sửa hàm **pure** trong `src/lib/` liên quan đến:
  - Logic tính toán (vd: `addBusinessDays`, `daysSince`).
  - Validation / business rules (vd: `checkEligibility`, `getT1Capacity`).
  - Transform / parse dữ liệu (vd: `evaluateExpression`, `replaceExpressionsInCell`, `pruneTree`).
- **Bug fix**: phải thêm regression test tái hiện bug trước khi fix.
- Hàm utility được dùng ở nhiều nơi.

### 3.2 Không bắt buộc unit test khi

- Thay đổi UI thuần túy: màu sắc, layout, text, tooltip.
- Config, constant, type-only changes.
- Prototype / feature thử nghiệm (phải ghi nhận rõ trong plan).
- React component đơn giản.

### 3.3 Tiêu chí chất lượng test

- Tên test mô tả rõ behavior.
- Test độc lập, không phụ thuộc thứ tự chạy.
- Test output/behavior, không test implementation detail.
- Mock ít nhất có thể; ưu tiên hàm pure không cần mock.
- Mỗi test chỉ assert một khái niệm chính.

### 3.4 Chạy test trước khi coi task xong

```bash
cd track-t1-changes/webapp
npm run test        # unit tests
npm run verify      # tsc + build + eslint
```

Nếu test fail → fix trước khi báo task hoàn thành.

---

## 4. Quy tắc UI/UX

### 4.1 Modal & PageTransition

- `PageTransition` dùng CSS `transform` tạo stacking context mới.
- Mọi modal **phải dùng `createPortal`** render ra `document.body` để tránh bị cắt bởi container cha.
- Modal cần xử lý: focus trap, Escape đóng, backdrop click đóng.

### 4.2 Ngày giờ

- Định dạng: **`dd/mm/yyyy`**.
- Timezone: **`Asia/Ho_Chi_Minh`** (GMT+7).
- Dùng `src/lib/date-utils.ts` (`formatDate`, `formatDateTime`).
- **Không dùng** `toLocaleDateString()` mặc định.

### 4.3 Điều hướng

- Sidebar gom **3 nhóm**: Agent Panel / Tools / Settings.
- Tính năng con hiện dạng **page-tabs** ở đầu nội dung.
- Nguồn điều hướng duy nhất: `src/config/navigation.ts` (`NAV_GROUPS`).
- Route vẫn khai báo riêng ở `App.tsx` — **2 nơi phải khớp path**.
- Phân biệt 2 loại tab:
  - `PageTabs` (`src/ui/navigation/PageTabs.tsx`): điều hướng bằng route, active theo URL.
  - Tab nội-trang (`DriveManagerTabs`, `AgentDetailPage`): quản lý bằng `useState`, không đổi URL.

### 4.4 Soft Delete

- Bảng `agents` và `t1_requests` dùng `deleted_at` (timestamp) cho soft delete.
- Query mặc định phải loại trừ: `.is('deleted_at', null)`.

---

## 5. Quy tắc Supabase / Backend

### 5.1 Schema changes phải chạy tay

- File `supabase/migrations/*.sql` chỉ là file local.
- Sửa schema (thêm cột, bỏ NOT NULL, tạo bảng mới...) **phải chạy `ALTER TABLE` thủ công** trong Supabase SQL Editor.
- Khi tạo bảng mới: nhớ bật `ENABLE ROW LEVEL SECURITY` + thêm policies cho `admin` / `operator` / `viewer`.

### 5.2 RLS

- Role `operator` cần policy INSERT đặc biệt cho các bảng: `t1_changes`, `activity_logs`, `m1_transition_tasks`.
- Nếu tạo bảng mới có logic insert từ frontend → **nhớ test với role operator**.
- PostgreSQL không hỗ trợ `CREATE POLICY IF NOT EXISTS`. Luôn dùng `DROP POLICY IF EXISTS ...` trước khi `CREATE POLICY`.

### 5.3 Max-rows limit

- Supabase REST API giới hạn **1000 rows** mỗi query.
- List + Search: dùng server-side pagination `.range(from, to)`.
- Export toàn bộ: loop query batch 1000 rows.

### 5.4 Auth & Roles

- Supabase Auth + bảng `user_profiles` mở rộng `auth.users`.
- Role mặc định khi tạo user: `operator`.
- Để làm admin: cập nhật `user_profiles.role = 'admin'` trong Supabase Table Editor.

---

## 6. Quy tắc Excel Generator

- Expression parser chỉ chạy trên dòng `template_header_row`.
- Cell chỉ chứa expression thuần túy `(R.num)`, `(dd/mm/yyyy)` → tự động skip mapping.
- Inline refs: `{{Tên Field}}` kết hợp data + expression + text cố định.
- **Không dùng `XLSX.read` cho CSV** — dùng `parseCsvText()` + `readCsvFile()` để giữ text nguyên bản.
- **Không dùng `cellDates: true`** khi đọc file data XLSX — dùng serial + 1900 epoch.
- Toàn bộ date handling theo timezone `Asia/Ho_Chi_Minh`.
- Đổi “Ngày áp dụng cho expression” phải làm preview và file xuất dùng cùng `baseDate`; callback/effect tạo preview phải phụ thuộc `generateDate` (BUG-044).
- `FieldMappingValue` định nghĩa ở 2 nơi (`src/types/index.ts` và `src/lib/excel-generator.ts`) — phải sync cả 2.

Xem chi tiết tại `KNOWLEDGE.md` section 6.

---

## 7. Quy tắc Google Drive Admin

- Thêm action Apps Script mới = sửa **2 nơi** + redeploy:
  1. `ALLOWED_ACTIONS` trong Edge Function `google-apps-script-proxy/index.ts`.
  2. `switch` trong `doPost` của `docs/FEAT-030-apps-script.gs`.
- Sau khi sửa: `supabase functions deploy google-apps-script-proxy` **và** Apps Script → **Deploy → New version**.
- Mọi lệnh Advanced Drive Service trên Shared Drive phải kèm `supportsAllDrives: true`.
- `organizer` chỉ gán được ở cấp Shared Drive, không gán được cho folder/file con.
- Thanh sticky "đã chọn" phải đặt **đỉnh khung bảng**, có nền đục (`bg-bg-primary`) + lớp tint bên trong.

Xem chi tiết tại `KNOWLEDGE.md` section 8.

---

## 8. Quy tắc viết code

### 8.1 Business rules (dễ code sai)

- Chỉ dùng **`staff_id`** làm unique key cho ghi/import. `agent_code` vẫn là field legacy read-only trong runtime; không dùng làm key hoặc thêm logic mới dựa trên field này nếu chưa có plan migration.
- Eligibility: chỉ cần `rank_name != 'ASC'` (không phân biệt hoa thường).
- `old_t1_id` và `temp_t1_id` đều **nullable**.
- Workflow request: **B1 → B2 → B3**. Type/schema vẫn còn `step4`/`step5` tương thích ngược và một số code còn xử lý chúng; xem `KNOWLEDGE.md` trước khi sửa status/query.
- M1 Transition: 30 ngày để chọn T1 mới; T2 đóng vai trò T1 tạm.

### 8.2 Comment TODO

Nếu phát hiện vấn đề nhỏ ngoài scope hiện tại:

```typescript
// TODO-PERF[FEAT-00X]: Query N+1, cần optimize sau
// TODO-UI[BUG-00X]: Chưa test trên Safari
// NOTE: Fallback hardcoded, sẽ bỏ khi DB đủ data
```

Sau khi hoàn thành task, quét toàn bộ `TODO` để chuyển thành plan chính thức.

### 8.3 TypeScript

- Import `describe, it, expect` từ `vitest` trong từng test file (không dùng `globals: true`).
- Tránh `any`; ưu tiên type từ `src/types/index.ts`.

---

## 9. Quy tắc documentation

- Khi phát hiện gotcha mới → cập nhật `KNOWLEDGE.md`.
- Khi hoàn thành feature/bug → ghi `CHANGELOG.md`.
- Khi workflow/policy thay đổi → cập nhật `AGENTS.md`.
- `UI-DESIGN.md` và `PLAN-t1-change-tracker.md` có một số phần lỗi thờivề workflow 5 bước và `agent_code`. Khi conflict → ưu tiên code reality + `CHANGELOG.md` + `KNOWLEDGE.md`.

---

## 10. Terminology & Branding

- Tên app: **TDhome**.
- Header app: **"Nhà của Tony!"**.
- Mã nhân viên/agent: **`staff_id`** (không dùng `agent_code`).
- Workflow: **B1 / B2 / B3**.
- T1 cũ → T1 mới; M1 = ngườii dưới line; T2 = T1 tạm trong M1 transition.

---

## 11. Checklist trước khi báo task xong

- [ ] Code hoạt động đúng theo plan.
- [ ] `npm run test` pass.
- [ ] `npm run verify` pass (tsc + build + lint).
- [ ] Unit test đã viết cho logic pure / bug fix (nếu thuộc diện bắt buộc).
- [ ] `CHANGELOG.md` đã cập nhật.
- [ ] `PLAN-feature-dev.md` / `PLAN-bug-fixes.md` đã cập nhật status.
- [ ] `KNOWLEDGE.md` đã cập nhật nếu có gotcha mới.
- [ ] Không tự ý commit/deploy nếu chưa được yêu cầu.

---

*Lần cập nhật: 2026-08-12*
