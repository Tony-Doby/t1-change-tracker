# Plan Feature Development — T1 Change Tracker

> File này dùng để lập kế hoạch chi tiết cho **từng feature mới** trước khi tiến hành code.  
> Quy tắc: **Mỗi feature phải có 1 plan rõ ràng trong file này trước khi code.**  
> Sau khi hoàn thành, cập nhật trạng thái `status: done` và ghi vào `CHANGELOG.md`.

---

## Template cho mỗi feature

```markdown
### FEAT-{id}: {Tiêu đề ngắn gọn}

- **Đề xuất**: {Ngày đề xuất}
- **Status**: `backlog` | `planned` | `in_progress` | `done` | `cancelled`
- **Priority**: `critical` | `high` | `medium` | `low`

#### 1. Mô tả feature
{Mô tả chi tiết tính năng cần làm}

#### 2. Motivation / Why
{Tại sao cần feature này? Vấn đề hiện tại? Lợi ích mang lại?}

#### 3. Scope

**In scope:**
- {Những gì sẽ làm}

**Out of scope:**
- {Những gì KHÔNG làm trong plan này}

#### 4. Technical Design
{Kiến trúc, approach, thư viện cần dùng, flow xử lý}

#### 5. UI/UX (nếu có)
{Mockup, wireframe, flow ngườii dùng, interaction}

#### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `path/to/file.ts` | {Mô tả} |

#### 7. Schema / SQL changes
{ALTER TABLE, migration file, new tables, indexes, v.v.}

#### 8. API / Integration changes
{New endpoints, RPC functions, third-party API (SendGrid, v.v.)}

#### 9. Test Plan
{Bước test để verify feature hoạt động đúng}

#### 10. Rollout Plan
{Cách deploy, feature flag (nếu có), migration data}

#### 11. Notes
{Lưu ý triển khai, rủi ro, rollback plan, dependencies}
```

---

## Feature Registry

| ID | Tiêu đề | Status | Đề xuất | Hoàn thành |
|----|---------|--------|---------|------------|
| 002 | Supabase Realtime updates (comments, status, sidebar badge) | done | 2026-05-28 | 2026-06-19 |
| 004 | Refactor pages sang TanStack Query | done | 2026-05-28 | 2026-05-30 |
| 005 | Search/Filter server-side cho presets phức tạp | backlog | 2026-05-28 | — |
| 008 | Division Safety Net — Force Recompute & getAgentDivision RPC | fixed | 2026-05-29 | 2026-05-29 |
| 009 | Dashboard stat cards navigation (→ Agents / Requests / Filter) | done | 2026-05-29 | 2026-06-15 |
| 010 | Requests multi-choice status filter (toggle on/off) | done | 2026-05-29 | 2026-06-15 |
| 011 | Ranks modal CRUD (popup Thêm/Sửa, bỏ footer form) | done | 2026-05-29 | 2026-06-15 |
| 012 | Divisions modal CRUD + table height (popup Thêm/Sửa, bỏ max-h) | done | 2026-05-29 | 2026-06-15 |
| 013 | M1 Transition — Search, T1 cũ + Lý do, Email Tracking | done | 2026-05-29 | 2026-06-15 |
| 018 | ComposeTemplateModal — Refactor email section (1 section, 4 emails, copy từng email) | done | 2026-05-29 | 2026-06-15 |
| REFACTOR-005 | Twenty UI/UX Full Adoption (Tailwind v4 Preserve) | done | 2026-06-04 | 2026-06-05 |
| REFACTOR-006 | ESLint Cleanup — Fix 172 lint errors across codebase | done | 2026-06-19 | 2026-06-25 |
| 024 | Testing Infrastructure — Smoke Test + Unit Test (Vitest) | done | 2026-06-10 | 2026-06-10 |
| 025 | Email Activities Table cho M1 Transition Tracking | done | 2026-06-11 | 2026-06-11 |
| 026 | Delete Email Template | done | 2026-06-12 | 2026-06-12 |
| 027 | Gửi email qua Google Apps Script | backlog | 2026-06-12 | — |
| 028 | Dashboard M1 Transition Enhancement | done | 2026-06-15 | 2026-06-15 |
| 029 | Dashboard Full-Viewport Layout — M1 Transition Fill Remaining Height | done | 2026-06-15 | 2026-06-15 |
| 030 | Google Apps Script Admin Panel — Drive Operations | done | 2026-06-26 | 2026-06-26 |

---

## FEAT-024: Testing Infrastructure — Smoke Test + Unit Test (Vitest)

- **Đề xuất**: 2026-06-10
- **Status**: `done`
- **Priority**: `high`
- **Hoàn thành**: 2026-06-10

### 1. Mô tả feature
Triển khai **2 lớp bảo vệ** để đảm bảo các tính năng cũ không bị vỡ sau mỗi lần sửa code:

**Option 1 — Smoke Test + Build Verification:**
- Script `npm run verify` chạy `tsc -b && vite build && eslint .`
- File `docs/SMOKE-TEST.md` liệt kê 15 trang + luồng chính, test thủ công sau mỗi lần sửa code.

**Option 2 — Unit Test với Vitest:**
- Cài `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Viết unit test cho các hàm pure: `eligibility.ts`, `date-utils.ts`, `excel-generator.ts` (expression parser)

### 2. Motivation / Why
- Hiện tại mỗi lần sửa code không có cách nào nhanh để biết tính năng cũ có bị vỡ không.
- `npm run build` chỉ check type + bundle, không check logic.
- Eligibility rules (90 ngày, 180 ngày, 3 lần, ASC) là business-critical — cần test tự động để tránh regression.
- Expression parser trong Excel Generator đã từng bị bug nhiều lần (BUG-015, BUG-031, BUG-032) — cần test suite bảo vệ.

### 3. Scope

**In scope:**
- Build verification script (`npm run verify`)
- Smoke Test Checklist (`docs/SMOKE-TEST.md`) cover 15 routes
- Vitest setup + config
- Unit tests cho `src/lib/eligibility.ts` (tất cả exported functions)
- Unit tests cho `src/lib/date-utils.ts` (formatDate, formatDateTime, formatTime)
- Unit tests cho `src/lib/excel-generator.ts` (expression parser: `evaluateExpression`, `replaceExpressionsInCell`)

**Out of scope:**
- Không viết E2E test (Playwright) — để sau
- Không test React components (quá nhiều, để Phase 2)
- Không test Supabase RPC calls (cần mock phức tạp, để sau)
- Không CI/CD automation — chỉ chạy local

### 4. Technical Design

#### 4.1 Build Verification
Thêm script vào `package.json`:
```json
"verify": "tsc -b && vite build && eslint .",
"test": "vitest run",
"test:watch": "vitest"
```

#### 4.2 Smoke Test Checklist
File `webapp/docs/SMOKE-TEST.md` gồm 3 phần:
1. **Pre-check**: `npm run verify` pass
2. **Page-by-Page Checklist** (15 routes):
   - Login → phân quyền
   - Dashboard → stat cards, B2 eligible, M1 Transition
   - Agents → list, search, filter, pagination, bookmark, bulk actions
   - Agent Detail → info, M1 table, T1 history, deactivate/restore
   - Requests → list, multi-choice filter, kanban
   - Request Detail → timeline, comments, approve/reject
   - Upload → import agent, validate, preview
   - Email Templates → list, edit, preview, compose
   - Activity Log → timeline, filter
   - Trash → restore, permanent delete
   - Holidays / Ranks / Divisions → CRUD
   - Excel Generator → templates, generate, history, upline lookup
   - Change Password
3. **Business Logic Regression** (5 luồng cốt lõi):
   - Tạo request đổi T1 → eligibility check đúng
   - Hoàn tất request → M1 transition tasks tạo đúng
   - Upload agent → upsert theo `staff_id`
   - Export Excel → file tải về đúng
   - Generate mail merge → expression evaluate đúng

Mỗi mục có checkbox `[ ]` để đánh dấu.

#### 4.3 Vitest Setup
- Cài packages: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitest/coverage-v8` (optional)
- Tạo `vitest.config.ts` (hoặc dùng `vite.config.ts`):
  - `test.environment: 'jsdom'`
  - `test.globals: true` (để dùng `describe`, `it`, `expect` không cần import)
  - `test.include: ['src/**/*.test.ts']`
- Tạo `src/test/setup.ts` import `@testing-library/jest-dom`

#### 4.4 Unit Test — `eligibility.ts`
Test các hàm:
- `checkEligibility()` — tất cả scenarios:
  - Agent không tồn tại
  - `proposedT1Id = null`
  - `proposedT1Id === agentId`
  - `proposedT1Id === current_t1_id`
  - Trong 90 ngày: đã đổi 0 lần vs >=1 lần
  - >90 ngày: đổi <3 lần vs >=3 lần
  - Rank ASC vs không ASC
  - `daysSinceLastChange < 180` vs >=180
  - `rankNamesMap` lookup
- `getT1Capacity()` — đếm M1, recent accept
- `isBusinessDay()` — thứ 7, CN, holiday
- `addBusinessDays()` — cộng trừ đúng ngày
- `checkCanChooseNewT1()` — tương tự `checkEligibility` nhưng output khác
- `getM1ImpactSummary()` — aggregate đúng

#### 4.5 Unit Test — `date-utils.ts`
Test `formatDate()`, `formatDateTime()`, `formatTime()`:
- Input `null` / `undefined` → `'—'`
- Input string ISO → format đúng `dd/mm/yyyy`
- Input Date object → format đúng
- Timezone Asia/Ho_Chi_Minh (không bị lệch UTC)

#### 4.6 Unit Test — `excel-generator.ts` (Expression Parser)
Test `evaluateExpression()` và `replaceExpressionsInCell()`:
- `(ddmmyy)` → đúng ngày
- `(dd/mm/yyyy)` → đúng format
- `([dd-1]mmyy)` → ngày trừ 1
- `(R.num)` → row index + 1
- `([R.num-1])` → row index
- `(ddmmyyyy)` + baseDate cụ thể → verify output
- Literal mix: `So (dd) thang (mm) nam (yyyy)` → replace đúng từng token
- Không replace ngoài dấu `()`: `abc ddmmyy xyz` → giữ nguyên

### 5. UI/UX
Không có UI mới — đây là infrastructure.

### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `package.json` | Thêm scripts `verify`, `test`, `test:watch`; thêm devDependencies |
| `vitest.config.ts` | **Mới** — Vitest config |
| `src/test/setup.ts` | **Mới** — jest-dom matchers |
| `webapp/docs/SMOKE-TEST.md` | **Mới** — Smoke test checklist |
| `src/lib/eligibility.test.ts` | **Mới** — Unit tests cho eligibility |
| `src/lib/date-utils.test.ts` | **Mới** — Unit tests cho date-utils |
| `src/lib/excel-generator.test.ts` | **Mới** — Unit tests cho expression parser |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Chạy `npm run verify` → pass (type check + build + lint)
2. Chạy `npm run test` → tất cả unit test pass
3. Mở `SMOKE-TEST.md`, chạy thử 5-10 mục để verify checklist khả thi

### 10. Rollout Plan
1. Cài dependencies + Vitest config
2. Viết `SMOKE-TEST.md`
3. Viết `date-utils.test.ts` (dễ nhất)
4. Viết `eligibility.test.ts`
5. Viết `excel-generator.test.ts`
6. Chạy `npm run verify` + `npm run test`
7. Cập nhật `CHANGELOG.md`

### 11. Notes
- **Ưu điểm:**
  - Chạy nhanh (`npm run test` ~3-5 giây)
  - Phát hiện regression sớm trước khi deploy
  - Smoke test không cần viết code, chỉ cần checklist
- **Nhược điểm:**
  - Smoke test thủ công vẫn tốn 5-10 phút mỗi lần
  - Unit test không cover UI interactions
  - Khi refactor eligibility logic, phải cập nhật test
- **Rủi ro & Mitigation:**
  | Rủi ro | Mitigation |
  |--------|------------|
  | Test bị outdated khi business rules thay đổi | Ghi rõ trong test description, review test khi sửa rules |
  | `jsdom` conflict với Vite/React 19 | Dùng `@vitejs/plugin-react` + `vitest@latest`, test trên 1 file trước |
  | `daysSince()` dùng `new Date()` nên test có thể flaky theo ngày chạy | Mock `Date.now()` trong test |

---

## FEAT-002: Supabase Realtime updates (comments, status, sidebar badge)

- **Đề xuất**: 2026-05-28
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-19

### 1. Mô tả feature
Tích hợp Supabase Realtime để tự động cập nhật UI khi có thay đổi trong database: comments mới, status request thay đổi, activity log mới, và badge số đếm "Requests" trên sidebar.

### 2. Motivation / Why
- Hiện tại ngườii dùng phải refresh trang để thấy dữ liệu mới.
- Realtime giúp collaborate tốt hơn khi nhiều ngườii dùng cùng xem 1 request.
- Badge "Requests" trên sidebar hiện chỉ fetch một lần khi load app, nên không phản ánh số request đang xử lý khi có request mới hoặc request hoàn tất/hủy.

### 3. Scope

**In scope:**
- Subscribe `t1_requests` table để cập nhật status/kanban realtime.
- Subscribe `request_comments` để hiển thị comment mới ngay lập tức.
- Subscribe `activity_logs` để cập nhật timeline.
- Subscribe `t1_requests` trong `Layout.tsx` để cập nhật badge số đếm "Requests" trên sidebar realtime.

**Out of scope:**
- Realtime cho toàn bộ bảng `agents` (quá nhiều data).
- Broadcast events (dùng cho typing indicator, v.v.).

### 4. Technical Design
- Dùng `supabase.channel()` để lắng nghe `postgres_changes` events.
- Tạo custom hook `useRealtimeTable(table, filter?)` để reusable.
- Trong `RequestDetailPage`: subscribe `request_comments` với filter `request_id = :id`.
- Trong `RequestsPage`: subscribe `t1_requests` để cập nhật kanban/card khi status đổi.
- Trong `ActivityLogPage`: subscribe `activity_logs` để prepend event mới.
- Trong `Layout.tsx`: dùng `useRequestCountQuery` + subscribe `t1_requests` để refetch request count khi có INSERT/UPDATE/DELETE.

### 5. UI/UX
- Comment mới từ ngườii khác: hiển thị ngay trong thread, có hiệu ứng nhẹ (ví dụ: border-left màu xanh trong 2 giây).
- Status đổi: card trong kanban tự động chuyển cột.
- Badge "Requests" trên sidebar: tự động tăng/giảm khi có request mới hoặc request hoàn tất/hủy, không cần refresh trang.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/hooks/useRealtime.ts` | Hook mới để subscribe Supabase Realtime |
| `src/hooks/queries/useRequestCount.ts` | Hook query cho request count trên sidebar |
| `src/pages/RequestDetailPage.tsx` | Subscribe comments + request changes |
| `src/pages/RequestsPage.tsx` | Subscribe request status changes |
| `src/pages/ActivityLogPage.tsx` | Subscribe activity logs |
| `src/components/Layout.tsx` | Dùng `useRequestCountQuery` + `useRealtime` để cập nhật badge "Requests" trên sidebar |

### 7. Schema / SQL changes
- Bật Realtime cho các bảng trong Supabase Dashboard → Database → Replication:
  - `t1_requests`
  - `request_comments`
  - `activity_logs`

### 8. API / Integration changes
- Không cần API mới. Dùng Supabase Realtime client sẵn có.

### 9. Test Plan
1. **Sidebar badge:** Tạo request mới từ Agent Detail → verify badge "Requests" trên sidebar tự động tăng trong 1-2 giây. Hoàn tất/hủy 1 request → verify badge tự động giảm.
2. Mở Request Detail trên tab A (Chrome).
3. Mở cùng request trên tab B (Firefox/Incognito).
4. Tab B thêm comment → verify tab A hiển thị comment mới trong 1-2 giây.
5. Tab B đổi status request → verify tab A cập nhật status.

### 10. Rollout Plan
1. Bật Realtime replication cho các bảng trong Supabase Dashboard.
2. Deploy code frontend.
3. Monitor network tab để đảm bảo không quá nhiều WebSocket connections.

### 11. Notes
- Supabase free tier: 200 concurrent connections, 100 channels/connection.
- Nên `unsubscribe` khi component unmount để tránh leak.
- Có thể cần filter `schema: 'public', table: '...', filter: 'id=eq....'` để giảm traffic.

---

---

## REFACTOR-006: ESLint Cleanup — Fix 172 lint errors across codebase

- **Đề xuất**: 2026-06-19
- **Status**: `done`
- **Priority**: `low`
- **Hoàn thành**: 2026-06-25

### 1. Mô tả feature
Dọn dẹp toàn bộ 172 lỗi ESLint (159 errors + 13 warnings) trên 51 files để `npm run verify` pass hoàn toàn. **Không thay đổi behavior / business logic** — chỉ refactor cho đúng type / hooks rules.

### 2. Phân loại lỗi hiện tại
| Rule | Số lượng | Cách fix tổng quát |
|------|----------|-------------------|
| `@typescript-eslint/no-explicit-any` | 94 | Thay `any` bằng type cụ thể từ `types/index.ts` hoặc `unknown` + type guard |
| `react-hooks/static-components` | 42 | Di chuyển component con (`InfoRow`, toolbar buttons) ra ngoài render function |
| `react-hooks/exhaustive-deps` | 9 | Thêm dependency đúng hoặc restructure effect |
| `react-refresh/only-export-components` | 5 | Tách hook/context export ra file riêng |
| `react-hooks/set-state-in-effect` | 5 | Chuyển setState trong effect thành event-driven hoặc dùng query hook |
| `react-hooks/immutability` | 4 | Wrap mutable objects bằng `useMemo`/`useRef` |
| `react-hooks/purity` | 4 | Không gọi `Math.random()` trong render — dùng `useId()` hoặc `useRef` |
| `react-hooks/incompatible-library` | 3 | Thêm `// eslint-disable-next-line` (library issue, không fix được) |
| `no-useless-escape` | 2 | Bỏ escape character thừa trong regex |
| `@typescript-eslint/no-unused-vars` | 2 | Xóa biến/import không dùng |
| `prefer-const` | 1 | Đổi `let` → `const` |

### 3. Phased Approach (Chi tiết)

#### Phase 1 — Query hooks (`src/hooks/queries/*`) — 27 lỗi
> Tất cả đều là `no-explicit-any`. Thay bằng type từ `src/types/index.ts`.
- `useAgentDetail.ts` (7 lỗi): Thay bằng `Agent`, `T1Change`, `M1TransitionTask`, v.v.
- `useRequestDetail.ts` (4 lỗi): Thay bằng `T1Request`, `RequestComment`, `ActivityLog`
- `useB2Requests.ts` (2 lỗi): Thay bằng `T1Request & { agent: Agent }`
- `useM1Transitions.ts` (2 lỗi): Thay bằng `M1TransitionTask` nested types
- Các query hooks còn lại (useRequests, useTrash, useActivityLogs, useAgents, useDivisions, useEmailTemplates, useHolidays, useRanks, useStatusCounts): Thay bằng model type tương ứng.

#### Phase 2 — Agent detail components — 41 lỗi
- **`AgentInfoTab.tsx` (35 lỗi)**: **Quan trọng nhất:** Di chuyển `InfoRow` ra ngoài component thành standalone component (33 lỗi `static-components`). Thay `any` → `{ id: string; name: string }` và `Record<string, string \| null>`.
- Các file khác trong `agent-detail/` (AgentHistoryTab, AsT1History, DeactivationHistory, T1History): Thay `any` bằng type tương ứng.

#### Phase 3 — Modals & shared components — 52 lỗi
- `HtmlEditor.tsx` (10 lỗi): Di chuyển toolbar button components ra ngoài render. Tách `PLACEHOLDERS` ra file riêng.
- `ComposeTemplateModal.tsx` (10 lỗi): Thay `any`, wrap mutable defaults, fix deps, dùng `useId()`.
- `CreateRequestModal.tsx` (10 lỗi): Thay `any` → Agent, EligibilityResult. Fix deps, disable `incompatible-library`.
- Các modal khác (Deactivate, Restore, SendEmail, CountdownConfirm, Export, TemplateEdit): Fix `any`, hooks deps, `set-state-in-effect`, và `purity`.
- `CommandPalette.tsx`, `NotificationDropdown.tsx`, `Toast.tsx`: Refactor effect, fix deps, tách export context.

#### Phase 4 — Pages — 32 lỗi
- Các page (DivisionsPage, AgentsPage, RanksPage, TrashPage, EmailTemplatesPage, HolidaysPage, UploadPage, ExcelGeneratorPage, RequestDetailPage, RequestsPage): Chủ yếu là lỗi `@typescript-eslint/no-explicit-any`, cần import và cast type chuẩn xác. Ở `DivisionsPage` có 1 lỗi `incompatible-library` (disable) và `ExcelGeneratorPage` có 1 lỗi `set-state-in-effect` (refactor effect).

#### Phase 5 — Misc / infrastructure — 10 lỗi
- `useAuth.tsx`, `useFocusTrap.ts`: Fix `any`, tách export component.
- `excel-generator.ts`: Xóa `\/` thừa.
- UI components (`DialogManager`, `ToastProvider`, `Modal`): Tách context export, fix purity (`Math.random`).
- `supabase/functions/send-email/index.ts`: Fix `catch(err: any)` thành `unknown`.

### 4. Special Handling (User Approved)
- **`react-hooks/incompatible-library` (3 lỗi)**: Sẽ dùng `// eslint-disable-next-line react-hooks/incompatible-library` do lỗi từ thư viện `react-hook-form` trên React 19.
- **`react-hooks/set-state-in-effect` (CountdownConfirmModal)**: Sẽ dùng `// eslint-disable-next-line` do đây là pattern subscription hợp lệ đếm ngược bằng `setInterval`.

### 5. Test Plan & Rollout
1. Thực hiện lần lượt từ Phase 1 đến Phase 5.
2. Sau mỗi phase:
   - Chạy `npx eslint .` để confirm lỗi giảm đúng hướng.
   - Chạy `npm run test` — 56/56 tests phải vẫn pass.
   - Smoke test các luồng chính liên quan.
3. Cuối cùng: `npm run verify` phải pass hoàn toàn (tsc + build + eslint).

---

---

## FEAT-004: Refactor pages sang TanStack Query

- **Đề xuất**: 2026-05-28
- **Status**: `done`
- **Priority**: `low`
- **Hoàn thành**: 2026-05-30

### Current Status (as of 2026-06-20)

**Đã làm:**
- `src/main.tsx` — Đã setup `QueryClientProvider` với `staleTime: 5 phút`, `retry: 1`.
- `@tanstack/react-query` đã cài trong `package.json`.
- Đã tạo 17 custom hooks trong `src/hooks/queries/` bao gồm:
  - `useAgents.ts`, `useAgentDetail.ts`, `useRequests.ts`, `useRequestDetail.ts`, `useActivityLogs.ts`
  - `useDashboardStats.ts`, `useM1Transitions.ts`, `useB2Requests.ts`, `useStatusCounts.ts`
  - `useTrash.ts`, `useHolidays.ts`, `useRanks.ts`, `useDivisions.ts`
  - `useEmailTemplates.ts`, `useBookmarkedAgents.ts`, `useT1Changes.ts`, `useRequestCount.ts`
- Đã refactor sang dùng `useQuery`/`useMutation` cho các pages chính:
  - `AgentsPage.tsx`, `RequestsPage.tsx`, `DashboardPage.tsx`, `AgentDetailPage.tsx`, `RequestDetailPage.tsx`
  - `ActivityLogPage.tsx`, `TrashPage.tsx`, `HolidaysPage.tsx`, `RanksPage.tsx`, `DivisionsPage.tsx`, `EmailTemplatesPage.tsx`
- Các mutation đều invalidate cache đúng qua `queryClient.invalidateQueries()`.

**Chưa làm:**
- Hoàn tất toàn bộ scope gốc. Một số helper functions còn dùng `supabase.from` trực tiếp (ví dụ: `fetchExportData` trong `AgentsPage.tsx`) nhưng đây là logic export one-off, không phải data fetching chính.

### 1. Mô tả feature
Hiện tại các page đang dùng `useState` + `useEffect` thủ công để fetch data từ Supabase. Refactor sang `@tanstack/react-query` để có caching, background refetch, error handling, loading state tốt hơn.

### 2. Motivation / Why
- `useState` + `useEffect` dễ duplicate code, khó maintain.
- TanStack Query cung cấp: caching, stale-while-revalidate, retry, pagination support.
- Đã cài đặt trong `package.json` nhưng chưa dùng.

### 3. Scope

**In scope:**
- Setup `QueryClient` provider trong `main.tsx`.
- Tạo custom hooks cho các query phổ biến: `useAgents`, `useRequests`, `useAgentDetail`, `useRequestDetail`, `useActivityLogs`.
- Refactor 1-2 page pilot (ví dụ: `AgentsPage`, `RequestsPage`).
- Đảm bảo mutate (insert/update/delete) invalidates cache đúng.

**Out of scope:**
- Refactor toàn bộ page trong 1 lần (làm dần dần).
- Server-side pagination (liên quan nhưng là feature riêng).

### 4. Technical Design
- Wrap app bằng `<QueryClientProvider>`.
- Mỗi entity có 1 file hook trong `src/hooks/queries/`:
  - `useAgents.ts`: `useQuery` cho list, `useMutation` cho upsert.
  - `useRequests.ts`: `useQuery` cho list + detail.
- Cấu hình `staleTime` phù hợp (ví dụ: 30 giây cho list, 60 giây cho detail).
- Mutations dùng `queryClient.invalidateQueries({ queryKey: ['agents'] })` để refresh.

### 5. UI/UX
- Không đổi UI. Chỉ cải thiện UX ngầm: data tự refresh, cache giảm loading.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/main.tsx` | Thêm `QueryClientProvider` |
| `src/hooks/queries/useAgents.ts` | Hook mới |
| `src/hooks/queries/useRequests.ts` | Hook mới |
| `src/hooks/queries/useAgentDetail.ts` | Hook mới |
| `src/hooks/queries/useRequestDetail.ts` | Hook mới |
| `src/pages/AgentsPage.tsx` | Refactor sang dùng hook |
| `src/pages/RequestsPage.tsx` | Refactor sang dùng hook |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Vào AgentsPage → verify data load đúng.
2. Thực hiện action (bookmark, tạo request) → verify list tự refresh.
3. Navigate đi rồi quay lại → verify data lấy từ cache (không loading lâu).
4. Test error case: tắt network → verify error state hiển thị.

### 10. Rollout Plan
1. Setup QueryClient provider.
2. Tạo hooks cho 1-2 entity.
3. Refactor 1-2 page pilot.
4. Test kỹ trước khi refactor các page còn lại.

### 11. Notes
- Không refactor toàn bộ cùng lúc → rủi ro regression cao.
- Các component dùng data từ props cần review lại để đảm bảo không bị ảnh hưởng.
- Có thể kết hợp với FEAT-002 (Realtime) bằng cách dùng `queryClient.invalidateQueries` trong Realtime callback.

---

---

## FEAT-005: Search/Filter server-side cho presets phức tạp

- **Đề xuất**: 2026-05-28
- **Status**: `backlog`
- **Priority**: `medium`

### 1. Mô tả feature
BUG-002 (đã fix) đã chuyển search cơ bản + pagination sang server-side. Tuy nhiên các quick filter presets phức tạp (`near_91d`, `near_180d`, `quota_exceeded`) đang bị ẩn tạm thờivì cần eligibility engine chạy server-side. Feature này bật lại các presets đó bằng cách viết RPC PostgreSQL.

### 2. Motivation / Why
- User cần lọc nhanh agent sắp đủ 91 ngày, sắp đủ 180 ngày, hoặc đã hết quota đổi T1.
- Không thể làm client-side vì cần load toàn bộ agents (vượt max-rows 1000).
- Cần tính eligibility trên server để đảm bảo chính xác.

### 3. Scope

**In scope:**
- Viết RPC `search_agents(p_search, p_filter, p_page, p_page_size)`.
- `p_filter` hỗ trợ: `all`, `no_t1`, `bookmarked`, `near_91d`, `near_180d`, `quota_exceeded`.
- `p_search` tìm theo `full_name` và `staff_id` (ilike).
- Bật lại UI các presets đã ẩn trong `AgentsPage`.
- Cập nhật `ExportModal` để dùng cùng RPC (hoặc query tương tự) khi export theo filter.

**Out of scope:**
- Full-text search (trigram index).
- Filter kết hợp nhiều điều kiện phức tạp (AND/OR).

### 4. Technical Design
**RPC `search_agents`:**
- Nhận `p_filter` string.
- Case `near_91d`: `contract_signing_date` cách `CURRENT_DATE` 80-91 ngày.
- Case `near_180d`: `t1_changes` gần nhất cách `CURRENT_DATE` 170-180 ngày.
- Case `quota_exceeded`: `COUNT(t1_changes WHERE is_counted_for_quota = TRUE)` >= 3.
- Trả về `TABLE` hoặc JSON array + tổng số row.

**Frontend:**
- `AgentsPage` gọi `supabase.rpc('search_agents', ...)` thay vì query trực tiếp `agents` table.
- Preset buttons bật lại trong toolbar.

### 5. UI/UX
- Thêm lại 3 preset buttons trong toolbar: `Sắp đủ 91 ngày`, `Sắp đủ 180 ngày`, `Hết quota`.
- Style giống các preset hiện tại (`all`, `no_t1`, `bookmarked`).
- Active state rõ ràng.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/migrations/007_search_agents_rpc.sql` | Tạo RPC function |
| `src/pages/AgentsPage.tsx` | Bật lại presets, gọi RPC |
| `src/components/ExportModal.tsx` | Dùng RPC khi export với filter phức tạp |

### 7. Schema / SQL changes
```sql
CREATE OR REPLACE FUNCTION public.search_agents(
  p_search TEXT DEFAULT NULL,
  p_filter TEXT DEFAULT 'all',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  staff_id TEXT,
  full_name TEXT,
  rank_name TEXT,
  contract_signing_date DATE,
  current_t1_id UUID,
  status TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Logic tùy theo p_filter
  -- near_91d: WHERE contract_signing_date BETWEEN CURRENT_DATE - INTERVAL '91 days' AND CURRENT_DATE - INTERVAL '80 days'
  -- near_180d: JOIN t1_changes subquery
  -- quota_exceeded: HAVING COUNT(t1_changes) >= 3
  -- search: WHERE full_name ILIKE '%' || p_search || '%' OR staff_id ILIKE '%' || p_search || '%'
  LIMIT p_page_size OFFSET (p_page - 1) * p_page_size;
END;
$$;
```
> ⚠️ Cần viết chi tiết logic trong migration, test trên dev DB trước.

### 8. API / Integration changes
- RPC mới trong Supabase.
- Không cần third-party API.

### 9. Test Plan
1. Chọn preset `Sắp đủ 91 ngày` → verify chỉ hiển thị agent có `contract_signing_date` trong khoảng 80-91 ngày.
2. Chọn preset `Sắp đủ 180 ngày` → verify agent có lần đổi T1 gần nhất cách 170-180 ngày.
3. Chọn preset `Hết quota` → verify agent đã đổi T1 >= 3 lần (counted).
4. Kết hợp search text + preset → hoạt động đúng.
5. Pagination với preset → chuyển trang đúng.

### 10. Rollout Plan
1. Viết migration SQL, test trên Supabase SQL Editor.
2. Deploy schema (nếu dùng migration tool) hoặc chạy thủ công.
3. Cập nhật frontend để gọi RPC.
4. Bật lại UI presets.

### 11. Notes
- `quota_exceeded` cần `COUNT` subquery → có thể chậm với 2500 rows nếu không có index. Cân nhắc add index trên `t1_changes.agent_id`.
- `near_180d` cần tìm `MAX(change_date)` per agent → dùng `LATERAL` hoặc window function.
- Nếu RPC quá phức tạp, có thể tách thành 3 function riêng (`get_near_91d`, `get_near_180d`, `get_quota_exceeded`) rồi union.

---

---

## FEAT-008: Division Safety Net — Force Recompute & getAgentDivision RPC

- **Đề xuất**: 2026-05-29
- **Status**: `fixed`
- **Priority**: `high`

### 1. Mô tả feature
Hoàn thiện **Lớp 2 và Lớp 3** của Division Safety Net theo thiết kế FEAT-006:
- **Lớp 2:** RPC `get_agent_division(agent_id)` — trả về division UUID của agent theo đúng business rule (T1 tree → head → division)
- **Lớp 3:** Nút **"Tính lại Division"** trong trang Divisions — admin bấm để force recompute `division_id` cho toàn bộ agents

### 2. Motivation / Why
- Sau khi import data, đổi head division, hoặc mass update referrer_id → `division_id` của nhiều agent có thể không đồng bộ
- Trigger Lớp 1 chỉ chạy khi `referrer_id` thay đổi (UPDATE), không cover INSERT batch hoặc schema migration
- Admin cần 1 nút để force sync khi nghi ngờ data lệch

### 3. Scope

**In scope:**
- RPC `get_agent_division(p_agent_id UUID)` → returns UUID
- RPC `recompute_all_divisions()` → UPDATE division_id cho toàn bộ agents theo business rule
- Button "Tính lại Division" trong `DivisionsPage` (admin only)
- CountdownConfirmModal 10s trước khi thực hiện
- Toast thông báo số lượng agent được update

**Out of scope:**
- Không tạo background job / queue
- Không track lịch sử lần recompute nào
- Không tự động scheduled recompute

### 4. Technical Design

**RPC `get_agent_division(p_agent_id UUID)`:**
```sql
CREATE OR REPLACE FUNCTION public.get_agent_division(p_agent_id UUID)
RETURNS UUID AS $$
DECLARE
  v_division_id UUID;
BEGIN
  -- 1. Agent is head of a division?
  SELECT id INTO v_division_id FROM public.divisions WHERE head_agent_id = p_agent_id AND is_active = true LIMIT 1;
  IF v_division_id IS NOT NULL THEN RETURN v_division_id; END IF;

  -- 2. Walk up T1 tree to find first head_agent_id
  WITH RECURSIVE upline AS (
    SELECT id, referrer_id FROM public.agents WHERE id = p_agent_id
    UNION ALL
    SELECT a.id, a.referrer_id FROM public.agents a INNER JOIN upline u ON a.id = u.referrer_id WHERE u.referrer_id IS NOT NULL
  )
  SELECT d.id INTO v_division_id
  FROM upline u
  JOIN public.divisions d ON d.head_agent_id = u.id
  WHERE d.is_active = true
  LIMIT 1;
  IF v_division_id IS NOT NULL THEN RETURN v_division_id; END IF;

  -- 3. Fallback to default division
  SELECT id INTO v_division_id FROM public.divisions WHERE is_default = true LIMIT 1;
  RETURN v_division_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**RPC `recompute_all_divisions()`:**
```sql
CREATE OR REPLACE FUNCTION public.recompute_all_divisions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_agent RECORD;
  v_division_id UUID;
BEGIN
  FOR v_agent IN SELECT id FROM public.agents WHERE deleted_at IS NULL LOOP
    v_division_id := public.get_agent_division(v_agent.id);
    UPDATE public.agents SET division_id = v_division_id WHERE id = v_agent.id AND (division_id IS DISTINCT FROM v_division_id);
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Frontend:**
- `DivisionsPage`: Thêm button "🔄 Tính lại Division" (admin only, bên cạnh "+ Thêm mới")
- Click → mở `CountdownConfirmModal` 10s
- Confirm → gọi `supabase.rpc('recompute_all_divisions')`
- Toast: `"Đã cập nhật division cho X agents"`

### 5. UI/UX
- Button đặt ở header DivisionsPage, màu secondary (xám/xanh nhạt), không nổi bằng "Thêm mới"
- Countdown 10s để tránh misclick
- Nếu `recompute_all_divisions` return 0 → toast "Tất cả division đã đồng bộ, không có thay đổi"

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/migrations/012_division_safety_net.sql` | 2 RPC functions mới |
| `src/pages/DivisionsPage.tsx` | Thêm button + CountdownConfirmModal + gọi RPC |

### 7. Schema / SQL changes
```sql
CREATE OR REPLACE FUNCTION public.get_agent_division(p_agent_id UUID) RETURNS UUID ...
CREATE OR REPLACE FUNCTION public.recompute_all_divisions() RETURNS INTEGER ...
```
> ⚠️ Chạy thủ công trên Supabase SQL Editor.

### 8. API / Integration changes
- 2 RPC mới trong Supabase. Không cần third-party API.

### 9. Test Plan
1. Chọn 1 agent không phải head, có T1 là head của division D → `get_agent_division` return UUID của D
2. Chọn 1 agent là head của division E → return UUID của E
3. Chọn 1 agent không có T1, không phải head → return UUID của "Khác"
4. Bấm "Tính lại Division" → verify toast hiển thị số agents được update
5. Sau recompute, AgentsPage hiển thị division đúng

### 10. Rollout Plan
1. Deploy SQL migration trên Supabase SQL Editor
2. Deploy frontend (DivisionsPage)
3. Test với 1-2 agents
4. Nếu OK, bấm recompute toàn bộ production

### 11. Notes
- `recompute_all_divisions` loop qua toàn bộ agents (~2500 rows) → khoảng 2-5 giây. Chấp nhận được vì không chạy thường xuyên.
- Nếu sau này scale lên >10k agents, cần optimize bằng cách pre-compute head map hoặc dùng batch update.
- **Phụ thuộc:** BUG-009 (division_id UUID migration) phải đã chạy xong.


---

---

## FEAT-009: Dashboard stat cards navigation (→ Agents / Requests / Filter)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-15

### 1. Mô tả feature
Trên Dashboard, các stat cards và chart "Trạng thái đề xuất" hiện chỉ là UI tĩnh. Feature này cho phép bấm vào để navigate sang trang tương ứng với filter phù hợp.

### 2. Motivation / Why
- Giảm thao tác: admin/operator thấy số liệu tổng quan → muốn xem chi tiết ngay.
- Trạng thái đề xuất trên Dashboard (step1, step2, step3, completed, cancelled) cần drill-down nhanh.

### 3. Scope

**In scope:**
- Card "Tổng Agent" → click navigate `/agents`
- Card "Tổng Requests" → click navigate `/requests`
- Card "Đang xử lý" → click navigate `/requests?status=step1,step2,step3`
- Card "Hoàn tất" → click navigate `/requests?status=completed`
- Chart "Trạng thái đề xuất": click từng bar/status → navigate `/requests?status=xxx`

**Out of scope:**
- Không thêm filter bookmark từ Dashboard.
- Không navigate từ B2 cards hay M1 Transition.

### 4. Technical Design
- Dùng `useNavigate` từ `react-router-dom`.
- Wrap stat cards bằng `<button>` hoặc `onClick` trên card container.
- Chart status bars: wrap mỗi row bằng `<button>` với `onClick={() => navigate('/requests?status=' + s)}`.
- `RequestsPage` cần đọc query param `status` từ URL để set initial filter.

### 5. UI/UX
- Stat cards: thêm `cursor-pointer hover:shadow-md transition-shadow`.
- Chart rows: thêm `cursor-pointer hover:bg-neutral-50`.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/pages/DashboardPage.tsx` | Thêm `useNavigate`, onClick cho 4 stat cards + chart rows |
| `src/pages/RequestsPage.tsx` | Đọc `status` query param từ URL, set initial `statusFilter` |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Dashboard → bấm "Tổng Agent" → navigate `/agents`.
2. Dashboard → bấm "Tổng Requests" → navigate `/requests`.
3. Dashboard → bấm "Đang xử lý" → navigate `/requests?status=step1,step2,step3`.
4. Dashboard → bấm "Hoàn tất" → navigate `/requests?status=completed`.
5. Dashboard → bấm bar "B1" → navigate `/requests?status=step1`.
6. Refresh `/requests?status=step2` → filter tự động chọn `step2`.

### 10. Rollout Plan
1. Sửa `DashboardPage.tsx` + `RequestsPage.tsx`.
2. Test local.
3. Deploy khi được yêu cầu.

### 11. Notes
- `RequestsPage` hiện dùng single-select filter. Nếu FEAT-010 chưa triển khai, query param `status=step1` sẽ chỉ hoạt động ở chế độ single-select trước. Sau FEAT-010 mới hỗ trợ multi-status.
- Card "Đang xử lý" cần map ra danh sách status: `step1,step2,step3`.

---

---

## FEAT-010: Requests multi-choice status filter (toggle on/off)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-15

### 1. Mô tả feature
Hiện tại `RequestsPage` chỉ cho phép chọn 1 status filter hoặc "Tất cả". Feature này cho phép chọn nhiều status cùng lúc (multi-choice), bấm lại lần nữa để bỏ chọn 1 status.

### 2. Motivation / Why
- User muốn xem đồng thờii nhiều trạng thái (ví dụ: B1 + B2).
- Pattern toggle quen thuộc, dễ dùng.

### 3. Scope

**In scope:**
- Đổi `statusFilter` từ `RequestStatus | 'all'` → `RequestStatus[]`.
- Các status button: bấm → thêm vào mảng; bấm lại → xóa khỏi mảng.
- "Tất cả" button: bấm → clear mảng (tương đương hiện tại).
- Query DB: dùng `.in('status', statusFilter)` khi có filter.
- URL query param: hỗ trợ `?status=step1,step2` (parse + stringify).

**Out of scope:**
- Không thay đổi UI layout lớn.
- Không thêm filter theo ngày.

### 4. Technical Design
- State: `const [statusFilter, setStatusFilter] = useState<RequestStatus[]>([])`.
- Toggle logic:
  ```ts
  const toggleStatus = (s: RequestStatus) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  ```
- Query: nếu `statusFilter.length > 0` thì `.in('status', statusFilter)`, ngược lại không filter.
- URL sync: dùng `useSearchParams` để đọc/ghi query param.
- UI active state: `statusFilter.includes(s)`.

### 5. UI/UX
- Status buttons giữ nguyên style hiện tại.
- Active state: `ring-2 ring-offset-1 ring-neutral-300` khi được chọn.
- Không chọn gì → hiển thị tất cả (tương đương "Tất cả").

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/pages/RequestsPage.tsx` | Đổi state `statusFilter`, toggle logic, query `.in()`, URL sync |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Vào RequestsPage → mặc định hiển thị tất cả.
2. Bấm "B1" → chỉ hiện B1.
3. Bấm "B2" → hiện B1 + B2.
4. Bấm lại "B1" → chỉ hiện B2.
5. Bấm "Tất cả" → hiện tất cả.
6. URL `/requests?status=step1,step2` → hiển thị đúng B1 + B2.
7. Export vẫn lấy đúng danh sách đã filter.

### 10. Rollout Plan
1. Sửa `RequestsPage.tsx`.
2. Test local.
3. Deploy khi được yêu cầu.

### 11. Notes
- Cần xử lý backward-compatible với FEAT-009: nếu URL có `status=step1` (single), parse thành mảng 1 phần tử.
- Nếu `status` param rỗng hoặc không hợp lệ → fallback `[]`.

---

---

## FEAT-011: Ranks modal CRUD (popup Thêm/Sửa, bỏ footer form)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-15

### 1. Mô tả feature
Hiện tại `RanksPage` có form thêm/sửa nằm inline dưới bảng (footer). Feature này chuyển form sang popup modal, bỏ footer form.

### 2. Motivation / Why
- Giao diện gọn gàng hơn, bảng chiếm toàn bộ focus.
- Consistent với pattern modal CRUD trong app (CreateRequestModal, ComposeTemplateModal...).

### 3. Scope

**In scope:**
- Bỏ form inline ở dưới bảng (div `bg-white rounded-lg shadow-card p-5`).
- Thêm modal component: tiêu đề "Thêm cấp bậc mới" / "Sửa cấp bậc".
- Modal chứa 3 fields: Tên, Loại, Thứ tự (giữ nguyên inputs).
- Nút "Thêm mới" ở header → mở modal (không có editing).
- Nút "Sửa" trên row → mở modal (có editing data).
- Nút "Hủy" / "×" đóng modal.

**Out of scope:**
- Không thay đổi schema DB.
- Không thêm field mới.

### 4. Technical Design
- Tạo state `showModal: boolean`.
- Form state giữ nguyên (`name`, `rank_type`, `sort_order`).
- Khi `editing` thay đổi → mở modal.
- Sau save → đóng modal, reload list.
- Dùng `Modal` component sẵn có hoặc tự implement overlay (backdrop + centered panel).

### 5. UI/UX
- Modal: backdrop blur, panel trắng rounded-lg, width `max-w-md`.
- Header modal: tiêu đề + nút X.
- Footer modal: nút "Lưu" primary + "Hủy" secondary.
- Bảng: bỏ footer → chỉ còn bảng + info bar cuối trang.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/pages/RanksPage.tsx` | Bỏ inline form, thêm state modal, render modal với form fields |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Vào Ranks → bấm "+ Thêm mới" → modal mở, tiêu đề "Thêm cấp bậc mới".
2. Nhập data → bấm "Thêm" → modal đóng, toast success, row mới xuất hiện.
3. Bấm "Sửa" trên 1 row → modal mở, tiêu đề "Sửa cấp bậc", fields pre-filled.
4. Sửa tên → bấm "Cập nhật" → modal đóng, row cập nhật.
5. Bấm "Hủy" hoặc X → modal đóng không lưu.
6. Bảng không còn form inline dưới.

### 10. Rollout Plan
1. Sửa `RanksPage.tsx`.
2. Test local.
3. Deploy khi được yêu cầu.

### 11. Notes
- Có thể tái sử dụng component `Modal.tsx` sẵn có (nếu đã có trong project) hoặc implement inline.
- Giữ nguyên validation: `name` required.

---

---

## FEAT-012: Divisions modal CRUD + table height (popup Thêm/Sửa, bỏ max-h)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-15

### 1. Mô tả feature
1. Chuyển form thêm/sửa Division sang popup modal (tương tự FEAT-011).
2. Bỏ `max-h-[400px]` trên bảng để chiều cao tự nhiên, tương đương với `RanksPage`.

### 2. Motivation / Why
- Giao diện đồng nhất: cả Ranks và Divisions đều dùng modal CRUD.
- Bảng hiện bị giới hạn 400px → với ít division thì scroll không cần thiết, với nhiều division thì user muốn thấy nhiều hơn.

### 3. Scope

**In scope:**
- Bỏ form inline trong `DivisionsPage`.
- Thêm modal popup cho Thêm/Sửa division (fields: Tên, Trưởng nhóm searchable dropdown, Chính thức checkbox).
- Bỏ `max-h-[400px]` trên container bảng → bảng hiển thị tự nhiên.
- Giữ `overflow-x-auto` cho responsive.

**Out of scope:**
- Không thay đổi searchable dropdown logic (đã có từ BUG-008).
- Không thêm pagination cho divisions.

### 4. Technical Design
- Tương tự FEAT-011: state `showModal`, form state giữ nguyên.
- Bỏ div form inline (từ `{/* Form */}` đến hết div đó).
- Bảng: sửa `max-h-[400px] overflow-y-auto` thành chỉ `overflow-x-auto` (hoặc bỏ hoàn toàn max-h giới hạn, giữ `overflow-x-auto` trên wrapper ngoài).
- Giữ sticky header cho bảng.

### 5. UI/UX
- Modal giống FEAT-011: backdrop, panel `max-w-md`, header + X, footer Lưu/Hủy.
- Searchable dropdown trong modal: giữ nguyên behavior (debounce, dropdown, clear).
- Bảng: không còn scroll dọc giới hạn, chỉ scroll ngang khi cần.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/pages/DivisionsPage.tsx` | Bỏ inline form → modal; bỏ `max-h-[400px]` bảng |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Vào Divisions → bấm "+ Thêm mới" → modal mở.
2. Nhập tên + chọn head agent → bấm "Thêm" → modal đóng, row mới.
3. Bấm "Sửa" → modal mở với data pre-filled, head agent hiển thị đúng label.
4. Bấm "Hủy" → modal đóng không lưu.
5. Bảng không còn form inline; chiều cao tự nhiên (không scroll dọc nếu < ~20 rows).
6. Test searchable dropdown trong modal vẫn hoạt động.

### 10. Rollout Plan
1. Sửa `DivisionsPage.tsx`.
2. Test local.
3. Deploy khi được yêu cầu.

### 11. Notes
- Nếu divisions tăng lên >30 rows trong tương lai, có thể cân nhắc thêm pagination hoặc search sau.
- `CountdownConfirmModal` cho "Tính lại Division" giữ nguyên, không ảnh hưởng.

---

---

## FEAT-013: M1 Transition — Search, T1 cũ + Lý do, Email Tracking

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-15

### 1. Mô tả feature
Cải tiến card **M1 Transition** trên Dashboard với 3 tính năng:
1. **Search bar** tìm agent nhanh trong danh sách transition tasks.
2. **Hiển thị T1 cũ + Lý do** — biết agent bị transition vì T1 cũ đổi đi hay bị deactivate.
3. **Email tracking** — đánh dấu đã gửi email nhắc nhở M1 bao nhiêu lần, hỗ trợ resend.

### 2. Motivation / Why
- List M1 transition có thể dài (nhiều M1 cùng bị ảnh hưởng khi 1 T1 đổi/nghỉ) → khó tìm agent bằng mắt thường.
- Hiện tại không biết `departed_agent_id` là ai → không biết T1 cũ là ai.
- Không biết transition phát sinh từ đâu: từ request đổi T1 hay từ deactivate agent.
- Không track số lần đã nhắc email → dễ gửi trùng hoặc bỏ sót.

### 3. Scope

**In scope:**
- Search bar **client-side** trên M1 Transition card (filter theo tên/M1/T1 cũ/mã nhân viên).
- Query thêm `departed_agent` (T1 cũ) và `parent_request` (lý do) từ Supabase.
- Thêm cột "T1 cũ" và "Lý do" vào UI.
- ALTER TABLE `m1_transition_tasks`: thêm `email_sent_count` + `last_email_sent_at`.
- Update `email_sent_count` khi user gửi email qua `SendEmailModal` từ M1 Transition row.
- UI hiển thị số lần gửi + thờigian gửi gần nhất.

**Out of scope:**
- Server-side pagination/search cho M1 Transition (số lượng task ở dashboard thường nhỏ).
- Thay đổi flow tạo M1 transition task (trigger/function).
- Bulk email cho nhiều M1 cùng lúc.
- Email scheduling / reminder tự động.

### 4. Technical Design

#### 4.1 Search bar (client-side filter)
- State: `const [m1Search, setM1Search] = useState('')`.
- Debounce 300ms (dùng `useEffect` timer hoặc `useDebounce` nếu đã có).
- Filter array `transitions` qua `useMemo`:
  ```ts
  const filtered = useMemo(() => {
    const q = m1Search.trim().toLowerCase()
    if (!q) return transitions
    return transitions.filter(t =>
      t.m1_agent?.full_name?.toLowerCase().includes(q) ||
      t.m1_agent?.staff_id?.toLowerCase().includes(q) ||
      t.temp_t1?.full_name?.toLowerCase().includes(q) ||
      t.temp_t1?.staff_id?.toLowerCase().includes(q) ||
      t.departed_agent?.full_name?.toLowerCase().includes(q) ||
      t.departed_agent?.staff_id?.toLowerCase().includes(q)
    )
  }, [transitions, m1Search])
  ```

#### 4.2 T1 cũ + Lý do
- **Query update** trong `DashboardPage.tsx`:
  ```ts
  .select(`
    *,
    m1_agent: m1_agent_id(full_name, staff_id, contract_signing_date, rank_name),
    temp_t1: temp_t1_id(full_name, staff_id),
    departed_agent: departed_agent_id(full_name, staff_id),
    parent_request: parent_request_id(reason)
  `)
  ```
- **T1 cũ**: hiển thị `departed_agent.full_name` + `staff_id`.
- **Lý do**:
  - Nếu `parent_request_id != null` → "T1 cũ thay đổi" + `(parent_request.reason ?? '')`.
  - Nếu `parent_request_id == null` → "Deactivate agent".
  - Render dạng badge/pill text ngắn gọn.

#### 4.3 Email tracking
- **Schema change:**
  ```sql
  ALTER TABLE public.m1_transition_tasks
  ADD COLUMN IF NOT EXISTS email_sent_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;
  ```
- **Update flow:** Sau khi `SendEmailModal` gửi thành công → gọi:
  ```ts
  await supabase
    .from('m1_transition_tasks')
    .update({
      email_sent_count: (task.email_sent_count ?? 0) + 1,
      last_email_sent_at: new Date().toISOString()
    })
    .eq('id', task.id)
  ```
- **UI display:**
  - `email_sent_count === 0`: "Chưa gửi email" (text mờ / gray).
  - `email_sent_count > 0`: Icon 📧 + "Đã gửi N lần" + tooltip hiển thị `last_email_sent_at`.
  - Nút action: nếu `count > 0` → label "Gửi lại email"; nếu `0` → "Tạo email mẫu".

### 5. UI/UX
- **Search bar**: Input ngắn ở header card M1 Transition, placeholder `"Tìm theo tên, mã nhân viên..."`, icon 🔍 bên trái, nút × clear khi có text.
- **Bảng M1 Transition** thêm 2 cột giữa "M1 Agent" và "T1 Tạm":
  - **T1 cũ**: `full_name` clickable → `/agents/:id`.
  - **Lý do**: badge nhỏ màu phù hợp (xanh dương = thay đổi, cam = deactivate).
- **Cột Email**: chiếm ~100px, icon + count. Hover tooltip hiển thị thờigian gửi gần nhất.
- **Responsive**: card M1 Transition đã ở `lg:col-span-2`, đủ rộng để thêm cột. Nếu màn hình nhỏ, ẩn cột "Lý do" + "Email" trên mobile (chỉ hiện trên `sm:` hoặc `md:`).

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/pages/DashboardPage.tsx` | Thêm search state + filter logic; update Supabase query; thêm cột T1 cũ, Lý do, Email tracking trong UI |
| `src/components/ComposeTemplateModal.tsx` | Truyền callback `onEmailSent` hoặc tự update count sau khi gửi |
| `src/components/SendEmailModal.tsx` | Nhận prop `m1TaskId?`; sau gửi thành công → update `m1_transition_tasks` |
| `src/types/index.ts` | Update `M1TransitionTask` / `TransitionTask` interface thêm `departed_agent`, `parent_request`, `email_sent_count`, `last_email_sent_at` |
| `supabase/migrations/015_m1_email_tracking.sql` | **Mới** — `ALTER TABLE m1_transition_tasks` thêm 2 cột |

### 7. Schema / SQL changes
```sql
-- File: supabase/migrations/015_m1_email_tracking.sql
ALTER TABLE public.m1_transition_tasks
ADD COLUMN IF NOT EXISTS email_sent_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ;

-- Optional index để query nhanh task chưa gửi email
CREATE INDEX IF NOT EXISTS idx_m1_tasks_email_count
  ON public.m1_transition_tasks(email_sent_count, deadline_date);
```
> ⚠️ Chạy thủ công trên Supabase SQL Editor.

### 8. API / Integration changes
- Không cần API mới hay Edge Function mới.
- Dùng `supabase.from('m1_transition_tasks').update()` trực tiếp từ frontend (đã có RLS).
- `SendEmailModal` gọi Resend qua Edge Function `send-email` hiện có (FEAT-001), sau đó update count riêng.

### 9. Test Plan
1. **Search:** Nhập tên M1 → list filter chỉ hiện M1 đó. Nhập mã T1 cũ → filter theo T1 cũ. Bấm × → list reset.
2. **T1 cũ:** Mở Dashboard → verify mỗi row hiển thị tên + mã T1 cũ. Click tên → navigate đúng Agent Detail.
3. **Lý do:**
   - Task từ deactivate → hiển thị "Deactivate agent".
   - Task từ request đổi T1 → hiển thị "T1 cũ thay đổi" + reason nếu có.
4. **Email tracking:**
   - Row chưa gửi → hiển thị "Chưa gửi", nút "Tạo email mẫu".
   - Bấm "Tạo email mẫu" → gửi email thành công → row update "Đã gửi 1 lần", tooltip có timestamp.
   - Nút đổi thành "Gửi lại email". Bấm lại → "Đã gửi 2 lần".
5. **Schema:** Verify `m1_transition_tasks` có 2 cột mới sau khi chạy migration.

### 10. Rollout Plan
1. Chạy migration `015_m1_email_tracking.sql` trên Supabase SQL Editor.
2. Update `src/types/index.ts` trước để TypeScript không báo lỗi.
3. Sửa `DashboardPage.tsx` + `ComposeTemplateModal.tsx` + `SendEmailModal.tsx`.
4. Test local với sample data (ít nhất 1 task từ deactivate, 1 task từ request).
5. Build + deploy khi được yêu cầu.

### 11. Notes
- **`parent_request.reason` có thể NULL hoặc rỗng** → fallback hiển thị "T1 cũ thay đổi" không chi tiết.
- **Email tracking chỉ áp dụng khi gửi qua `SendEmailModal`** (tích hợp Resend). Nếu user chỉ dùng [Copy nội dung] + paste vào Gmail thì không track được — chấp nhận giới hạn này.
- **RLS:** `m1_transition_tasks` đã có RLS policies cho `admin`/`operator`/`viewer`. Cột mới không cần policy riêng vì dùng policy existing trên table.
- **Backward compatibility:** Cột mới có `DEFAULT 0` và nullable (`last_email_sent_at`) → không break data/task hiện có.

---

---

## FEAT-018: ComposeTemplateModal — Refactor email section (1 section, 4 emails, copy từng email)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-15

### 1. Mô tả feature
Refactor phần hiển thị email trong `ComposeTemplateModal`:
- Bỏ 2 cột "Agent | T1 Cũ" hiện tại.
- Thay bằng 1 section duy nhất **"Email liên quan"** với 4 dòng:
  - 👤 Agent
  - 🆕 T1 mới
  - 📍 T1 cũ
  - 📝 T1 tạm
- Dòng nào có email thì hiện email + icon Copy. Dòng nào null thì hiện "—" (không có nút Copy).
- Nút **"Copy email"** ở footer vẫn copy toàn bộ email có trong danh sách (cách nhau dấu phẩy).

### 2. Scope
**In scope:**
- Sửa layout `ComposeTemplateModal.tsx`.
- Thêm icon Copy (lucide `Copy`) cho từng email.
- Hiển thị/ẩn dựa trên dữ liệu thực tế.

**Out of scope:**
- Không đổi logic `rendered` body/subject.
- Không đổi nút "Gửi email" (vẫn ẩn).

### 3. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Refactor email section + thêm copy từng email |

### 4. Test Plan
1. Mở ComposeTemplateModal với agent có đầy đủ T1 cũ, T1 mới, T1 tạm → hiển thị 4 dòng, 3 nút Copy.
2. Agent không có T1 cũ (old_t1 = null) → dòng T1 cũ hiện "—", không có nút Copy.
3. Bấm Copy từng email → clipboard chỉ có email đó.
4. Bấm "Copy email" ở footer → clipboard có toàn bộ email (có dữ liệu), cách nhau dấu phẩy.

### 5. Notes
- T1 tạm hiện tại lấy từ `t1Old` (referrer_id hoặc current_t1_id). Nếu sau này có field `temp_t1` riêng thì cập nhật.


---

## REFACTOR-005: Twenty UI/UX Full Adoption (Tailwind v4 Preserve)

- **Đề xuất**: 2026-06-04
- **Status**: `done`
- **Priority**: `high`
- **Hoàn thành**: 2026-06-05

### Current Status (as of 2026-06-05)

**Đã làm:**
- Phase 1: Tokens & Global Styles (`tokens.css`, `index.css` rewrite, `index.html` + Inter font).
- Phase 2: Layout Architecture (PageContainer, PageHeader, Card, Section, Modal, Table primitives; Layout refactor sidebar resizable/collapsible + mobile nav).
- Phase 3: Component Primitives (display, input, navigation, feedback domains + FormField/FormSection).
- Phase 4: Table & List Refactor (column resize, filter chips, selection patterns + bulk actions bar, context-aware empty states).
- Phase 5: Form Patterns (`react-hook-form` + `zod` integration cho tất cả forms chính; `TextInput` forwardRef; `form-schemas.ts` tập trung schemas).
- Phase 6: Accessibility & Motion (focus stack cho nested modals, ARIA audit, touch targets min 40×40px, semantic HTML, heading hierarchy, decorative icons `aria-hidden`).
- Phase 7: Refactor toàn bộ 15 pages — Login, ChangePassword, Dashboard, Agents, Requests, AgentDetail, RequestDetail, Trash, Holidays, Ranks, Divisions, UploadPage, EmailTemplatesPage, ActivityLogPage, ExcelGeneratorPage + component con restyle.
- Dependencies: `react-hook-form`, `@hookform/resolvers`, `zod` đã cài.
- Build pass, backward compat preserved.

**Chưa làm:**
— Tất cả phases đã hoàn thành.

### 1. Mô tả feature

Áp dụng toàn bộ UI/UX patterns từ **Twenty CRM** (design tokens, philosophy, layout, navigation, component conventions, table patterns, form patterns, feedback patterns, accessibility) vào **T1 Change Tracker**, với điều kiện **giữ nguyên Tailwind CSS v4** làm styling engine. Không dùng Linaria, không bắt buộc chuyển toàn bộ state sang Jotai.

### 2. Motivation / Why

- Design system hiện tại dựa trên hardcoded Tailwind classes và generic enterprise UI, thiếu consistency.
- Twenty CRM có design system **editorial, whitespace-first, typography-driven**, đã được validate trên production với hàng ngàn users.
- Cải thiện **consistency, maintainability, accessibility** toàn app.
- Giảm technical debt từ UI components tự viết không chuẩn.
- Nâng cao trải nghiệm ngườii dùng: restrained palette (90% neutral), whitespace có chủ đích, motion tinh tế.

### 3. Scope

**In scope:**
- **Design tokens**: Color palette (Radix gray1-12 + Twenty accent), typography (base 13px, weights 400-600), spacing, radius, shadows.
- **Global styles**: `index.css` rewrite với CSS custom properties.
- **Layout architecture**: Resizable/collapsible sidebar, PageHeader, PageContainer, Breadcrumbs.
- **Component primitives** theo Twenty domain structure (`src/ui/display/`, `src/ui/input/`, `src/ui/layout/`, `src/ui/navigation/`, `src/ui/feedback/`).
- **Table patterns**: Column resize, filter chips, selection, context-aware empty states.
- **Form patterns**: Input states, error handling, validation UI (áp dụng dần, không bắt buộc toàn bộ ngay).
- **Feedback patterns**: Toast queue system, modal improvements, skeleton/loading states.
- **Accessibility**: Focus rings, semantic HTML, touch targets, `prefers-reduced-motion`.
- **Page-by-page polish** áp dụng Twenty patterns cho toàn bộ 13 routes.
- **Icon system**: Giữ Lucide React nhưng áp dụng naming conventions và sizing patterns của Twenty.

**Out of scope:**
- Không đổi Tailwind CSS v4 sang Linaria.
- Không refactor toàn bộ state từ `useState/useEffect` sang Jotai (giữ TanStack Query hiện tại).
- Không thay đổi business logic, API calls, Supabase schema.
- Không bắt buộc `react-hook-form` + `zod` cho tất cả forms ngay lập tức (áp dụng dần theo phase).
- Không thay đổi routing structure hay page-level data fetching logic.

### 4. Technical Design

#### Phase 1: Design Tokens & Global Styles

**File mới:**
- `src/ui/theme/tokens.css` — Toàn bộ CSS custom properties dựa trên Radix gray scale + Twenty accent colors.

**Cập nhật:**
- `src/index.css`:
  - Import `tokens.css`.
  - `html { font-size: 13px; }` (Twenty base).
  - `body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`.
  - Global focus ring style.
  - `prefers-reduced-motion` media query.
  - `form { display: contents; }` (Twenty pattern).
- Tailwind v4 `@theme` block để register custom colors, spacing, radius từ CSS variables:
  ```css
  @theme {
    --color-gray-1: var(--gray-1);
    --color-gray-2: var(--gray-2);
    /* ... gray-12 */
    --color-accent: var(--accent-primary);
    --font-family-sans: 'Inter', sans-serif;
    --spacing-base: 4px;
    --radius-sm: 2px;
    --radius-md: 4px;
    --radius-lg: 8px;
    --radius-xl: 20px;
    --radius-pill: 999px;
  }
  ```

**Tokens chính:**
| Token | Value | Usage |
|-------|-------|-------|
| `--background-primary` | `#ffffff` | Main background |
| `--background-secondary` | `gray-1` | Card/surface |
| `--background-tertiary` | `gray-2` | Subtle fills |
| `--font-color-primary` | `gray-12` | Headlines |
| `--font-color-secondary` | `gray-11` | Body |
| `--font-color-tertiary` | `gray-9` | Meta/eyebrow |
| `--font-color-disabled` | `gray-9` @ 40% opacity | Disabled |
| `--accent-primary` | `#4a38f5` | Primary accent (thay `#1e40af`) |
| `--accent-danger` | red scale | Error |
| `--accent-success` | green scale | Success |
| `--accent-warning` | yellow scale | Warning |
| `--border-hairline` | `gray-10` @ 10% opacity | Hairline borders |
| `--shadow-light` | subtle drop | Cards |
| `--shadow-strong` | heavier | Dropdowns |
| `--shadow-super-heavy` | deep | Modals |

**Typography scale (base 13px = 1rem):**
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `xxs` | 0.625rem (~8px) | 400 | — |
| `xs` | 0.85rem (~11px) | 400 | Captions |
| `sm` | 0.92rem (~12px) | 400 | Small text |
| `md` | 1rem (13px) | 400 | Body |
| `lg` | 1.23rem (~16px) | 500 | Section heads |
| `xl` | 1.54rem (~20px) | 500 | Card heads |
| `xxl` | 1.85rem (~24px) | 600 | Page titles |
| `display` | 2.77rem (~36px) | 300 | Display (rare) |

> **Không dùng font-weight 700.** Max = 600.

**Spacing scale (base 4px):**
| Token | Value |
|-------|-------|
| `0` | 0px |
| `0.5` | 2px |
| `1` | 4px |
| `2` | 8px |
| `3` | 12px |
| `4` | 16px |
| `5` | 20px |
| `6` | 24px |
| `8` | 32px |
| `10` | 40px |
| `12` | 48px |
| `16` | 64px |
| `20` | 80px |
| `24` | 96px |
| `32` | 128px |

**Border radius:**
| Token | Value |
|-------|-------|
| `xs` | 2px |
| `sm` | 4px |
| `md` | 8px |
| `xl` | 20px |
| `pill` | 999px |

---

#### Phase 2: Layout Architecture

**Tạo mới:**
- `src/ui/layout/PageContainer.tsx` — Simple flex column wrapper, max-width, horizontal padding responsive (`px-4 sm:px-10`).
- `src/ui/layout/PageHeader.tsx` — Title + optional Icon + action slot (children bên phải), close button, collapse button.
- `src/ui/layout/PageBody.tsx` — Main content flex row với gap.
- `src/ui/layout/ShowPageContainer.tsx` — Detail/show page container.

**Refactor `src/components/Layout.tsx`:**
- **Sidebar**:
  - Resizable width qua CSS variable `--sidebar-width` (default 240px, min 64px, max 320px).
  - Collapsible xuống icon-only mode (64px).
  - Tooltips khi collapsed.
  - Mobile: auto-collapse, bottom nav bar thay thế sidebar.
- **Header**: Tích hợp `PageHeader` pattern.
- **Main Content**: Background `background-tertiary`, padding `spacing-10` desktop / `spacing-4` mobile.

**Tạo mới:**
- `src/ui/navigation/NavigationDrawerItem.tsx`:
  - Props: `label`, `Icon`, `active`, `soon`, `badge`, `onClick`.
  - Style: padding 8px 12px, radius `sm`, hover `background-secondary`.
  - Active: `background` tinted accent + accent color text.
  - Collapsed: chỉ hiện icon + tooltip.
- `src/ui/navigation/Breadcrumb.tsx`:
  - Desktop: `Link` từ `react-router-dom`.
  - Mobile: optimized variant.

---

#### Phase 3: Component Primitives

**`src/ui/display/` — Display-only UI:**

| Component | Mô tả | Notes |
|-----------|-------|-------|
| `Badge.tsx` | Compact status tags | 5 variants, height 20px, radius pill, font sm/500. Nâng cấp từ component cũ. |
| `EmptyState.tsx` | Context-aware empty state | Icon 48px + title (lg/500) + subtitle (md/tertiary) + optional CTA. Hỗ trợ contexts: `no_data`, `filter_empty`, `no_permission`, `soft_delete`. |
| `Skeleton.tsx` | Theme-aware shimmer | Base color `gray-3`, highlight `gray-4`. Block, Text, Card, Table variants. |
| `Avatar.tsx` | User/agent avatar | Sizes `xs`→`xl` (24px→48px), fallback to initials. Radius rounded (50%). |
| `AvatarGroup.tsx` | Stack overflow | Max 3 avatars + overflow count. |
| `Chip.tsx` | Compact data tags | Dùng cho inline data display. |
| `Pill.tsx` | Status indicators | Dùng cho boolean/toggle states. |
| `Tag.tsx` | Labels | Dùng cho categorization. |

**`src/ui/input/` — Interactive elements:**

| Component | Mô tả | Notes |
|-----------|-------|-------|
| `TextInput.tsx` | Core text input | Sizes `xs/sm/md/lg`, adornments (icon left/right), password toggle, error state (red border), auto-grow, focus ring. Height 32px (sm) / 40px (md). |
| `TextArea.tsx` | Multi-line input | Auto-grow, min-height 60px, same error pattern. |
| `Select.tsx` | Dropdown select | Searchable, clearable, radius sm. |
| `InputLabel.tsx` | Form label | Font sm/500, color secondary. Required indicator. |
| `InputErrorHelper.tsx` | Error message | Font sm, color danger, `aria-live="polite"`, absolute positioned. |
| `InputHint.tsx` | Helper text | Font sm, color tertiary. |

**`src/ui/layout/` — Layout primitives:**

| Component | Mô tả | Notes |
|-----------|-------|-------|
| `Card.tsx` | Base card | Background primary, radius sm (4px), shadow light, padding 6 (24px). |
| `Section.tsx` | Section wrapper | Gap 10 (40px) giữa sections, gap 3 (12px) giữa elements. |
| `Modal.tsx` | Base modal | Width variants: `sm` (400px), `md` (560px), `lg` (640px). Backdrop black/50 + blur-sm. Scale 95%→100% + fade 150ms. Focus trap. Escape đóng. `createPortal` ra `document.body`. |
| `Table.tsx` | Base table | White bg, radius sm, shadow light. Header row: bg secondary, text eyebrow (uppercase, tracking-wide). |
| `TableHeader.tsx` | Sortable header | Click để sort, icon arrow up/down. |
| `TableRow.tsx` | Table row | Height 52px, hover bg secondary/50, transition 100ms. |
| `TableCell.tsx` | Table cell | Padding 8px horizontal. |

**`src/ui/navigation/` — Navigation:**

| Component | Mô tả |
|-----------|-------|
| `NavigationDrawerItem.tsx` | (đã mô tả ở Phase 2) |
| `Breadcrumb.tsx` | (đã mô tả ở Phase 2) |
| `MobileNavigationBar.tsx` | Bottom nav bar cho mobile. Height 56px, 4-5 tabs. |

**`src/ui/feedback/` — Loaders, toasts, dialogs:**

| Component | Mô tả | Notes |
|-----------|-------|-------|
| `ToastProvider.tsx` | Queue-based toast | Max queue 5, deduplication via `dedupeKey`, auto-dismiss 3s với progress bar, pause on hover. Variants: default/error/success/info/warning. Position top-right. |
| `useToast.ts` | Hook `enqueueSuccess`, `enqueueError`, `enqueueInfo`, `enqueueWarning`, `closeToast` | |
| `ConfirmationModal.tsx` | Danger confirmation | Yêu cầu type confirmation text cho actions nguy hiểm (delete, permanent delete). Danger accent, loading state. |
| `DialogManager.tsx` | Queued dialog system | FIFO, max queue limit. Dùng cho non-blocking stacked dialogs. |
| `PageContentSkeletonLoader.tsx` | Page-level skeleton | Skeleton cho toàn bộ page content. |
| `LeftPanelSkeletonLoader.tsx` | Sidebar skeleton | |
| `TableSkeletonLoader.tsx` | Table skeleton | 5 rows với pulsing bg. |

---

#### Phase 4: Table & List Refactor

**Nâng cấp toàn bộ tables trong app:**

1. **Filter chips**: Hiển thị active filters trên toolbar dưới dạng removable chips.
2. **Column resizing**: Drag handle ở border header để resize (CSS grid/flex resize pattern, không cần thư viện nặng).
3. **Selection patterns**:
   - Checkbox column đầu table.
   - Shift-click để select range.
   - Click outside table để deselect all.
   - Bulk actions bar xuất hiện khi có selection (slide up từ bottom).
4. **Context-aware empty states**:
   - Database trống → `EmptyState` với CTA "Tạo mới".
   - Filter/search không match → `EmptyState` với text "Không tìm thấy kết quả" + nút "Xóa bộ lọc".
   - No permission → `EmptyState` read-only.
5. **Virtualized scrolling**: Cân nhắt cho `AgentsPage` (2549 rows) và `ActivityLogPage` nếu performance cần. Dùng `react-window` hoặc CSS container + lazy render.

**Tables cần refactor:**
- `AgentsPage` (main table)
- `RequestsPage` (main table)
- `AgentDetailPage` (M1 list, T1 history)
- `RequestDetailPage` (comments, step history)
- `ActivityLogPage` (timeline)
- `TrashPage` (recycle bin)
- `HolidaysPage` (holidays list)
- `RanksPage` / `DivisionsPage` (CRUD tables)
- `EmailTemplatesPage` (template list)
- `ExcelGeneratorPage` (template manager, history)

---

#### Phase 5: Form Patterns

**Tạo form primitives:**
- `FormField.tsx` — Wrapper: `InputLabel` + input + `InputErrorHelper` + `InputHint`.
- `FormSection.tsx` — Group các fields với title.

**Refactor forms chính sang `react-hook-form` + `zod`:**

| Form | Schema chính | Ghi chú |
|------|-------------|---------|
| `LoginPage` | `z.object({ email: z.string().email(), password: z.string().min(6) })` | Thay native form validation. |
| `ChangePasswordPage` | `z.object({ password: z.string().min(6), confirm: z.string() }).refine((data) => data.password === data.confirm, ...)` | |
| `CreateRequestModal` | Validate T1 mới được chọn, eligibility check | Giữ logic eligibility RPC, chỉ refactor form handling. |
| `AgentInfoTab` (edit) | Schema cho ~25 fields của schema v2 | Chia thành sections. |
| `Rank/Division CRUD` | `z.object({ name: z.string().min(1) })` | Đơn giản. |
| `EmailTemplateEdit` | `z.object({ name: z.string().min(1), subject: z.string().min(1), body: z.string().min(1) })` | |
| `HolidayForm` | `z.object({ holiday_date: z.string().date(), name: z.string().min(1), year: z.number() })` | |

**Validation UI pattern:**
- Error → red border (`border-red-500`) + `InputErrorHelper` hiển thị message.
- Focus → ring 2px accent + offset 2px.
- Disabled → opacity 50%, cursor not-allowed.
- Loading → skeleton hoặc spinner trong input.

---

#### Phase 6: Accessibility & Motion

**Focus Management:**
```css
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 4px;
}
```
- Focus trap trong tất cả modals (dùng hook `useFocusTrap` hiện có, nâng cấp nếu cần).
- Focus stack cho nested modals/dialogs.

**Touch Targets:**
- Min 40×40px cho tất cả interactive elements (buttons, inputs, checkboxes, nav items).
- Nếu visual element nhỏ hơn 40px → padding hoặc hit area mở rộng.

**Semantic HTML:**
- `<header>` cho app header.
- `<nav>` cho sidebar navigation.
- `<main>` cho main content area.
- `<section aria-labelledby="...">` cho các page sections.
- Headings tuân thủ thứ tự `h1` → `h2` → `h3`, không skip level.

**ARIA:**
- `aria-label` trên tất cả icon-only buttons.
- `aria-hidden="true"` trên decorative icons.
- `aria-live="polite"` trên error messages.
- `aria-describedby` / `aria-errormessage` liên kết input với error.
- `role="dialog"` + `aria-modal="true"` cho modals.

**Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
- **Hover transitions**: 250ms ease-out.
- **Card entrance**: 700ms cubic-bezier `0.22, 1, 0.36, 1`, 90ms stagger (chỉ cho page load, không cho re-render).
- **Modal open**: Scale 95%→100% + fade, 150ms ease-out.
- **Modal close**: Scale 100%→95% + fade, 100ms ease-in.
- **Toast**: Slide in from right, 300ms.
- **Skeleton**: Pulse opacity 0.5→1, 2s infinite.
- **Không bounce, không elastic, không parallax.**

**Color Contrast:**
- Tất cả text trên background phải đạt WCAG AA (4.5:1 cho normal text, 3:1 cho large text).
- Disabled states dùng opacity 40% thay vì đổi màu.

---

#### Phase 7: Page-by-Page Polish

**Global changes áp dụng cho mọi page:**
- Background page: `bg-background-tertiary` (thay `bg-neutral-100`).
- Cards: `bg-background-primary`, radius 4px, shadow light.
- Typography: Base 13px, headings dùng scale mới, **không dùng font-bold** (max font-semibold).
- Spacing: Tăng whitespace giữa sections (gap 40px+), giảm information density.
- Buttons:
  - Primary: `bg-accent-primary text-white hover:bg-accent-primary/90`.
  - Outline: `border border-border-hairline hover:bg-background-secondary`.
  - Danger: `bg-red-500 text-white`.
  - Ghost: `hover:bg-background-secondary`.
  - Radius: 4px (sm). Height 32px (sm) / 40px (md).
- Inputs:
  - Border: `1px solid gray-6` (thay neutral-300).
  - Focus: `ring-2 ring-accent-primary/20 border-accent-primary`.
  - Error: `border-red-500`.
  - Height: 40px.

**7.1 Login Page**
- Gradient background → **bỏ gradient**, dùng `bg-background-tertiary` + card centered.
- Card: radius 8px (md), shadow super-heavy, padding 48px (spacing-12).
- Inputs: dùng `TextInput` primitive.
- Button: full width, height 40px.

**7.2 Dashboard**
- Stat cards: Radius 4px, shadow light, padding 24px. Icon 24px accent color. Label: font sm/tertiary. Value: font xxl/600 (thay H1 32px).
- Alert card: Radius 4px, border-left 4px warning.
- Bookmark widget: Card style, avatar + name + badge.
- Status chart: Donut/Pie → đơn giản hóa, legend dưới.
- B2 Eligible list & M1 Transition list: Dùng table primitive với hover states.

**7.3 Agents List**
- Toolbar: `PageHeader` pattern + search `TextInput` + filter chips.
- Table:
  - Header: eyebrow style (uppercase, tracking-wide, font xs).
  - Rows: height 52px, hover bg secondary.
  - Bookmark star: 16px, warning khi active.
  - Status badge: Pill component.
- Pagination: Smart ellipsis, max 7 visible buttons.
- Export modal: Dùng `Modal` primitive.

**7.4 Agent Detail**
- Header: Back arrow + `PageHeader`.
- Info cards: `Card` component, 2-column grid.
  - Label: font sm/tertiary. Value: font md/primary.
- Tabs: Improved styling (active border-bottom accent, font md/500).
- M1 Table: Dùng table primitive.
- T1 History Timeline: Dots 10px accent, line 2px gray-4.

**7.5 Requests List**
- Status Kanban summary: 5 cards horizontal, radius 4px, padding 16px.
- Table: Same patterns as Agents List.
- Filter: Multi-choice status filter dạng toggle chips.

**7.6 Request Detail**
- Header: `PageHeader` + status badge (large).
- Step progress bar:
  - Completed: filled circle + solid line.
  - Current: outlined circle + pulse animation.
  - Future: gray circle + dashed line.
  - B3 locked: icon đồng hồ, gray.
  - B3 ready: icon sáng, accent.
- Comments thread:
  - Avatar 28px circle.
  - Self: căn phải, bg accent/10.
  - Other: căn trái, bg secondary.
  - Input: `TextArea` primitive + send button.
- Notification checklist: Checkbox primitive + label.

**7.7 Upload Page**
- Dropzone: Dashed border `gray-6`, radius 12px (xl), padding 48px.
  - Hover: border accent + bg accent/5.
- Progress bar: Height 8px, bg gray-3, fill accent.
- Preview table: Dùng table primitive, max 10 rows.
- Data quality report: Modal primitive.

**7.8 Email Templates**
- List view: Table primitive.
- Edit modal: `Modal` lg (640px), `HtmlEditor` restyle toolbar (icon 16px, padding 8px, radius 4px).
- Preview modal: Render HTML với sanitized output.

**7.9 Compose Template Modal**
- Modal md (560px).
- Contact info: Card sub-component.
- Content preview: `div` với rendered HTML (không textarea).
- Copy buttons: Ghost style + icon.

**7.10 Activity Log**
- Timeline: Group by date.
  - Dot: 8px circle, color theo action type.
  - Time: font xs/tertiary.
  - Content: font md/primary.
- Filter: `Select` primitive.

**7.11 Trash / Holidays / Ranks / Divisions**
- Table primitive + `EmptyState` context-aware.
- CRUD modals: `Modal` primitive + `FormField` wrapper.
- Confirm delete: `ConfirmationModal` với type confirmation ("DELETE").

**7.12 Excel Generator**
- Template manager: Table primitive + `Badge` mapping status.
- Generate panel: `Card` sections, `Select` template, dropzone data file.
- Preview: Table primitive với expression evaluated.
- History: Table primitive.

**7.13 Settings (nếu có)**
- Settings navigation drawer: Collapsible sections.
- Settings forms: `SettingsTextInput` pattern (label bên trái, input bên phải).

### 5. UI/UX

Xem chi tiết đầy đủ tại `Yuzi/docs/twenty-ui-ux-reference/`:
- `design-philosophy.md` — Triết lý editorial, whitespace-first, typography-driven.
- `design-tokens.md` — Color palette, typography, spacing, radius, shadows.
- `layout-navigation.md` — Resizable sidebar, PageHeader, Breadcrumbs, Mobile nav.
- `component-conventions.md` — Named exports, props naming, file structure, styled component rules (adapt sang Tailwind).
- `table-list-patterns.md` — Virtualized, resize, selection, filter chips, context-aware empty states.
- `form-patterns.md` — react-hook-form + zod, validation UI, input states.
- `feedback-patterns.md` — Queue toast, dialog manager, skeleton, empty states, confirmation modal.
- `accessibility.md` — WCAG AA, focus rings, touch targets, semantic HTML, `prefers-reduced-motion`.
- `icon-system.md` — Sizing, stroke width, `aria-hidden`, `aria-label`.

### 6. Files cần sửa / tạo

#### Files mới (primitives):

| File | Mô tả |
|------|-------|
| `src/ui/theme/tokens.css` | CSS custom properties design tokens |
| `src/ui/layout/PageContainer.tsx` | Page wrapper |
| `src/ui/layout/PageHeader.tsx` | Page header bar |
| `src/ui/layout/PageBody.tsx` | Content row |
| `src/ui/layout/ShowPageContainer.tsx` | Detail page container |
| `src/ui/layout/Card.tsx` | Base card |
| `src/ui/layout/Section.tsx` | Section wrapper |
| `src/ui/layout/Modal.tsx` | Base modal (portal, focus trap, animation) |
| `src/ui/layout/Table.tsx` | Base table |
| `src/ui/layout/TableHeader.tsx` | Sortable header |
| `src/ui/layout/TableRow.tsx` | Table row |
| `src/ui/layout/TableCell.tsx` | Table cell |
| `src/ui/display/Badge.tsx` | Status badge |
| `src/ui/display/EmptyState.tsx` | Context-aware empty state |
| `src/ui/display/Skeleton.tsx` | Theme-aware skeleton |
| `src/ui/display/Avatar.tsx` | Avatar |
| `src/ui/display/AvatarGroup.tsx` | Avatar stack |
| `src/ui/display/Chip.tsx` | Data chip |
| `src/ui/display/Pill.tsx` | Status pill |
| `src/ui/display/Tag.tsx` | Label tag |
| `src/ui/input/TextInput.tsx` | Text input primitive |
| `src/ui/input/TextArea.tsx` | Text area primitive |
| `src/ui/input/Select.tsx` | Select dropdown |
| `src/ui/input/InputLabel.tsx` | Form label |
| `src/ui/input/InputErrorHelper.tsx` | Error helper |
| `src/ui/input/InputHint.tsx` | Hint text |
| `src/ui/navigation/NavigationDrawerItem.tsx` | Sidebar nav item |
| `src/ui/navigation/Breadcrumb.tsx` | Breadcrumb |
| `src/ui/navigation/MobileNavigationBar.tsx` | Mobile bottom nav |
| `src/ui/feedback/ToastProvider.tsx` | Toast provider (queue) |
| `src/ui/feedback/useToast.ts` | Toast hook |
| `src/ui/feedback/ConfirmationModal.tsx` | Danger confirmation modal |
| `src/ui/feedback/DialogManager.tsx` | Queued dialog manager |
| `src/ui/feedback/PageContentSkeletonLoader.tsx` | Page skeleton |
| `src/ui/feedback/TableSkeletonLoader.tsx` | Table skeleton |
| `src/components/FormField.tsx` | Form field wrapper |
| `src/components/FormSection.tsx` | Form section wrapper |

#### Files sửa (existing):

| File | Thay đổi |
|------|----------|
| `src/index.css` | Thêm tokens import, base 13px, global focus ring, prefers-reduced-motion, form display contents |
| `src/main.tsx` | Thêm ToastProvider, DialogManager |
| `src/App.tsx` | Integrate providers |
| `src/components/Layout.tsx` | Refactor sidebar resizable/collapsible, mobile nav, PageHeader integration |
| `src/components/PageTransition.tsx` | Update animation, respect prefers-reduced-motion |
| `src/components/Modal.tsx` | Replace bằng primitive mới hoặc extend |
| `src/components/Skeleton.tsx` | Replace bằng primitive mới |
| `src/components/Badge.tsx` | Replace bằng primitive mới |
| `src/components/EmptyState.tsx` | Replace bằng primitive mới |
| `src/components/Pagination.tsx` | Style update (radius 4px, font sm) |
| `src/components/CommandPalette.tsx` | Style update, font scale |
| `src/components/NotificationDropdown.tsx` | Style update, font scale |
| `src/components/HtmlEditor.tsx` | Restyle toolbar (icon 16px, padding 8px, radius 4px) |
| `src/pages/LoginPage.tsx` | Dùng Card, TextInput primitives. Bỏ gradient. |
| `src/pages/ChangePasswordPage.tsx` | Dùng Card, TextInput primitives. Thêm zod validation. |
| `src/pages/DashboardPage.tsx` | Dùng Card, Section, PageHeader, Table primitives. Restyle stat cards. |
| `src/pages/AgentsPage.tsx` | Dùng PageHeader, Table, TextInput, EmptyState primitives. Filter chips. |
| `src/pages/AgentDetailPage.tsx` | Dùng Card, Section, Table, Avatar primitives. Tab restyle. |
| `src/pages/RequestsPage.tsx` | Dùng PageHeader, Table, Badge, EmptyState primitives. Kanban cards restyle. |
| `src/pages/RequestDetailPage.tsx` | Dùng Card, Section, Modal, TextArea, EmptyState primitives. Stepper restyle. |
| `src/pages/UploadPage.tsx` | Dùng Card, Table, Modal primitives. Dropzone restyle. |
| `src/pages/EmailTemplatesPage.tsx` | Dùng Table, Modal, FormField primitives. |
| `src/pages/ActivityLogPage.tsx` | Dùng Section, EmptyState primitives. Timeline restyle. |
| `src/pages/TrashPage.tsx` | Dùng Table, EmptyState, ConfirmationModal primitives. |
| `src/pages/HolidaysPage.tsx` | Dùng Table, Modal, FormField primitives. |
| `src/pages/RanksPage.tsx` | Dùng Table, Modal, FormField primitives. |
| `src/pages/DivisionsPage.tsx` | Dùng Table, Modal, FormField primitives. |
| `src/pages/ExcelGeneratorPage.tsx` | Dùng Card, Table, Select, EmptyState primitives. |
| `src/components/CreateRequestModal.tsx` | Dùng Modal, TextInput, Select, FormField primitives. |
| `src/components/ExportModal.tsx` | Dùng Modal primitive. |
| `src/components/ComposeTemplateModal.tsx` | Dùng Modal, Card, EmptyState primitives. |
| `src/components/SendEmailModal.tsx` | Dùng Modal, TextInput, FormField primitives. |
| `src/components/DeactivateAgentModal.tsx` | Dùng Modal, ConfirmationModal primitives. |
| `src/components/RestoreAgentModal.tsx` | Dùng Modal primitive. |
| `src/components/CountdownConfirmModal.tsx` | Dùng Modal primitive. Style update. |
| `src/components/dashboard/*.tsx` | Restyle dùng Card, Section primitives. |
| `src/components/agent-detail/*.tsx` | Restyle dùng Card, Section, Table, Avatar primitives. |
| `src/components/request-detail/*.tsx` | Restyle dùng Card, Section, Table, TextArea primitives. |
| `src/components/email-templates/*.tsx` | Restyle dùng Modal, FormField primitives. |
| `src/components/excel-generator/*.tsx` | Restyle dùng Card, Table, Select, Modal primitives. |
| `src/hooks/useFocusTrap.ts` | Nâng cấp hỗ trợ focus stack cho nested modals. |

### 7. Schema / SQL changes

**Không cần.** Đây là refactor UI/UX thuần túy, không thay đổi DB schema, tables, indexes, hay RLS policies.

### 8. API / Integration changes

**Không cần.** Không thay đổi API calls, Supabase queries, third-party integrations, hay Edge Functions.

### 9. Test Plan

#### Phase 1-2: Tokens & Layout
1. Build pass: `npm run build` không lỗi TypeScript hay CSS.
2. Visual check: Mở app → verify màu sắc, typography (base 13px), spacing đúng tokens.
3. Responsive:
   - Desktop: Sidebar full 240px, resizable.
   - Tablet: Sidebar collapsed icon-only.
   - Mobile: Sidebar ẩn, bottom nav bar hiển thị.
4. Focus ring: Tab qua các interactive elements → verify outline 2px accent + 4px offset.

#### Phase 3: Primitives
5. Component isolation test (tạm thờiv page hoặc Storybook nếu có):
   - Modal: Open/close animation, focus trap, Escape, backdrop click, portal.
   - Toast: Enqueue multiple toasts, auto-dismiss, pause on hover, dedupe.
   - Table: Sort, select, shift-click range.
   - Input: Focus, error, disabled states.
   - EmptyState: Switch contexts → verify text/icon thay đổi.

#### Phase 4-5: Table & Form
6. Table regression:
   - AgentsPage: Search, filter, sort, select, pagination hoạt động.
   - RequestsPage: Multi-choice status filter, Kanban click.
   - ActivityLogPage: Timeline hiển thị đúng.
7. Form validation:
   - Login: Email invalid → error. Password < 6 → error.
   - CreateRequest: Chưa chọn T1 mới → error.
   - Rank/Division: Tên trống → error.

#### Phase 6: Accessibility & Motion
8. Keyboard navigation:
   - Tab qua toàn bộ page → không bị trap ngoài modal.
   - Modal open → Tab vòng lặp trong modal.
   - Escape đóng modal/toast.
9. Screen reader (optional): Verify `aria-label`, `aria-live`, semantic landmarks.
10. prefers-reduced-motion: Bật trong OS → verify animations tắt, hover translate disabled.
11. Touch targets: Inspect elements → verify min 40×40px.

#### Phase 7: Page-by-Page
12. Visual regression checklist (so sánh trước/sau trên tất cả routes):
    - [ ] Login
    - [ ] Change Password
    - [ ] Dashboard
    - [ ] Agents List
    - [ ] Agent Detail
    - [ ] Requests List
    - [ ] Request Detail
    - [ ] Upload
    - [ ] Email Templates
    - [ ] Activity Log
    - [ ] Trash
    - [ ] Holidays
    - [ ] Ranks
    - [ ] Divisions
    - [ ] Excel Generator
13. Business logic regression:
    - Tạo request đổi T1 → verify eligibility check vẫn chạy.
    - Hoàn tất request → verify M1 transition tasks vẫn tạo.
    - Upload agent → verify upsert theo `staff_id`.
    - Export Excel → verify file tải về đúng.
    - Generate mail merge → verify expression evaluate đúng.

### 10. Rollout Plan

1. **Phase 1-2** (Tokens + Layout): Code trên branch `refactor/ui-ux-phase-1`. Test layout responsive + tokens.
2. **Phase 3** (Primitives): Tiếp tục trên cùng branch. Test từng primitive isolation.
3. **Phase 4-5** (Table + Form): Test tables + forms chính.
4. **Phase 6** (A11y + Motion): Song song với Phase 7.
5. **Phase 7** (Pages): Làm từng page, 2-3 page/ngày. Ưu tiên: Login → Dashboard → Agents → Requests → Detail pages → Còn lại.
6. **Final QA**: Manual test toàn bộ 15 routes + build pass.
7. **User acceptance**: Demo cho user trước khi deploy.
8. **Deploy**: `npm run build` → `vercel --prod` (chờ user xác nhận riêng).

### 11. Notes

- **Backward compatibility**: Giữ nguyên tất cả business logic, API calls, data flow, TanStack Query hooks. Chỉ thay đổi presentation layer.
- **Tailwind v4**: Dùng `@theme` block và CSS-first configuration. Không dùng `tailwind.config.js` legacy. Không dùng `@apply` nếu có thể tránh (ưu tiên utility classes inline hoặc component extract).
- **Icons**: Giữ nguyên **Lucide React** để tránh tăng bundle size. Áp dụng sizing conventions của Twenty (sm/md/lg/xl: 14/16/20/24px, stroke 2). Không cài `@tabler/icons-react`.
- **Font**: Đảm bảo `Inter` đã được load (Google Fonts hoặc self-host trong `index.html`). Nếu chưa có → thêm `<link>` trong `index.html`.
- **Performance monitoring**: Theo dõi bundle size sau khi thêm nhiều components. Mục tiêu: không tăng quá 20% initial bundle.
- **Risk mitigation**:
  - Làm theo phase rõ ràng, test kỹ từng phase trước khi sang phase tiếp.
  - Nếu phát sinh bug nghiêm trọng trong quá trình refactor → **pause ngay**, ghi vào `PLAN-bug-fixes.md`, fix trước khi tiếp tục.
  - Không xóa components cũ ngay lập tức — để lại comment `// TODO-REFACTOR[005]: Deprecated, dùng src/ui/...` trong 1 sprint trước khi xóa hoàn toàn.
- **Docs sync sau mỗi phase**: Cập nhật `CHANGELOG.md` với những gì đã làm. Cập nhật `UI-DESIGN.md` khi design system chính thức thay đổi.
- **Dependencies cần cài** (nếu chưa có):
  - `react-hook-form` + `@hookform/resolvers` + `zod` (Phase 5).
  - `react-window` (Phase 4, optional — chỉ cài nếu virtualized scrolling cần thiết sau test performance).

---

---

## FEAT-025: Email Activities Table cho M1 Transition Tracking

- **Đề xuất**: 2026-06-11
- **Status**: `done`
- **Priority**: `medium`

#### 1. Mô tả feature
Tạo bảng `email_activities` riêng để audit việc copy/gửi email trong M1 Transition. Thay thế logic cũ (tính khi Resend API thành công) bằng logic mới: tính khi user bấm "Copy nội dung" trong `ComposeTemplateModal`.

#### 2. Motivation / Why
- Hiện tại: `email_sent_count` chỉ tăng khi `SendEmailModal` gọi Resend Edge Function thành công.
- Vấn đề: Chưa dùng Resend thật trong production. Operator thực tế copy nội dung rồi paste vào Gmail/Zalo/Outlook.
- Giải pháp: Track mỗi lần copy vào bảng audit riêng (`email_activities`), có đầy đủ: ai copy, khi nào, nội dung gì.

#### 3. Scope
**In scope:**
- Tạo bảng `email_activities` (migration SQL)
- RLS policies
- PostgreSQL trigger tự động cập nhật `email_sent_count` trong `m1_transition_tasks`
- TypeScript interface `EmailActivity`
- Insert record khi user bấm "Copy nội dung" trong `ComposeTemplateModal`
- Xóa logic cũ trong `SendEmailModal`

**Out of scope:**
- Không track "Copy email"
- Không thêm UI xem lịch sử chi tiết
- Không thay đổi UI `M1TransitionList`

#### 4. Technical Design
- Bảng `email_activities` có FK đến `m1_transition_tasks(id)`
- Trigger `trg_update_m1_email_count`: AFTER INSERT ON `email_activities` → UPDATE `m1_transition_tasks` (count++, last_sent=NOW())
- Lý do dùng trigger: data consistency, frontend query đơn giản, project đã có nhiều trigger

#### 5. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/migrations/018_email_activities.sql` | Tạo mới: bảng, index, RLS, trigger |
| `src/types/index.ts` | Thêm `EmailActivity` interface |
| `src/components/ComposeTemplateModal.tsx` | Insert `email_activities` khi copy, invalidate query |
| `src/components/SendEmailModal.tsx` | Xóa logic update `email_sent_count` cũ, xóa prop `m1TaskId` |

#### 6. Schema / SQL changes
```sql
CREATE TABLE IF NOT EXISTS public.email_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.m1_transition_tasks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('copy_content', 'send')),
  content_preview TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_activities_task_id ON public.email_activities(task_id);

-- Trigger cập nhật count
CREATE OR REPLACE FUNCTION public.handle_email_activity_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.m1_transition_tasks
  SET email_sent_count = COALESCE(email_sent_count, 0) + 1,
      last_email_sent_at = NOW()
  WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_m1_email_count
AFTER INSERT ON public.email_activities
FOR EACH ROW EXECUTE FUNCTION public.handle_email_activity_insert();
```

#### 7. Test Plan
1. Tạo M1 task → mở ComposeTemplateModal → bấm "Copy nội dung"
2. Verify `email_activities` có 1 record, `m1_transition_tasks.email_sent_count` = 1
3. Bấm "Copy email" → không tạo record
4. Bấm "Copy nội dung" lần 2 → count = 2

#### 8. Rollout Plan
- Chạy migration trong Supabase SQL Editor
- Deploy code frontend
- Không cần data migration

#### 9. Notes
- Các task cũ đã có `email_sent_count > 0` giữ nguyên (gap audit chấp nhận được)
- `content_preview` strip HTML bằng regex, cắt 200 ký tự

---

---

## FEAT-027: Gửi email qua Google Apps Script

- **Đề xuất**: 2026-06-12
- **Status**: `backlog` *(tạm dừng theo yêu cầu 2026-06-26 — ưu tiên feature Google Drive mới)*
- **Priority**: `high`

#### 1. Mô tả feature
Tích hợp gửi email thật từ app qua **Google Apps Script Web App** thay vì Resend. Khi user bấm **"Gửi email"** trong `ComposeTemplateModal`, hệ thống sẽ gọi Supabase Edge Function → Edge Function gọi Google Apps Script → Apps Script dùng `GmailApp.sendEmail()` để gửi email từ tài khoản Google của tổ chức.

#### 2. Motivation / Why
- Resend yêu cầu verify domain (`myera.com.vn`) qua DNS records SPF/DKIM/DMARC — hiện tại chưa thể dùng.
- Tổ chức đã có sẵn Gmail/Google Workspace và muốn dùng automation của Google.
- Google Apps Script đơn giản, không cần maintain server riêng, chi phí thấp.

#### 3. Scope

**In scope:**
- Tạo Google Apps Script với endpoint `doPost(e)` để nhận request gửi email.
- Deploy Apps Script dạng Web App (exec as user hoặc as me).
- Tạo Supabase Edge Function `send-email-gapps` để gọi Apps Script URL một cách bảo mật.
- Lưu Apps Script Web App URL vào Supabase secrets (không để lộ ở frontend).
- Bật lại nút **"Gửi email"** trong `ComposeTemplateModal`.
- Cập nhật `SendEmailModal` để gọi Edge Function mới.
- Lưu log gửi email vào bảng `email_logs` (đã có từ FEAT-001).
- Cập nhật `email_activities` để track số lần gửi cho M1 Transition (nếu gửi từ M1 task).

**Out of scope:**
- Không tự động gửi email khi request chuyển status (chỉ gửi thủ công từ UI).
- Không thay đổi cấu trúc bảng `email_templates`.
- Không gửi email qua SMTP trực tiếp.
- Không tích hợp Google Calendar/Sheet khác.

#### 4. Technical Design

**4.1 Google Apps Script (standalone script)**
Tạo script mới tại [script.google.com](https://script.google.com):

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}')
  const { to, cc, bcc, subject, htmlBody, fromName } = data

  if (!to || !subject || !htmlBody) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Thiếu to/subject/body' }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  try {
    GmailApp.sendEmail(to, subject, '', {
      htmlBody: htmlBody,
      cc: cc || undefined,
      bcc: bcc || undefined,
      name: fromName || 'Phòng Vận Hành ERA',
    })
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

Deploy → **Web App**:
- Execute as: `Me` (hoặc tài khoản service chung)
- Who has access: `Anyone` (hoặc `Anyone within [domain]` nếu có Google Workspace)
- Copy **Web App URL**.

**4.2 Supabase Edge Function `send-email-gapps`**
File: `supabase/functions/send-email-gapps/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { to, cc, bcc, subject, html, template_key, agent_id, task_id } = body

  if (!to || !subject || !html) {
    return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { status: 400 })
  }

  const gappsUrl = Deno.env.get('GAPPS_WEBAPP_URL')
  if (!gappsUrl) {
    return new Response(JSON.stringify({ success: false, error: 'GAPPS_WEBAPP_URL not configured' }), { status: 500 })
  }

  const gappsRes = await fetch(gappsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      cc,
      bcc,
      subject,
      htmlBody: html,
      fromName: 'Phòng Vận Hành ERA',
    }),
  })
  const gappsData = await gappsRes.json().catch(() => ({ success: false, error: 'Invalid response from Apps Script' }))

  await supabaseClient.from('email_logs').insert({
    sent_by: user.id,
    recipient_agent_id: agent_id,
    template_key,
    subject,
    body: html,
    status: gappsData.success ? 'sent' : 'failed',
    error_message: gappsData.success ? null : gappsData.error,
  })

  if (task_id && gappsData.success) {
    await supabaseClient.from('email_activities').insert({
      task_id,
      action_type: 'send',
      content_preview: html.replace(/<[^>]*>/g, '').slice(0, 200),
      created_by: user.id,
    })
  }

  return new Response(JSON.stringify(gappsData), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**4.3 Secrets cần set trong Supabase Dashboard**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (đã có sẵn)
- `GAPPS_WEBAPP_URL`: URL từ Apps Script Web App

**4.4 Frontend changes**

**`ComposeTemplateModal.tsx`**
- Bật lại nút **"Gửi email"** trong footer modal, bên cạnh "Copy nội dung" và "Copy email".
- Nút chỉ hiển thị khi:
  - Đã chọn template (`template` hợp lệ).
  - Có ít nhất 1 recipient hợp lệ (`agent` có email hoặc T1 liên quan có email).
- Khi bấm → mở `SendEmailModal` với đầy đủ props: `agent`, `t1Old`, `newT1`, `tempT1`, `templateSubject`, `templateBody`, `templateKey`, `b3Deadline`, `m1TaskId` (nếu mở từ M1 Transition row).
- Giữ nguyên các nút "Copy" — gửi email là tùy chọn thêm, không thay thế copy.

**`SendEmailModal.tsx`**
- Thay `supabase.functions.invoke('send-email', ...)` thành `supabase.functions.invoke('send-email-gapps', ...)`.
- Payload gửi đi:
  ```ts
  {
    to: string
    cc?: string[]
    bcc?: string[]
    subject: string
    html: string
    template_key: string
    agent_id?: string
    task_id?: string
  }
  ```
- Bỏ trường `from` trong UI vì sender do Apps Script quản lý.
- Thêm trạng thái `isSending` để disable nút gửi và hiển thị spinner.
- Xử lý response:
  - `success: true` → toast "Đã gửi email thành công", đóng modal.
  - `success: false` → toast "Gửi email thất bại: {error}", giữ modal mở để user sửa.
  - Network/Edge Function lỗi → toast "Không thể kết nối dịch vụ gửi email".
- Vẫn insert vào `email_logs` nhưng giờ do Edge Function xử lý, frontend không cần insert thêm.

**4.5 Data flow & audit**

```
User bấm "Gửi email"
  → ComposeTemplateModal mở SendEmailModal
  → SendEmailModal gọi supabase.functions.invoke('send-email-gapps', {...})
  → Edge Function verify JWT
  → Edge Function gọi Apps Script Web App URL
  → Apps Script gửi email qua GmailApp
  → Apps Script trả kết quả { success, error? }
  → Edge Function:
      1. Insert `email_logs` (status: sent/failed, error_message)
      2. Nếu task_id tồn tại và success → insert `email_activities` (action_type: 'send')
  → Edge Function trả response về frontend
  → Frontend toast + đóng modal
```

**4.6 Security considerations**

| Rủi ro | Giải pháp |
|---|---|
| Web App URL bị lộ | Không đưa URL vào frontend/env client. Chỉ lưu trong Supabase Edge Function secrets. |
| Anonymous call đến Apps Script | Edge Function verify JWT token của user đăng nhập. Chỉ authenticated user mới gọi được. |
| Gửi email spam/quota abuse | Không có rate limit trong code hiện tại. Cân nhắt thêm rate limit sau nếu cần. |
| Email body chứa HTML độc hại | `ComposeTemplateModal` đã render template từ DB; `SendEmailModal` hiển thị preview. Tin tưởng admin/operator. Không cần sanitize thêm vì nội dung do user soạn. |
| Apps Script chạy với quyền cá nhân | Nên deploy "Execute as: Me" với tài khoản dịch vụ chung (vd: `opt@myera.com.vn`) thay vì tài khoản cá nhân. |

#### 5. UI/UX
- Giữ nguyên giao diện `SendEmailModal` hiện tại.
- Nút "Gửi email" trong `ComposeTemplateModal` hiển thị cạnh "Copy nội dung" và "Copy email".
- Toast: "Đã gửi email thành công" / "Gửi email thất bại: ...".

#### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `supabase/functions/send-email-gapps/index.ts` | **Mới** — Edge Function gọi Apps Script + lưu log |
| `src/components/ComposeTemplateModal.tsx` | Bật lại nút "Gửi email" mở `SendEmailModal`; truyền thêm `m1TaskId` |
| `src/components/SendEmailModal.tsx` | Đổi invoke sang `send-email-gapps`, bỏ trường `from`, thêm `isSending` state, xử lý response |
| `src/types/index.ts` | (nếu cần) thêm type `SendEmailGappsPayload` hoặc giữ inline |
| `CHANGELOG.md` | Ghi nhận feature sau khi hoàn thành |
| `PROGRESS.md` | Cập nhật status FEAT-027 → done khi xong |

#### 7. Schema / SQL changes
Không cần thay đổi schema. Bảng `email_logs` (migration `014_email_logs.sql`) và `email_activities` (`018_email_activities.sql`) đã tồn tại.

#### 8. API / Integration changes
- **Google Apps Script Web App:** Endpoint POST nhận JSON, gửi email qua `GmailApp`.
- **Supabase Edge Function:** `send-email-gapps` — xác thực JWT, validate input, call Apps Script, audit log.
- **Frontend:** Gọi Edge Function thay vì Resend.

#### 9. Test Plan

**9.1 Local / Edge Function test**
1. Chạy `supabase functions serve` trong thư mục `webapp`.
2. Gọi local endpoint bằng cURL/Postman với JWT hợp lệ:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/send-email-gapps \
     -H "Authorization: Bearer <jwt>" \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","subject":"Test","html":"<p>Hello</p>","template_key":"test"}'
   ```
3. Verify response `{ success: true }`.
4. Kiểm tra `email_logs` có record mới với `status = 'sent'`.
5. Test thiếu `to` → response 400.
6. Test JWT sai → response 401.
7. Test `GAPPS_WEBAPP_URL` sai → response 500, `email_logs.status = 'failed'`.

**9.2 Apps Script test**
1. Tạo script tại [script.google.com](https://script.google.com).
2. Paste code `doPost`/`doGet`.
3. Deploy → Web App → copy URL.
4. Set URL vào Supabase secrets.
5. Gửi test email đến 1 địa chỉ nội bộ → verify đến hộp thư.

**9.3 Frontend test**
1. Mở app → Agents → chọn 1 agent → "Soạn mẫu".
2. Verify nút "Gửi email" hiển thị.
3. Bấm "Gửi email" → `SendEmailModal` mở với subject/body đã render đúng.
4. Nhập To + CC → bấm "Gửi email".
5. Verify toast "Đã gửi email thành công", modal đóng.
6. Kiểm tra `email_logs` có record `status = 'sent'`.
7. Nếu gửi từ M1 Transition row → verify `email_activities` có record `action_type = 'send'`.
8. Test offline/Edge Function fail → toast lỗi, modal không đóng.

**9.4 Regression test**
1. Nút "Copy nội dung" và "Copy email" vẫn hoạt động bình thường.
2. `ComposeTemplateModal` từ AgentsPage và Dashboard B2/M1 đều có nút "Gửi email".
3. `npm run verify` pass (tsc + build + lint).
4. `npm run test` 56/56 pass.

#### 10. Rollout Plan

**Phase 1 — Apps Script setup (không cần deploy code)**
1. Tạo Google Apps Script mới.
2. Paste code `doPost`/`doGet`.
3. Deploy dạng Web App:
   - Execute as: `Me` (dùng tài khoản dịch vụ chung nếu có)
   - Who has access: `Anyone` hoặc `Anyone within [domain]`
4. Copy Web App URL.
5. Test Apps Script URL độc lập bằng cURL để đảm bảo nó hoạt động.

**Phase 2 — Code + Edge Function**
1. Viết `supabase/functions/send-email-gapps/index.ts`.
2. Sửa `src/components/SendEmailModal.tsx` để gọi function mới.
3. Sửa `src/components/ComposeTemplateModal.tsx` để bật lại nút "Gửi email".
4. Chạy `npm run verify` và `npm run test`.

**Phase 3 — Staging / Dev test**
1. Set secret `GAPPS_WEBAPP_URL` trong Supabase Dashboard → Edge Functions.
2. Deploy Edge Function lên staging/dev: `supabase functions deploy send-email-gapps`.
3. Test end-to-end từ UI.
4. Verify `email_logs` và `email_activities` ghi nhận đúng.

**Phase 4 — Production deploy (chỉ khi user yêu cầu rõ ràng)**
1. Deploy Edge Function lên production.
2. Deploy frontend (`vercel --prod` sau khi user xác nhận).
3. Kiểm tra 1-2 email đầu tiên trên production.
4. Cập nhật `CHANGELOG.md` và `PROGRESS.md`.

#### 11. Rollback Plan

| Tình huống | Hành động |
|---|---|
| Apps Script fail / quota hết | Tạm thờii ẩn lại nút "Gửi email" trong `ComposeTemplateModal`. User tiếp tục dùng "Copy nội dung". |
| Edge Function lỗi nghiêm trọng | Redeploy version cũ (trước FEAT-027) hoặc ẩn nút "Gửi email". |
| Email vào spam | Chuyển sang Gmail API Service Account hoặc cấu hình DKIM/SPF trên Google Workspace. |
| Web App URL bị lộ | Tạo lại Apps Script Web App URL, update secret `GAPPS_WEBAPP_URL`. |

#### 12. Monitoring & Quota

- **Quota Apps Script:** 20,000 email/ngày (tài khoản consumer), cao hơn với Google Workspace.
- **Monitor:** Query `email_logs` hàng ngày để đếm số email sent/failed.
- **Alert đơn giản:** Nếu số `failed` > 5 trong 1 ngày → kiểm tra Apps Script URL/quota.
- **Không tự động retry:** Nếu gửi fail, user phải bấm gửi lại. Tránh spam.

#### 13. Notes

- **Ưu điểm:**
  - Không cần verify domain như Resend.
  - Dùng sẵn Gmail/Google Workspace.
  - Triển khai nhanh, không cần server riêng.
  - Chi phí thấp (Apps Script miễn phí trong quota).

- **Nhược điểm:**
  - Phụ thuộc vào tài khoản Google cá nhân/tổ chức.
  - Giới hạn quota Apps Script (20,000 email/ngày).
  - Web App URL cần giữ bí mật (do đó phải gọi qua Edge Function).
  - Khó debug hơn Resend vì không có dashboard riêng.

- **Rủi ro & Mitigation:**

  | Rủi ro | Mitigation |
  |--------|------------|
  | Web App URL bị lộ trên frontend | Không bao giờ gọi trực tiếp từ frontend; luôn qua Supabase Edge Function |
  | Apps Script bị spam nếu token bị lộ | Edge Function verify JWT, chỉ authenticated user mới gọi được |
  | Email vào spam | Dùng Google Workspace + domain chính thức; cấu hình DKIM/SPF trên Google Workspace |
  | Apps Script quota vượt giới hạn | Theo dõi `email_logs`; nếu cần scale, chuyển sang Gmail API Service Account sau |
  | Lỗi CORS khi gọi Apps Script | Apps Script `doPost` trả về `ContentService` JSON; Edge Function gọi server-side nên không bị CORS |

---

---

## FEAT-026: Delete Email Template

- **Đề xuất**: 2026-06-12
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-12

#### 1. Mô tả feature
Thêm chức năng **xóa mẫu email** trong trang **Quản lý mẫu email** (`EmailTemplatesPage`). Admin bấm nút "Xóa" trên từng row → hiện modal xác nhận → hard delete mẫu khỏi bảng `email_templates`.

#### 2. Motivation / Why
- Hiện tại trang Email Templates chỉ cho phép Thêm / Sửa / Xem trước.
- Khi có mẫu thử nghiệm, mẫu nháp hoặc mẫu không còn dùng, admin không có cách nào dọn dẹp trong UI.
- Giảm clutter và giữ danh sách mẫu email gọn gàng.

#### 3. Scope

**In scope:**
- Thêm nút "Xóa" vào mỗi row trong `TemplateList`.
- Modal xác nhận xóa hiển thị tên mẫu.
- Mutation `useDeleteEmailTemplateMutation` trong `useEmailTemplates.ts`.
- Hard delete row trong `email_templates` theo `id`.
- Invalidate cache `['email_templates']` sau khi xóa thành công.
- Toast thông báo thành công / lỗi.
- Chỉ admin thấy nút xóa (UI dựa trên role + RLS bảo vệ phía sau).

**Out of scope:**
- Soft delete / Thùng rác cho email templates.
- Bulk delete nhiều mẫu cùng lúc.
- Khôi phục mẫu đã xóa.
- Gửi email thông báo khi xóa mẫu.

#### 4. Technical Design

**Backend:**
- Dùng `supabase.from('email_templates').delete().eq('id', id)`.
- RLS hiện tại đã có policy `email_templates_admin` với `FOR ALL` cho admin, nên DELETE được phép. Không cần thay đổi SQL.
- Không có bảng nào FK đến `email_templates` nên hard delete an toàn, không lo cascade.

**Frontend:**
- `useEmailTemplates.ts`: thêm `useDeleteEmailTemplateMutation()` dùng `useMutation`.
  - `mutationFn`: gọi delete theo `id`.
  - `onSuccess`: `qc.invalidateQueries({ queryKey: ['email_templates'] })`.
- `TemplateList.tsx`:
  - Thêm prop `onDelete: (template: Template) => void`.
  - Thêm nút "Xóa" màu đỏ (secondary style, border-red) bên cạnh nút "Chỉnh sửa", dùng icon `Trash2` từ `lucide-react`.
  - Chỉ hiển thị nút xóa khi `currentUserRole === 'admin'`.
- `EmailTemplatesPage.tsx`:
  - State `deletingTemplate: Template | null` để mở confirm modal.
  - Dùng `ConfirmationModal` sẵn có (hoặc `Modal` primitive + actions) để hiển thị: "Bạn có chắc muốn xóa mẫu **{name}**? Hành động này không thể hoàn tác."
  - Gọi `deleteMut.mutateAsync(deletingTemplate.id)` khi confirm.
  - Toast success/error qua `useToast`.
  - Đóng modal sau khi xong (thành công hoặc lỗi).

#### 5. UI/UX
- Nút "Xóa" style secondary danger: `border-red-400 text-red-600 hover:bg-red-50` (hoặc tương đương token `text-danger` / `border-danger`).
- Confirm modal: tiêu đề "Xóa mẫu email", nội dung hiển thị tên mẫu và template key, 2 nút "Hủy" / "Xóa".
- Nút "Xóa" trong modal primary danger.
- Loading state: disable nút "Xóa" trong modal khi mutation đang chạy.

#### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `src/hooks/queries/useEmailTemplates.ts` | Thêm `useDeleteEmailTemplateMutation()` |
| `src/components/email-templates/TemplateList.tsx` | Thêm prop `onDelete`, nút "Xóa", role guard |
| `src/pages/EmailTemplatesPage.tsx` | Thêm state confirm modal, gọi mutation, toast, render `ConfirmationModal` |

#### 7. Schema / SQL changes
Không cần. RLS policy `email_templates_admin` (FOR ALL) đã cho phép admin DELETE.

#### 8. API / Integration changes
Không cần.

#### 9. Test Plan
1. Đăng nhập với role admin → vào `/email-templates`.
2. Verify mỗi row có nút "Xóa".
3. Bấm "Xóa" trên 1 mẫu → confirm modal hiện đúng tên mẫu + template key.
4. Bấm "Hủy" → modal đóng, mẫu vẫn còn.
5. Bấm "Xóa" lại → confirm → mẫu biến mất khỏi danh sách, toast "Đã xóa mẫu email".
6. Refresh trang → mẫu không còn trong DB.
7. Đăng nhập với role operator → vào `/email-templates` → không thấy nút "Xóa".
8. Thử xóa mẫu default (nếu còn) → vẫn xóa được vì không có FK ràng buộc.
9. Chạy `npm run verify` → pass.
10. Chạy `npm run test` → pass.

#### 10. Rollout Plan
1. Sửa 3 files frontend theo plan.
2. Chạy `npm run verify`.
3. Test local với admin + operator.
4. Cập nhật `CHANGELOG.md`.
5. Deploy khi được yêu cầu (không tự deploy).

#### 11. Notes

- **Ưu điểm:**
  - Đơn giản, chỉ sửa 3 files frontend.
  - Không thay đổi schema, không cần migration.
  - Tận dụng RLS và TanStack Query sẵn có.

- **Nhược điểm:**
  - Hard delete không thể khôi phục.
  - Không có audit log riêng cho việc xóa mẫu.

- **Rủi ro & Mitigation:**

  | Rủi ro | Mitigation |
  |--------|------------|
  | Xóa nhầm mẫu đang dùng | Confirm modal hiển thị rõ tên + template key; nút Xóa chỉ ở admin |
  | Operator vẫn xóa được qua API | RLS policy `email_templates_admin` chặn DELETE non-admin ở DB level |
  | Mutation lỗi nhưng UI không cập nhật | Bắt lỗi `.catch()` và toast error; giữ modal mở để user biết |
  | UI chưa cập nhật sau xóa | `invalidateQueries(['email_templates'])` force refetch list |

---

---

## FEAT-029: Dashboard Full-Viewport Layout — M1 Transition Fill Remaining Height

- **Đề xuất**: 2026-06-15
- **Status**: `done`
- **Priority**: `medium`

#### 1. Mô tả feature
Chuyển Dashboard sang chế độ **cố định 1 viewport** (`100dvh`), các section phía trên tự co lại theo content, còn **M1 Transition** sẽ tự động chiếm toàn bộ chiều cao còn lại của trang, cách cạnh dưới browser một khoảng padding nhỏ.

#### 2. Motivation / Why
- Sau FEAT-028, M1 Transition đã chiếm full width nhưng vẫn bị giới hạn `max-h-[400px]`.
- Danh sách M1 có thể dài, user phải scroll bên trong một khung nhỏ hoặc scroll cả trang.
- Mục tiêu: M1 list luôn hiển thị gần full màn hình, giảm thao tác scroll, tận dụng tối đa không gian.

#### 3. Scope

**In scope:**
- `DashboardPage.tsx`: chuyển wrapper sang `h-[100dvh] overflow-hidden flex flex-col`.
- `DashboardPage.tsx`: các section phía trên (`PageHeader`, `DashboardStats`, `B2PendingAlert`, `B2EligibleList`) thêm `flex-shrink-0`.
- `DashboardPage.tsx`: M1 Transition wrapper thêm `flex-1 min-h-0` để chiếm chiều cao còn lại.
- `M1TransitionList.tsx`: card `h-full flex flex-col`.
- `M1TransitionList.tsx`: header + filter `flex-shrink-0`.
- `M1TransitionList.tsx`: list area thay `max-h-[400px]` bằng `flex-1 overflow-y-auto`.
- Cập nhật loading skeleton cho phù hợp layout mới.

**Out of scope:**
- Không thay đổi behavior của B2EligibleList / B2PendingAlert (chúng đã có `max-h-[320px]` sẵn).
- Không thay đổi filter logic, eligibility, buttons trong M1 Transition.
- Không thay đổi DashboardStats behavior.

#### 4. Technical Design

**Layout tổng thể DashboardPage:**
```tsx
<div className="h-[100dvh] overflow-hidden flex flex-col gap-6 p-6">
  <PageHeader title="Dashboard" className="flex-shrink-0" />
  <DashboardStats ... className="flex-shrink-0" />
  <B2PendingAlert ... className="flex-shrink-0" />
  <B2EligibleList ... className="flex-shrink-0" />
  <div className="flex-1 min-h-0 pb-6">
    <M1TransitionList ... />
  </div>
</div>
```

> Nếu muốn giữ khoảng cách dưới cùng, thêm `pb-6` vào wrapper hoặc margin-bottom vào M1 wrapper.

**M1TransitionList internal layout:**
```tsx
<div className="bg-white rounded-lg p-5 shadow-card h-full flex flex-col">
  {/* header + search: flex-shrink-0 */}
  <div className="flex ... mb-4 flex-shrink-0">...</div>
  {/* filter tabs: flex-shrink-0 */}
  <div className="flex flex-wrap ... mb-4 flex-shrink-0">...</div>
  {/* list: chiếm phần còn lại, scroll bên trong */}
  <div className="flex-1 overflow-y-auto space-y-3">
    ...
  </div>
</div>
```

**Xử lý mobile / dynamic viewport:**
- Dùng `h-[100dvh]` thay vì `h-screen` để tránh bị address bar của mobile browser che khuất.
- Fallback: nếu browser không hỗ trợ `dvh`, Tailwind v4 vẫn compile `100dvh` là valid CSS, browser sẽ tự fallback về auto nếu không hiểu. Nếu muốn an toàn hơn có thể dùng `h-screen h-[100dvh]`.

**Loading skeleton:**
- Thay vì skeleton dạng `space-y-3`, dùng layout flex tương tự để tránh nhấp nháy khi data load xong.

#### 5. UI/UX
- Dashboard không còn scroll ngoài, chỉ có scroll bên trong M1 list (và B2 sections nếu quá dài).
- M1 list luôn kéo dài gần đến cạnh dưới browser.
- Khoảng cách dưới cùng ~24px (`pb-6`) để không bị dính sát mép.

#### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `src/pages/DashboardPage.tsx` | Chuyển wrapper sang flex column full viewport; thêm `flex-shrink-0` cho các section trên; M1 wrapper `flex-1 min-h-0`; cập nhật skeleton |
| `src/components/dashboard/M1TransitionList.tsx` | Card `h-full flex flex-col`; header/filter `flex-shrink-0`; list area `flex-1 overflow-y-auto` |

#### 7. Schema / SQL changes
Không cần.

#### 8. API / Integration changes
Không cần.

#### 9. Test Plan
1. Mở Dashboard ở desktop → M1 Transition card kéo dài gần đến cạnh dưới browser, cách ~24px.
2. Thu nhỏ/nâng cao cửa sổ browser → M1 list tự điều chỉnh chiều cao theo viewport.
3. Mở trên mobile → layout không bị address bar che (dùng `100dvh`).
4. Scroll trong M1 list hoạt động mượt, không scroll cả trang.
5. B2EligibleList/B2PendingAlert vẫn hiển thị đúng, scroll riêng nếu quá dài.
6. Filter tabs + search trong M1 vẫn hoạt động.
7. Chạy `npm run build` → pass.
8. Chạy `npm run test` → 56/56 tests pass.

#### 10. Rollout Plan
1. Sửa `DashboardPage.tsx`.
2. Sửa `M1TransitionList.tsx`.
3. Chạy `npm run build` + `npm run test`.
4. Cập nhật `CHANGELOG.md`.
5. Cập nhật `PLAN-feature-dev.md` status FEAT-029 → `done`.
6. Deploy khi được yêu cầu.

#### 11. Notes

- **Ưu điểm:**
  - Tận dụng tối đa không gian màn hình cho M1 Transition.
  - Giảm thao tác scroll, tập trung vào section quan trọng nhất.
  - Layout dễ dự đoán, không phụ thuộc vào tổng chiều cao content phía trên.

- **Nhược điểm:**
  - Nếu viewport quá thấp (laptop 768px), các section phía trên có thể chiếm quá nhiều chỗ, M1 list bị ép nhỏ.
  - `100dvh` có thể không hoạt động hoàn hảo trên một số older browsers (IE11, old Safari).

- **Rủi ro & Mitigation:**

  | Rủi ro | Mitigation |
  |--------|------------|
  | M1 list bị ép quá nhỏ trên màn hình thấp | Đảm bảo B2EligibleList/B2PendingAlert đã có `max-h-[320px]`; nếu vẫn nhỏ, cân nhắc thêm `min-h-[200px]` cho M1 list |
  | Address bar mobile làm viewport nhảy | Dùng `100dvh` thay vì `100vh` |
  | Skeleton bị nhấp nháy khi layout thay đổi | Cập nhật skeleton cho giống layout mới |
  | CSS `dvh` không được hỗ trợ | Thêm fallback `h-screen` trước `h-[100dvh]` |

---

---

## FEAT-028: Dashboard M1 Transition Enhancement

- **Đề xuất**: 2026-06-15
- **Status**: `done`
- **Priority**: `medium`

#### 1. Mô tả feature
Cải tiến layout Dashboard và tăng khả năng lọc/thao tác trên card **M1 Transition**:
1. Ẩn card **"Trạng thái đề xuất"** (`StatusChart`) khỏi Dashboard.
2. Ẩn card **"Agent đang theo dõi"** (`BookmarkedAgentsCard`) khỏi Dashboard.
3. Mở rộng section **M1 Transition** ra toàn bộ chiều rộng (full width).
4. Thêm các bộ lọc trong M1 Transition:
   - **Tất cả**: hiển thị toàn bộ M1 đang transition.
   - **Đủ điều kiện**: các Agent đủ điều kiện chọn T1 mới.
   - **Không đủ điều kiện**: các Agent không đủ điều kiện chọn T1 mới.
   - **Đã gửi email**: các task đã phát sinh gửi email (`email_sent_count > 0`).
5. Highlight badge trạng thái gửi email để dễ nhìn.

#### 2. Motivation / Why
- Dashboard hiện tại có nhiều section, M1 Transition bị giới hạn 2/3 chiều rộng trong khi danh sách có thể dài.
- User cần lọc nhanh các M1 đã gửi email hoặc đủ/không đủ điều kiện để xử lý tập trung.
- Highlight email count giúp nhận biết nhanh task nào đã/chưa được nhắc.

#### 3. Scope

**In scope:**
- Ẩn `StatusChart` và `BookmarkedAgentsCard` trong `DashboardPage.tsx`.
- Chuyển layout M1 Transition từ `lg:col-span-2` sang full width.
- Thêm filter tabs trong `M1TransitionList.tsx`.
- Kết hợp search text + filter tab.
- Highlight badge email count (dùng màu info/primary thay vì neutral).

**Out of scope:**
- Không thay đổi logic eligibility (vẫn dùng `canCreateRequest` hiện tại).
- Không thêm API/RPC mới.
- Không thay đổi behavior của các nút "Tạo đề xuất", "Gửi email", "Ở lại với T2".
- Không hiển thị lý do cụ thể agent không đủ điều kiện (chỉ filter).

#### 4. Technical Design

**Filter state:**
```ts
type M1Filter = 'all' | 'eligible' | 'not-eligible' | 'emailed'
const [filter, setFilter] = useState<M1Filter>('all')
```

**Eligibility cho từng task:**
- Trong `DashboardPage.tsx`, tiền tính `eligibleMap: Map<string, boolean>` hoặc truyền xuống `M1TransitionList` hàm `canCreateRequest` đã có.
- Trong `M1TransitionList.tsx`, gọi `canCreateRequest(t.m1_agent)` để xác định đủ/không đủ điều kiện.

**Filter logic:**
```ts
const filtered = useMemo(() => {
  let result = q ? tasks.filter(...) : tasks
  switch (filter) {
    case 'eligible': result = result.filter(t => canCreateRequest(t.m1_agent)); break
    case 'not-eligible': result = result.filter(t => !canCreateRequest(t.m1_agent)); break
    case 'emailed': result = result.filter(t => t.email_sent_count > 0); break
    case 'all':
    default: break
  }
  return result
}, [tasks, q, filter, canCreateRequest])
```

**Layout DashboardPage:**
- Bỏ grid `lg:grid-cols-3` chứa M1 + Bookmarked.
- Render `<M1TransitionList ... />` ở full width dưới B2EligibleList.
- Bỏ `<BookmarkedAgentsCard />` và `<StatusChart />`.

**Highlight email count:**
- Thay badge "Đã gửi X lần" từ `text-neutral-500` sang `bg-info-light text-info` hoặc `bg-primary-light text-primary`.
- Giữ badge "Chưa gửi email" ở neutral.

#### 5. UI/UX
- Filter tabs nằm ngay dưới header M1 Transition, bên trái search box hoặc trên một hàng riêng trên mobile.
- Tab active: background primary, text white.
- Tab inactive: background white, border neutral, hover neutral-50.
- Badge count trên title M1 Transition hiển thị số task sau filter.
- Email count badge nổi bật hơn.

#### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `src/pages/DashboardPage.tsx` | Ẩn `StatusChart`, `BookmarkedAgentsCard`; mở rộng M1 Transition full width |
| `src/components/dashboard/M1TransitionList.tsx` | Thêm filter tabs, combine search + filter, highlight email badge |

#### 7. Schema / SQL changes
Không cần.

#### 8. API / Integration changes
Không cần.

#### 9. Test Plan
1. Vào Dashboard → verify không còn card "Trạng thái đề xuất" và "Agent đang theo dõi".
2. Verify M1 Transition chiếm toàn bộ chiều rộng.
3. Tab "Tất cả" hiển thị đúng số lượng M1 transition.
4. Tab "Đủ điều kiện" chỉ hiển thị agent có nút "Tạo đề xuất" enabled.
5. Tab "Không đủ điều kiện" chỉ hiển thị agent có nút "Tạo đề xuất" disabled.
6. Tab "Đã gửi email" chỉ hiển thị task có `email_sent_count > 0`.
7. Search box vẫn hoạt động kết hợp với filter tab.
8. Badge "Đã gửi X lần" có màu nổi bật.
9. Chạy `npm run verify` → pass.
10. Chạy `npm run test` → pass.

#### 10. Rollout Plan
1. Sửa `DashboardPage.tsx`.
2. Sửa `M1TransitionList.tsx`.
3. Chạy `npm run verify` + `npm run test`.
4. Cập nhật `CHANGELOG.md`.
5. Deploy khi được yêu cầu.

#### 11. Notes

- **Ưu điểm:**
  - Chỉ sửa 2 files frontend.
  - Không thay đổi schema hay API.
  - Tận dụng logic `canCreateRequest` sẵn có.

- **Nhược điểm:**
  - Filter eligibility chạy client-side, phụ thuộc vào `t1Changes` đã load.
  - `canCreateRequest` đang dùng `any` type, cần cẩn thận khi refactor.

- **Rủi ro & Mitigation:**

  | Rủi ro | Mitigation |
  |--------|------------|
  | `canCreateRequest` bị gọi lặp cho mỗi task khi filter | Dùng `useMemo` cache kết quả filter; số lượng task thường nhỏ |
  | `agent.rank_name` null nhưng `rank_id` có giá trị | Hàm `canCreateRequest` đã fallback về `rankMap` |
  | Filter "Đã gửi email" không cập nhật sau khi copy email | `email_sent_count` được cập nhật qua trigger DB + invalidate query |
  | Layout bị vỡ trên mobile | Test responsive, filter tabs wrap xuống dòng |

---

---

## FEAT-030: Google Apps Script Admin Panel — Drive Operations

- **Đề xuất**: 2026-06-26
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-26

#### 1. Mô tả feature
Tạo một tab admin riêng biệt trong app để tương tác với Google Drive thông qua **Google Apps Script Web App**. Tab chỉ dành cho role `admin`. Cung cấp nhiều form cố định cho các tác vụ Drive thường gặp: quét folder, thiết lập quyền, tạo/copy folder, liệt kê item, di chuyển, xóa quyền, xóa item.

#### 2. Motivation / Why
- Admin cần quản lý hàng loạt folder/file trên Google Drive theo dữ liệu agent trong app.
- Không muốn phụ thuộc vào ngôn ngữ lập trình cụ thể — Apps Script đóng vai trò abstraction layer, frontend chỉ cần gọi `action` name + `params`.
- Tập trung các thao tác Drive vào một giao diện duy nhất thay vì làm thủ công trên Google Drive.

#### 3. Scope

**In scope:**
- Tab admin mới, ví dụ `/admin/google-drive` hoặc `/admin/apps-script`.
- Admin-only: kiểm tra `user_profiles.role === 'admin'` ở cả UI và Edge Function.
- 8 tác vụ với form riêng:
  1. **Scan Folders** — quét recursive theo pattern tên.
  2. **Set Permissions** — thêm viewer/commenter/editor.
  3. **Create Folder** — tạo folder mới.
  4. **Copy Folder** — copy folder từ template.
  5. **List Items** — liệt kê file/folder trong một folder.
  6. **Move Item** — di chuyển file/folder.
  7. **Remove Permission** — xóa quyền của một user.
  8. **Delete Item** — move file/folder vào trash.
- Supabase Edge Function `google-apps-script-proxy` để gọi Apps Script an toàn.
- Google Apps Script `doPost` dispatcher theo `action`.
- Lưu log mỗi lần gọi action vào bảng `apps_script_logs`.

**Out of scope:**
- Không dùng Google Drive API trực tiếp (chỉ qua Apps Script abstraction).
- Không dùng OAuth user login (chỉ dùng Apps Script Web App URL).
- Không tích hợp Gmail/Sheets/Calendar trong FEAT này.
- Không có Google Drive Picker UI.
- Không chạy tự động định kỳ/cron — chỉ manual trigger từ UI admin.

#### 4. Technical Design

**4.1 Google Apps Script Web App**

Single `doPost(e)` dispatcher:

```javascript
function doPost(e) {
  const { action, params } = JSON.parse(e.postData.contents || '{}')
  const actions = {
    scanFolders,
    setPermissions,
    createFolder,
    copyFolder,
    listItems,
    moveItem,
    removePermission,
    deleteItem
  }

  if (!actions[action]) {
    return jsonResponse({ success: false, error: 'Unknown action: ' + action })
  }

  try {
    const result = actions[action](params)
    return jsonResponse({ success: true, data: result })
  } catch (err) {
    return jsonResponse({ success: false, error: err.message })
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
```

Các function con dùng `DriveApp`:

| Action | Function signature | Mô tả |
|---|---|---|
| `scanFolders` | `({ rootFolderId, depth, namePattern? })` | Duyệt recursive, trả về danh sách folder có tên khớp pattern. |
| `setPermissions` | `({ itemIds, emails, role })` | Thêm quyền viewer/commenter/editor cho danh sách email. |
| `createFolder` | `({ parentFolderId, name })` | Tạo folder con. |
| `copyFolder` | `({ sourceFolderId, destFolderId, newName })` | Copy toàn bộ folder (có thể cần recursive copy file). |
| `listItems` | `({ folderId, pageSize? })` | Liệt kê file/folder con. |
| `moveItem` | `({ itemId, destFolderId })` | Di chuyển file/folder. |
| `removePermission` | `({ itemId, email })` | Xóa quyền của một user. |
| `deleteItem` | `({ itemId })` | Move vào trash. |

**4.2 Supabase Edge Function `google-apps-script-proxy`**

File: `supabase/functions/google-apps-script-proxy/index.ts`

Flow:
1. Verify JWT token từ header.
2. Kiểm tra user role = `admin` (query `user_profiles`).
3. Validate `action` nằm trong allowlist.
4. Đọc secret `GAPPS_ADMIN_URL`.
5. Forward `{ action, params, initiatedBy: user.id }` đến Apps Script.
6. Insert log vào `apps_script_logs`.
7. Trả response về frontend.

```ts
const ALLOWED_ACTIONS = [
  'scanFolders', 'setPermissions', 'createFolder', 'copyFolder',
  'listItems', 'moveItem', 'removePermission', 'deleteItem'
]
```

**4.3 Frontend**

- New page: `src/pages/AppsScriptAdminPage.tsx`.
- Layout: sidebar bên trái chọn action, bên phải là form + results.
- Mỗi action có component form riêng trong `src/components/apps-script-admin/`:
  - `ScanFoldersForm.tsx`
  - `SetPermissionsForm.tsx`
  - `CreateFolderForm.tsx`
  - `CopyFolderForm.tsx`
  - `ListItemsForm.tsx`
  - `MoveItemForm.tsx`
  - `RemovePermissionForm.tsx`
  - `DeleteItemForm.tsx`
- Results hiển thị dạng table/card, có thể copy JSON.
- Settings panel chỉ read-only: hiển thị trạng thái kết nối Apps Script (ping qua `doGet`).

**4.4 Security**

| Layer | Biện pháp |
|---|---|
| UI | Route admin-only, menu chỉ hiện khi `role === 'admin'`. |
| Edge Function | Verify JWT + check admin role + action allowlist. |
| Apps Script URL | Giữ trong Supabase secrets, không đưa lên frontend. |
| Audit | Mọi action ghi log vào `apps_script_logs`. |
| Destructive actions | Confirmation modal trước khi thực hiện. |

**4.5 Pattern matching cho Scan Folders**

Hỗ trợ các kiểu pattern:
- `exact`: tên folder == `pattern`.
- `contains`: tên folder chứa `pattern`.
- `startsWith` / `endsWith`.
- `regex`: biểu thức chính quy.

Có thể tích hợp match với dữ liệu agent: ví dụ pattern `{{staff_id}}` để tìm folder trùng với `staff_id` của agent.

#### 5. UI/UX

- **Page header**: "Google Drive Admin" + badge "Admin only".
- **Sidebar tabs** (icon + label):
  - Scan Folders
  - Set Permissions
  - Create Folder
  - Copy Folder
  - List Items
  - Move Item
  - Remove Permission
  - Delete Item
- **Form pattern**: input rõ ràng, validation trước submit, loading state.
- **Results area**: table với cột id, name, type, url, owner, lastModified.
- **Confirmation modal** cho `moveItem`, `removePermission`, `deleteItem`.
- **Toast feedback**: success/error.

#### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `supabase/migrations/019_apps_script_logs.sql` | **Mới** — bảng log |
| `supabase/functions/google-apps-script-proxy/index.ts` | **Mới** — Edge Function proxy, gửi `authToken` nếu có env |
| `docs/FEAT-030-apps-script.gs` | **Mới** — code Google Apps Script Web App đầy đủ 8 tác vụ |
| `src/pages/AppsScriptAdminPage.tsx` | **Mới** — page chính |
| `src/components/apps-script/ScanFoldersForm.tsx` | **Mới** |
| `src/components/apps-script/SetPermissionsForm.tsx` | **Mới** |
| `src/components/apps-script/CreateFolderForm.tsx` | **Mới** |
| `src/components/apps-script/CopyFolderForm.tsx` | **Mới** |
| `src/components/apps-script/ListItemsForm.tsx` | **Mới** |
| `src/components/apps-script/MoveItemForm.tsx` | **Mới** |
| `src/components/apps-script/RemovePermissionForm.tsx` | **Mới** |
| `src/components/apps-script/DeleteItemForm.tsx` | **Mới** |
| `src/components/apps-script/utils.ts` | **Mới** — helper trích xuất Drive ID |
| `src/hooks/queries/useAppsScript.ts` | **Mới** — hook gọi Edge Function + log query |
| `src/types/index.ts` | Thêm types: `AppsScriptAction`, `AppsScriptLog`, các payload types |
| `src/App.tsx` | Thêm route `/admin/google-drive` |
| `src/components/Layout.tsx` | Thêm menu admin |
| `CHANGELOG.md` | Ghi nhận feature |
| `PROGRESS.md` | Cập nhật status FEAT-030 → done khi xong |

#### 7. Schema / SQL changes

```sql
CREATE TABLE IF NOT EXISTS public.apps_script_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  initiated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_script_logs_action ON public.apps_script_logs(action);
CREATE INDEX IF NOT EXISTS idx_apps_script_logs_created_at ON public.apps_script_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_apps_script_logs_initiated_by ON public.apps_script_logs(initiated_by);

ALTER TABLE public.apps_script_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apps_script_logs_admin_all" ON public.apps_script_logs;
CREATE POLICY "apps_script_logs_admin_all"
  ON public.apps_script_logs FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');
```

> ⚠️ Chạy thủ công trên Supabase SQL Editor.

#### 8. API / Integration changes

- **Google Apps Script Web App**: endpoint `doPost` + `doGet` (healthcheck), hỗ trợ 8 actions.
- **Supabase Edge Function**: `google-apps-script-proxy` — xác thực, allowlist, audit log.
- **Secret cần set**: `GAPPS_ADMIN_URL` trong Supabase Dashboard.

#### 9. Test Plan

1. **Access control:**
   - Admin đăng nhập → thấy menu "Google Drive Admin".
   - Operator/viewer đăng nhập → không thấy menu, truy cập trực tiếp URL bị redirect hoặc hiển thị forbidden.

2. **Scan Folders:**
   - Nhập root folder ID + depth + pattern.
   - Verify danh sách folder khớp hiển thị đúng.

3. **Set Permissions:**
   - Chọn 1-2 folder + nhập email + chọn role `editor`.
   - Verify trên Google Drive user được thêm quyền.
   - Verify `apps_script_logs` có record `success = true`.

4. **Create Folder:**
   - Nhập parent folder ID + name.
   - Verify folder xuất hiện trên Drive.

5. **Copy Folder:**
   - Chọn source folder + dest folder + new name.
   - Verify copy thành công.

6. **List Items:**
   - Nhập folder ID → hiển thị danh sách file/folder con.

7. **Move Item:**
   - Nhập item ID + dest folder ID.
   - Verify item chuyển folder, có confirmation modal.

8. **Remove Permission:**
   - Nhập item ID + email.
   - Verify user mất quyền.

9. **Delete Item:**
   - Nhập item ID.
   - Verify item vào trash, có confirmation modal.

10. **Error cases:**
    - JWT sai → 401.
    - Action không nằm trong allowlist → 400.
    - Apps Script URL sai → toast lỗi, `success = false`.
    - Folder ID không tồn tại → Apps Script trả lỗi rõ ràng.

11. **Build & test:**
    - `npm run verify` pass.
    - `npm run test` 56/56 pass.

#### 10. Rollout Plan

**Phase 1 — Apps Script setup**
1. Tạo Google Apps Script mới.
2. Viết 8 action functions + dispatcher.
3. Deploy Web App (Execute as: Me, Who has access: Anyone hoặc domain).
4. Copy Web App URL.

**Phase 2 — Backend**
1. Viết migration `019_apps_script_logs.sql`.
2. Viết Edge Function `google-apps-script-proxy/index.ts`.
3. Set secret `GAPPS_ADMIN_URL`.

**Phase 3 — Frontend**
1. Tạo page + components.
2. Thêm route và menu admin.
3. Viết hook `useAppsScriptAdmin`.
4. Thêm types.

**Phase 4 — Test**
1. Test từng action trên dev/staging.
2. Verify audit log.
3. Test access control với 3 roles.

**Phase 5 — Production (chỉ khi user yêu cầu)**
1. Deploy Edge Function.
2. Deploy frontend.
3. Cập nhật `CHANGELOG.md`, `PROGRESS.md`.

#### 11. Rollback Plan

| Tình huống | Hành động |
|---|---|
| Apps Script lỗi | Tắt menu/route admin tạm thờii, fix Apps Script, redeploy URL. |
| Edge Function lỗi | Redeploy version cũ hoặc tắt route admin. |
| Phân quyền sai | Dùng chính tab admin để remove permission hoặc restore từ Google Drive version history. |
| Audit log lỗi | Kiểm tra RLS policy, `get_my_role()` function. |

#### 12. Monitoring & Limits

- **Apps Script quota**: 20,000 lượt gọi/ngày, 6 phút execution time/gọi.
- **Monitor**: query `apps_script_logs` hàng ngày để đếm số action và tỷ lệ success/failed.
- **Limit scan depth**: max 3-5 để tránh timeout.
- **Batch size**: `setPermissions` nên giới hạn số folder IDs/email mỗi lần gọi (ví dụ max 50).

#### 13. Notes

- **Ưu điểm:**
  - Không cần Google Cloud project phức tạp.
  - Không cần OAuth user flow.
  - Dễ mở rộng thêm action mới: chỉ cần thêm function trong Apps Script + form component trong frontend.
  - Tất cả thao tác có audit log.

- **Nhược điểm:**
  - Phụ thuộc vào tài khoản Google deploy Apps Script.
  - Giới hạn quota và execution time của Apps Script.
  - Không có Drive Picker UI đẹp.

- **Rủi ro & Mitigation:**

  | Rủi ro | Mitigation |
  |--------|------------|
  | Apps Script URL bị lộ | Giấu trong Supabase secrets, gọi qua Edge Function |
  | Non-admin gọi được action | Edge Function verify JWT + check admin role |
  | Action vô tình xóa nhầm folder | Confirmation modal + audit log |
  | Scan folder quá lớn timeout | Giới hạn depth + pageSize |
  | Apps Script tài khoản cá nhân bị khóa | Dùng tài khoản dịch vụ chung của tổ chức |


