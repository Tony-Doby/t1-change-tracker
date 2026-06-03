# Plan Refactor Tổng Thể — T1 Change Tracker

> **Status**: `in_progress` — Phase 1, 2 & 3 đã hoàn thành. Phase 4 sẵn sàng bắt đầu.  
> **Tổng quan**: Dựa trên audit toàn bộ codebase (src + docs + schema). Chia thành 6 phase, ưu tiên từ critical → polish.

---

## 📊 Tổng kết vấn đề hiện tại

| Mức độ | Số lượng | Các nhóm vấn đề chính |
|--------|----------|----------------------|
| 🔴 Critical | 3 | Broken syntax, 0 test, RLS/API enforcement lỏng |
| 🟡 High | 8 | Page bloat, `any` nhiều, N+1 query, duplicate business rules, modal inconsistencies, TanStack Query chưa dùng |
| 🟢 Medium/Low | 6 | Dead CSS, unused table, XSS surface, hardcoded email, thiếu error boundary |

---

## Phase 1: Hotfixes & Safety (🔴 Critical — Làm ngay)

**Mục tiêu:** Fix lỗi crash và rủi ro bảo mật trước khi đụng vào architecture.

### 1.1 Fix `LoginPage.tsx` broken import ✅
- **File:** `src/pages/LoginPage.tsx`
- **Vấn đề:** Dòng 118 có `import { supabase } from '../lib/supabase'` nằm ở **cuối file** → syntax error runtime.
- **Fix:** Di chuyển import lên đầu file.
- **Status:** Done.

### 1.2 HtmlEditor XSS sanitization ✅
- **File:** `src/components/HtmlEditor.tsx`
- **Vấn đề:** `dangerouslySetInnerHTML` render nội dung user-generated không qua sanitize. Mặc dù app internal, risk vẫn tồn tại nếu template bị inject.
- **Fix:** Thêm `DOMPurify` (hoặc lightweight sanitizer) trước khi render preview + trước khi lưu DB.
- **Status:** Done. Đã cài `dompurify`, sanitize trong `handleEditorInput`/`exec`/`insertPlaceholder` trước `onChange`, và sanitize `getPreviewHtml()` trước `dangerouslySetInnerHTML`.

### 1.3 Add Root Error Boundary ✅
- **File:** `src/App.tsx`, `src/components/ErrorBoundary.tsx` (mới)
- **Vấn đề:** App crash ở bất kỳ page nào sẽ trắng toàn bộ.
- **Fix:** Wrap routes trong React Error Boundary có fallback UI (nút "Tải lại trang").
- **Status:** Done.

### 1.4 Cleanup dead code ✅
- **File:** `src/App.css`
- **Vấn đề:** Còn CSS starter từ Vite template (`.hero`, `.framework`, `.vite`, `#next-steps`) không dùng.
- **Fix:** Xóa toàn bộ dead CSS (file không được import ở đâu).
- **Status:** Done.

**Kết quả Phase 1:** App không còn crash point rõ ràng, giảm attack surface.

---

## Phase 2: Data Layer — Hoàn thiện TanStack Query (🟡 High) ✅

**Mục tiêu:** Dừng dùng `useState + useEffect` thủ công. Dùng cache, background refetch, invalidation.

### 2.1 Tạo custom query hooks ✅
- **Files mới/cập nhật:**
  - `src/hooks/queries/useAgents.ts` — `useAgentsQuery`, `useAgentDetailQuery`
  - `src/hooks/queries/useRequests.ts` — `useRequestsQuery`, `useRequestDetailQuery`
  - `src/hooks/queries/useDashboardStats.ts`, `useM1Transitions.ts`, `useB2Requests.ts`, `useStatusCounts.ts`
  - `src/hooks/queries/useTrash.ts` — `useTrashQuery`, `useRestoreTrashMutation`, `usePermanentDeleteTrashMutation`
  - `src/hooks/queries/useRanks.ts` — `useRanksMapQuery`, `useRanksListQuery`, `useSaveRankMutation`, `useDeleteRankMutation`
  - `src/hooks/queries/useDivisions.ts` — `useDivisionsMapQuery`, `useDivisionsListQuery`, `useSaveDivisionMutation`, `useDeleteDivisionMutation`, `useRecomputeDivisionsMutation`
  - `src/hooks/queries/useActivityLogs.ts`
  - `src/hooks/queries/useHolidays.ts`
  - `src/hooks/queries/useEmailTemplates.ts`
  - `src/hooks/queries/useNotifications.ts`

- **Pattern:** Mỗi query hook trả về `useQuery`. Mutation dùng `useMutation` + `queryClient.invalidateQueries()`.

### 2.2 Refactor pilot pages ✅
- **Files:** `src/pages/AgentsPage.tsx`, `src/pages/RequestsPage.tsx`
- **Thay đổi:**
  - Xóa `useState` cho `agents`, `loading`, `error`.
  - Dùng `useAgentsQuery({ search, filter, page })`.
  - Mutation (bookmark, tạo request) invalidate `['agents']`.
  - Giữ UI nguyên — chỉ đổi data layer.

### 2.3 Refactor các page còn lại ✅
- **Files đã refactor:** `DashboardPage`, `AgentDetailPage`, `RequestDetailPage`, `ActivityLogPage`, `TrashPage`, `HolidaysPage`, `RanksPage`, `DivisionsPage`, `EmailTemplatesPage`
- **Không refactor:** `UploadPage` (chỉ có form upload, không có data fetching)

### 2.4 Remove manual refresh patterns ✅
- Toàn bộ `setState` sau `supabase.from(...).insert/update/delete` đã được thay bằng `queryClient.invalidateQueries()` trong mutation hooks.
- Các page còn giữ `supabase` trực tiếp cho: validation trước delete (count agents thuộc rank/division), searchable dropdown (debounced agent search).

**Kết quả Phase 2:** Code ngắn gọn hơn 20-30%, tự động cache 5 phút, giảm N+1 do caching, mutations tự động invalidate.

---

## Phase 3: Page Decomposition — Tách Page bloat (🟡 High) ✅

**Mục tiêu:** Không page nào >250 dòng. Tách UI thành sub-components.

**Status:** Done — 2026-05-30

### 3.1 `DashboardPage.tsx` (544 → ~170 dòng) ✅
**Tách thành:**
- `src/components/dashboard/DashboardStats.tsx` — 4 stat cards
- `src/components/dashboard/StatusChart.tsx` — biểu đồ trạng thái
- `src/components/dashboard/B2PendingAlert.tsx` — B2 chờ phản hồi
- `src/components/dashboard/B2EligibleList.tsx` — B2 đủ điều kiện + search
- `src/components/dashboard/M1TransitionList.tsx` — M1 transition + search
- `src/components/dashboard/BookmarkedAgentsCard.tsx` — Bookmark nhanh

### 3.2 `AgentDetailPage.tsx` (280 → ~110 dòng) ✅
**Tách thành:**
- `src/components/agent-detail/AgentInfoTab.tsx` — Tab "Thông tin Agent"
- `src/components/agent-detail/AgentHistoryTab.tsx` — Tab "Lịch sử" với sub-tabs
- `src/components/agent-detail/T1History.tsx` — Lịch sử đổi T1
- `src/components/agent-detail/M1List.tsx` — Danh sách M1
- `src/components/agent-detail/AsT1History.tsx` — Lịch sử làm T1 của agent khác
- `src/components/agent-detail/DeactivationHistory.tsx` — Lịch sử chấm dứt

### 3.3 `RequestDetailPage.tsx` (402 → ~170 dòng) ✅
**Tách thành:**
- `src/components/request-detail/RequestInfoCard.tsx` — Card thông tin agent + T1
- `src/components/request-detail/RequestProgress.tsx` — Progress bar B1→B2→B3
- `src/components/request-detail/DeadlineInfo.tsx` — Hiển thị deadline B2/B3
- `src/components/request-detail/RequestComments.tsx` — Thread comment
- `src/components/request-detail/StepHistory.tsx` — Lịch sử chuyển bước
- `src/components/request-detail/NotificationChecklist.tsx` — Checklist thông báo

### 3.4 `EmailTemplatesPage.tsx` (237 → ~80 dòng) ✅
**Tách thành:**
- `src/components/email-templates/TemplateList.tsx`
- `src/components/email-templates/TemplateEditModal.tsx`
- `src/components/email-templates/TemplatePreviewModal.tsx`

**Kết quả Phase 3:** Pages chỉ còn là "layout composer", mỗi component <100 dòng, dễ test và reuse.

---

## Phase 4: Backend-Frontend Alignment & Performance (🟡 High) ✅

**Status:** Done — 2026-05-30

**Mục tiêu:** Loại bỏ duplicate logic, fix N+1, unify T1 field.

### 4.1 Consolidate Eligibility Logic ✅
- Thêm `checkEligibilityRpc()` trong `src/lib/eligibility.ts` — gọi RPC `check_eligibility` (single source of truth).
- `CreateRequestModal` đã chuyển sang dùng `checkEligibilityRpc` thay vì client-side `checkEligibility`.
- `getAgentT1` chỉ còn trả về `current_t1_id`.
- Giữ `checkCanChooseNewT1` cho M1 impact preview (offline calc).

### 4.2 Fix N+1 Queries ✅
- `useAgents.ts`: Dùng Supabase FK embedding `agents:current_t1_id(full_name, staff_id)` thay vì batch query T1 riêng.
- `useDashboardStats.ts`: Chuyển sang dùng RPC `get_dashboard_stats()` — giảm 4 queries xuống 1 query.
- `ExportModal` giữ pattern `fetchData` nhưng batch query đã chuẩn hóa chỉ dùng `current_t1_id`.

### 4.3 Resolve Dual T1 Fields ✅
- Frontend chỉ dùng **`current_t1_id`**. Đã xóa toàn bộ update `referrer_id` từ frontend:
  - `src/lib/request-actions.ts` (completeRequestAction)
  - `src/lib/agent-actions.ts` (deactivateAgent, restoreAgent)
  - `src/pages/DashboardPage.tsx` (applyT2)
- Audit toàn bộ codebase: `AgentsPage`, `AgentDetailPage`, `AgentInfoTab`, `CreateRequestModal`, `ComposeTemplateModal`, `DeactivateAgentModal`, `RestoreAgentModal`, `UploadPage`, `useAgents`, `useAgentDetail`.
- `types/index.ts`: Thêm comment rõ ràng về dual field — "Dùng `current_t1_id`, `referrer_id` tự sync qua trigger".

### 4.4 Unify Modal Pattern ✅
- Thêm prop `size?: 'sm' | 'md' | 'lg' | 'xl'` vào `<Modal>` component.
- Refactor 6 modal sang dùng `<Modal>` chuẩn:
  - `CreateRequestModal`
  - `ExportModal`
  - `ComposeTemplateModal`
  - `SendEmailModal`
  - `DeactivateAgentModal`
  - `RestoreAgentModal`

### 4.5 M1 Transition — Từ Lazy sang Proactive ✅
- Viết migration `016_phase4_rpc_and_cron.sql`:
  - RPC `get_dashboard_stats()` trả về 4 counts trong 1 call.
  - Cron job `m1_transition_daily_cleanup` chạy `process_expired_m1_transitions()` mỗi ngày lúc 00:05 (dùng `pg_cron`).
- Dashboard vẫn gọi `process_expired_m1_transitions` khi mount để cập nhật UI realtime.

**Kết quả Phase 4:** Data consistent, performance cải thiện, modal pattern thống nhất.

---

## Phase 5: Testing & Type Safety (🟢 Medium — Cần nhưng không gấp)

### 5.1 Add Vitest + React Testing Library
- **Files mới:**
  - `vitest.config.ts`
  - `src/lib/eligibility.test.ts` — Test toàn bộ eligibility rules
  - `src/lib/date-utils.test.ts` — Test business-day arithmetic
  - `src/components/__tests__/Modal.test.tsx` — Test focus trap, Escape, portal
  - `src/hooks/__tests__/useDebounce.test.ts`
- **Cài đặt:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

### 5.2 Stricter TypeScript
- **Bật lại** (nếu đang tắt hoặc bỏ qua):
  - `noImplicitAny: true`
  - `strictNullChecks: true`
- **Audit** toàn bộ `any` trong pages → thay bằng proper types từ `types/index.ts`.
- **Ưu tiên:** `request-actions.ts`, `agent-actions.ts`, `eligibility.ts`.

### 5.3 Add Component/Integration Tests (sau khi Phase 2 & 3 xong)
- Test `AgentsPage` + `useAgentsQuery`: search, pagination, filter.
- Test `CreateRequestModal`: eligibility check, M1 impact display.

**Kết quả Phase 5:** Regression safety net, types đáng tin cậy.

---

## Phase 6: Polish & Cleanup (🟢 Low — Làm cuối)

### 6.1 Bookmarks: LocalStorage → DB hoặc xóa table
- **Vấn đề:** `user_bookmarks` table tồn tại nhưng app dùng `localStorage`.
- **Quyết định:**
  - Nếu cần cross-device: migrate localStorage → `user_bookmarks` table.
  - Nếu không: drop table `user_bookmarks` cho gọn schema.

### 6.2 Remove hardcoded defaults
- `LoginPage`: xóa `admin@era.vn` default, để trống.
- `ComposeTemplateModal`: đảm bảo không còn hardcoded T1 name/email (đã fix trong BUG-005, cần verify).

### 6.3 Print CSS verify
- Kiểm tra `@media print` trong `index.css` có ẩn đủ sidebar, header, nav, buttons.
- Test in trên 2-3 page chính (Agent Detail, Request Detail).

### 6.4 Code organization
- Chuyển các file trong `src/lib/` có side-effect (insert DB) sang `src/services/` hoặc `src/api/` để phân biệt pure utilities vs data mutations.
- Ví dụ: `request-actions.ts`, `agent-actions.ts`, `notifications.ts` → `src/services/`.

**Kết quả Phase 6:** Codebase sạch, professional, dễ onboard.

---

## 📅 Đề xuất timeline

| Phase | Thờigian ước tính | Điều kiện bắt đầu |
|-------|-------------------|-------------------|
| Phase 1: Hotfixes | 0.5 ngày | Approve plan |
| Phase 2: TanStack Query | 2-3 ngày | Phase 1 xong |
| Phase 3: Page Decomposition | 2-3 ngày | Phase 2 xong 2 pilot pages |
| Phase 4: Backend Alignment | 2 ngày | Phase 3 xong |
| Phase 5: Testing | 2 ngày | Phase 4 xong |
| Phase 6: Polish | 1 ngày | Phase 5 xong |
| **Tổng** | **~10 ngày** | Làm tuần tự, không parallel |

---

## ⚠️ Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Regression khi refactor pages lớn | Làm từng page, test kỹ trước khi chuyển page tiếp theo. Có Vitest sau Phase 5. |
| TanStack Query cache stale | Dùng `staleTime` hợp lý + invalidate đúng queryKey sau mutation. |
| RPC eligibility diverge khỏi frontend | Ghi rõ comment "Source of truth = RPC" ở cả 2 nơi. Review đồng bộ khi business rule đổi. |
| Modal refactor break UX | Test từng modal: backdrop click, Escape, focus trap, scroll lock. |

---

## ✅ Checklist trước khi bắt đầu từng phase

- [ ] User approve plan tổng thể
- [ ] User chọn Phase bắt đầu (khuyến nghị Phase 1)
- [ ] Backup branch: `git checkout -b refactor/phase-X`
- [ ] Đọc lại `AGENTS.md` section 3 (không tự ý code, không tự ý deploy)

---

*Lập plan: 2026-05-30*  
*Dựa trên audit codebase + docs: AGENTS.md, KNOWLEDGE.md, CHANGELOG.md, PLAN-feature-dev.md, PLAN-bug-fixes.md*
