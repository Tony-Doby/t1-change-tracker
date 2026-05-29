# Changelog - T1 Change Tracker

> File này dùng để tracking toàn bộ thay đổi/fix trong project.  
> Mỗi lần sửa code phải ghi vào đây để AI/agent sau có thể đọc lại context.

---

## 2026-05-29

### 10. FEAT-009 + FEAT-010 + FEAT-011 + FEAT-012: Dashboard navigation, Requests multi-filter, Ranks/Divisions modal CRUD

**Tính năng:**

1. **FEAT-009 — Dashboard navigation:**
   - 4 stat cards (Tổng Agent, Tổng Requests, Đang xử lý, Hoàn tất) thêm `onClick` navigate sang `/agents` hoặc `/requests?status=...`.
   - Chart "Trạng thái đề xuất": click từng bar navigate `/requests?status=xxx`.
   - Style hover cho cards và chart rows.

2. **FEAT-010 — Requests multi-choice status filter:**
   - Đổi `statusFilter` từ single-select → `RequestStatus[]` (multi-choice).
   - Click status button → toggle chọn/bỏ chọn.
   - "Tất cả" button → clear filter.
   - Đồng bộ URL query param `?status=step1,step2` khi filter thay đổi.
   - `RequestsPage` đọc `status` param từ URL để set initial filter.

3. **FEAT-011 — Ranks modal CRUD:**
   - Bỏ inline form footer.
   - Thêm/Sửa mở popup `Modal` component.
   - Giữ nguyên fields: Tên, Loại, Thứ tự.

4. **FEAT-012 — Divisions modal CRUD + table height:**
   - Bỏ inline form footer.
   - Thêm/Sửa mở popup `Modal` component (giữ searchable dropdown head agent).
   - Bỏ `max-h-[400px]` trên bảng → chiều cao tự nhiên như RanksPage.

**Fix nhỏ đi kèm:**
- `Modal.tsx`: Thêm `createPortal` render ra `document.body` để tránh stacking context issue với `PageTransition`.

**Files sửa:**
- `webapp/src/components/Modal.tsx` — createPortal
- `webapp/src/pages/DashboardPage.tsx` — stat cards + chart navigation
- `webapp/src/pages/RequestsPage.tsx` — multi-choice filter + URL sync
- `webapp/src/pages/RanksPage.tsx` — modal CRUD
- `webapp/src/pages/DivisionsPage.tsx` — modal CRUD + table height
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật status 4 feature
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### Docs Cleanup: Archive `PLAN-ui-improvements.md`

**Lý do:** File `PLAN-ui-improvements.md` đã hoàn thành toàn bộ 4 phases (Foundation, Critical Fixes, Loading/Animation Polish, Advanced UI). Các cải tiến đã được triển khai và ghi nhận trong mục **"UI Improvements — Phase 1-4"** ở trên. Để tránh confuse cho AI/agent sau, nội dung plan gốc đã được merge vào CHANGELOG.md và file plan đã xóa.

**Nội dung plan gốc (tóm tắt):**
- **Phase 1:** Design tokens (CSS variables), `@layer components`, `Skeleton`, `Badge`, `EmptyState`, `Pagination`, `Modal`, `PageTransition`, `SearchDropdown`, hooks `useDebounce`/`useFocusTrap`.
- **Phase 2:** Fix pagination overflow, table `overflow-x-auto`, max-width container, responsive padding.
- **Phase 3:** Skeleton loading cho tất cả pages, EmptyState, page transitions, modal animations, debounce search, login polish, aria labels, table row hover.
- **Phase 4:** Command Palette (Ctrl+K), Notification Dropdown, `SearchDropdown` refactor, print CSS.

**Files xóa:**
- `webapp/docs/PLAN-ui-improvements.md`

**Files sửa:**
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 9. Fix BUG-007: M1 Transition UI cải tiến

**Vấn đề:** Dashboard M1 Transition UI chưa tối ưu: hiển thị "T2 tạm" sai, thiếu Staff ID của T1 tạm, chưa có quick actions, tên M1 chưa clickable.

**Giải pháp:**
- Đổi text "T2 tạm" → "T1 tạm", hiển thị format `tên (staff_id)`.
- Tên M1 bọc trong `<Link>` → chuyển `/agents/:id`.
- Thêm 3 quick buttons: Tạo email mẫu (disabled nếu không eligible), Tạo đề xuất, Ở lại với T2 (countdown 10s).
- Query thêm `contract_signing_date`, `rank_name` của m1_agent và `t1_changes` để check eligibility.

**Files sửa:**
- `webapp/src/pages/DashboardPage.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 8. Fix BUG-006: Modal bị cắt trong container do PageTransition transform

**Vấn đề:** Modal `ComposeTemplateModal` bị giới hạn bên trong khung content, không overlay toàn màn hình. Nguyên nhân là `PageTransition` dùng CSS animation `fade-in` có `transform: translateY()`, tạo stacking context mới → `position: fixed` của modal bị "trapped".

**Giải pháp:** Dùng `createPortal` từ `react-dom` để render modal ra `document.body`, hoàn toàn thoát khỏi DOM tree và stacking context của `PageTransition` / `Layout`.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 7. Fix BUG-005: Hardcoded T1 mới trong email, thiếu newT1StaffId

**Vấn đề:** `ComposeTemplateModal` hardcoded T1 mới là `'Lê Thị D'` / `'ltd@era.com'` cho mọi agent. Thực tế T1 mới phải lấy từ `t1_requests.proposed_new_t1_id` (request active). Thiếu placeholder `{{newT1StaffId}}`.

**Giải pháp:**
- Query `t1_requests` tìm request active mới nhất của agent → lấy `proposed_new_t1_id`.
- Query `agents` lấy `full_name`, `staff_id`, `email` của T1 dự kiến.
- Replace `{{newT1Name}}`, `{{newT1Email}}`, `{{newT1StaffId}}` từ dữ liệu thực thay vì hardcoded.
- Thêm `{{newT1StaffId}}` vào `EmailTemplatesPage` placeholders + preview.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/src/pages/EmailTemplatesPage.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 6. Fix BUG-004: Modal soạn mẫu bị đẩy lên trên, mất nút X

**Vấn đề:** Modal `ComposeTemplateModal` bị đẩy sát header app, phần header của modal (tiêu đề + nút X) bị ẩn khỏi viewport khi nội dung dài.

**Giải pháp:**
- Wrapper: thêm `overflow-y-auto` để cuộn an toàn khi modal cao hơn viewport.
- Inner modal: bỏ `max-h-[90vh] overflow-y-auto`, thay bằng `my-auto` để tự căn giữa không bị cắt header.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 5. Fix BUG-003: Soạn mẫu email không lấy nội dung từ DB

**Vấn đề:** `ComposeTemplateModal` dùng mảng templates hardcoded trong code, không query từ DB. Khi admin sửa template trong `EmailTemplatesPage` và lưu, modal soạn thư vẫn hiển thị nội dung cũ.

**Giải pháp:**
- Thêm `loadTemplates()` query `email_templates` từ Supabase khi modal mount.
- Merge DB templates với `defaultTemplates` (DB override theo `template_key`).
- Giữ hardcoded làm fallback nếu DB chưa có data.
- Thêm `else { setT1Old(null) }` để tránh giữ T1 cũ khi chuyển sang agent không có T1.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### UI Improvements — Phase 1-4 (Foundation, Critical Fixes, Polish, Advanced)

**Mục tiêu:** Cải tiến UI/UX toàn diện dựa trên patterns từ `freelancer-workspace` (ThompBui SaaS dashboard).

#### Phase 1: Foundation
- **CSS Design Tokens:** Chuyển sang CSS variables làm design tokens, thêm animation keyframes (`fade-in`, `fade-in-scale`, `skeleton-pulse`).
- **Shared Components (mới):**
  - `Skeleton` — Block, Text, Card, Table shimmer loading states
  - `Badge` — 5 variants: primary/success/warning/danger/neutral
  - `EmptyState` — Icon 48px + title + subtitle + optional CTA
  - `Pagination` — Smart ellipsis `[1] ... [5] [6] **7** [8] [9] ... [255]`
  - `Modal` — Backdrop blur, scale+fade animation, focus trap, Escape đóng
  - `PageTransition` — Fade-in wrapper cho mỗi page route
- **Hooks (mới):**
  - `useDebounce` — Debounce value với delay tùy chỉnh
  - `useFocusTrap` — Trap focus trong modal (Tab vòng lặp)

#### Phase 2: Critical Fixes (P0)
- **Pagination overflow fix:** `AgentsPage` thay 255 nút page inline bằng `Pagination` component (max 7 visible buttons + ellipsis).
- **Table scroll mobile:** Thêm `overflow-x-auto` wrapper + `min-w` cho tất cả tables: Agents, Requests, AgentDetail (M1), Trash, Holidays.
- **Max-width container:** `Layout.tsx` thêm `max-w-7xl mx-auto` cho Main Content, giảm stretch trên màn hình lớn.
- **Responsive padding:** Main content padding thay đổi theo breakpoint `p-4 sm:p-6 lg:p-8`.

#### Phase 3: Loading, Empty & Animation Polish
- **Skeleton loading:** Thay spinner/text "Đang tải..." bằng `Skeleton` components trên Dashboard (stat cards + content cards), AgentsPage (5 table rows), RequestsPage, AgentDetailPage, RequestDetailPage.
- **Empty States:** Thay text đơn điệu "Không có dữ liệu" bằng `EmptyState` component (icon + title + subtitle) trên Agents, Requests, AgentDetail (M1, T1 history, as T1), ActivityLog, Trash, Holidays, Dashboard (bookmarks + transitions).
- **Page Transitions:** `App.tsx` wrap tất cả pages với `PageTransition` → fade-in 350ms mỗi lần chuyển trang.
- **Modal animations:** `Modal` component mới dùng scale 95% + fade 150ms, focus trap, Escape đóng.
- **Debounce search:** `RequestsPage` và `ActivityLogPage` dùng `useDebounce` 300ms cho search input.
- **Login polish:** `LoginPage` thêm toggle show/hide password (Eye/EyeOff icon), `autoComplete="email"` và `autoComplete="current-password"`.
- **Aria labels:** Thêm `aria-label` cho Menu, Notifications, User menu, bookmark star, delete holiday.
- **Table row hover:** Thêm `transition-colors duration-100` cho tất cả table rows.

#### Phase 4: Advanced UI
- **Command Palette (Ctrl+K):** Component mới `CommandPalette` — global search:
  - Tìm agent theo tên/mã (server-side, limit 5)
  - Tìm request theo mã/agent (server-side, limit 5)
  - Navigation nhanh đến tất cả pages
  - Keyboard nav: ↑↓ chọn, Enter mở, Escape đóng
  - Header thêm nút "Tìm kiếm [Ctrl K]" trigger
- **Notification Dropdown:** Component mới `NotificationDropdown`:
  - Query 20 activity_logs gần nhất
  - Badge đỏ hiển thị số chưa đọc
  - Mark all read / mark individual read (lưu localStorage)
  - Link đến request detail / activity log
- **Print CSS:** `@media print` ẩn sidebar, header, nav, buttons — chỉ hiển thị nội dung chính.

**Files sửa/tạo:**
- `webapp/src/index.css` — Design tokens, animations, print CSS
- `webapp/src/components/Skeleton.tsx` — Mới
- `webapp/src/components/Badge.tsx` — Mới
- `webapp/src/components/EmptyState.tsx` — Mới
- `webapp/src/components/Pagination.tsx` — Mới
- `webapp/src/components/Modal.tsx` — Mới
- `webapp/src/components/PageTransition.tsx` — Mới
- `webapp/src/components/CommandPalette.tsx` — Mới
- `webapp/src/components/NotificationDropdown.tsx` — Mới
- `webapp/src/hooks/useDebounce.ts` — Mới
- `webapp/src/hooks/useFocusTrap.ts` — Mới
- `webapp/src/App.tsx` — PageTransition wrap
- `webapp/src/components/Layout.tsx` — max-width, aria labels, CommandPalette, NotificationDropdown
- `webapp/src/pages/LoginPage.tsx` — Toggle password, autoComplete
- `webapp/src/pages/AgentsPage.tsx` — Pagination component, SkeletonTable, EmptyState, overflow-x-auto
- `webapp/src/pages/RequestsPage.tsx` — Debounce, SkeletonTable, EmptyState, overflow-x-auto
- `webapp/src/pages/AgentDetailPage.tsx` — Skeleton, EmptyState, overflow-x-auto
- `webapp/src/pages/RequestDetailPage.tsx` — Skeleton loading
- `webapp/src/pages/ActivityLogPage.tsx` — Debounce, EmptyState
- `webapp/src/pages/TrashPage.tsx` — EmptyState
- `webapp/src/pages/HolidaysPage.tsx` — EmptyState, overflow-x-auto, aria-label
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 4. Fix BUG-002: Agent không tìm thấy do Supabase `max-rows` limit

**Vấn đề:** Agent Lê Vạn Lý - LL60640 có trong DB nhưng không tìm thấy khi search trong AgentsPage. Supabase REST API mặc định giới hạn 1000 rows, query không có `.limit()` chỉ trả về ~1000 agents mới nhất. Search client-side chỉ tìm trên subset → agents cũ bị "mất".

**Giải pháp (theo plan BUG-002):**
- Chuyển search + pagination sang **server-side**:
  - Search dùng `.or('full_name.ilike...staff_id.ilike...')` gọi trực tiếp Supabase.
  - Pagination dùng `.range(from, to)` server-side.
  - Count dùng `.select('*', { count: 'exact', head: true })`.
- Search input debounce 300ms.
- T1 info chỉ query cho 10 rows hiển thị (current page) thay vì toàn bộ.
- Tạm ẩn các quick filter presets phức tạp (`near_91d`, `near_180d`, `quota_exceeded`) — cần eligibility engine server-side (Bước 2 plan).
- ExportModal: thêm prop `fetchData` để loop query toàn bộ records (batch 1000 rows) khi export, bypass max-rows limit.

**Files sửa:**
- `webapp/src/pages/AgentsPage.tsx` — Refactor load/search/filter/pagination sang server-side
- `webapp/src/components/ExportModal.tsx` — Thêm `fetchData` prop để export toàn bộ không bị giới hạn pagination
- `webapp/docs/PLAN-bug-fixes.md` — Cập nhật status `fixed`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-27

### 3. Fix M1 không được chuyển khi agent không có T1 cũ (old_t1_id = null)

**Vấn đề:** Request #f7e77204 — Trần Vĩnh Phi Long (LT36739) có 191 M1, chuyển sang T1 mới, nhưng `old_t1_id = null` trong `t1_requests`. `completeRequestAction` wrap toàn bộ xử lý M1 trong `if (request.old_t1_id)` → block bị skip → 191 M1 vẫn kẹt dưới line cũ, không có transition task nào được tạo.

**Business rule đã xác nhận:** Agent có thể không có T1. Khi chuyển đi, M1 không có T2 tạm nhưng vẫn được xử lý 30 ngày + eligibility. Lựa chọn của M1: không có T1 hoặc chọn T1 mới.

**Giải pháp:**
- Tách logic query M1 + tạo transition tasks + update M1s ra khỏi `if (request.old_t1_id)`.
- `m1_transition_tasks.temp_t1_id` → nullable (`string | null`). Khi `old_t1_id = null`, task được tạo với `temp_t1_id = null`.
- Update M1s `current_t1_id = request.old_t1_id` → `null` khi agent không có T1 cũ.
- Dashboard hiển thị "Không có T1 tạm" khi `temp_t1_id = null`.

**Files sửa:**
- `webapp/supabase/migrations/004_fix_m1_null_temp_t1.sql` — `ALTER TABLE DROP NOT NULL` cho `temp_t1_id`
- `webapp/src/types/index.ts` — `temp_t1_id: string | null`
- `webapp/src/lib/request-actions.ts` — Tách M1 logic khỏi `if (old_t1_id)`
- `webapp/src/pages/DashboardPage.tsx` — UI xử lý `temp_t1_id = null`, `applyT2` set `current_t1_id = null`
- `webapp/docs/CHANGELOG.md` — File này

**Lưu ý triển khai:** Schema local đã sửa nhưng DB production cần chạy thủ công trong Supabase SQL Editor:
```sql
ALTER TABLE public.m1_transition_tasks ALTER COLUMN temp_t1_id DROP NOT NULL;
```

---

## 2026-05-27

### 2. Fix lỗi hoàn tất request khi agent không có T1 cũ + ẩn B4/B5

**Vấn đề 1:** Khi bấm "Đồng ý" hoàn tất đổi T1 cho agent **không có T1 cũ** (`old_t1_id = null`), `completeRequestAction` cố insert `m1_transition_tasks` với `temp_t1_id: null` → lỗi `violates not-null constraint`. Vì lỗi xảy ra ở bước cuối (sau khi đã update request + insert t1_changes + update agent), log báo thành công nhưng thực ra chưa hoàn tất. Bấm lại tạo duplicate `t1_changes` và `activity_logs`.

**Giải pháp:**
- Thêm **guard check** `status === 'completed'` ở đầu `completeRequestAction` → tránh bấm lại tạo duplicate
- Nếu `old_t1_id = null` → **bỏ qua** hoàn toàn bước tạo `m1_transition_tasks` và move M1s (vì không có T2 tạm)
- Đưa bước move M1s vào chung `if (request.old_t1_id)`

**Vấn đề 2:** Dashboard và Requests List vẫn hiển thị **B4, B5** trong chart và Kanban cards (đã không còn trong workflow 3 bước).

**Giải pháp:**
- `DashboardPage.tsx`: Chart "Trạng thái đề xuất" từ 7 cột → 5 cột (B1, B2, B3, Hoàn tất, Đã hủy)
- `RequestsPage.tsx`: Kanban summary từ 7 cards → 5 cards

**Files sửa:**
- `webapp/src/lib/request-actions.ts` — Fix null `temp_t1_id` + guard duplicate
- `webapp/src/pages/DashboardPage.tsx` — Ẩn B4/B5 khỏi chart
- `webapp/src/pages/RequestsPage.tsx` — Ẩn B4/B5 khỏi Kanban cards
- `webapp/docs/CHANGELOG.md` — File này

---

### 1. Rút gọn quy trình Request từ 5 bước → 3 bước (B1→B2→B3)

**Vấn đề:** Request Detail Page đang hiển thị quy trình cũ 5 bước (B1→B2→B3→B4→B5), không đúng với workflow thực tế đã thống nhất. Quy trình thực tế chỉ có 3 bước: B1 (tạo đề xuất) → B2 (T1 mới xác nhận, nhập ngày) → B3 (điểm quyết định sau 3 ngày làm việc).

**Giải pháp:**
- Progress bar: 5 bước → 3 bước (B1, B2, B3)
- B3 là "điểm quyết định" với 2 nút: `Đồng ý` và `Hủy đề xuất`
- `Đồng ý`: bị **khóa** trong 3 ngày làm việc đầu (agent có quyền đổi ý). Hiển thị countdown `Đồng ý (X ngày)`. Mở khóa khi đủ ngày.
- `Hủy`: **luôn hiện** ngay từ sau B2 (agent có thể đổi ý & hủy bất cứ lúc nào)
- Cả 2 nút đều dùng **CountdownConfirmModal 10 giây**
- Thêm card hiển thị deadline: ngày xác nhận B2 + ngày hết hạn 3 ngày LV + trạng thái chờ
- Xóa logic advance B3→B4→B5, xóa modal inline cũ
- Xử lý backward-compatible cho request legacy đang ở step3/4/5 (map vào B3)

**Files sửa:**
- `webapp/src/pages/RequestDetailPage.tsx` — Refactor toàn bộ UI/UX + logic 3 bước
- `webapp/docs/PLAN-t1-change-tracker.md` — Cập nhật quy trình 3 bước
- `webapp/docs/PROGRESS.md` — Cập nhật mô tả Phase 4
- `webapp/docs/UI-DESIGN.md` — Cập nhật mockup Request Detail (3 bước, B3 decision)
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-26

### 1. Sửa điều kiện eligibility cấp bậc

**Vấn đề:** Điều kiện cấp bậc đang yêu cầu `>= CS/Cấp 1` (dùng whitelist 15 rank). Thực tế business rule chỉ cần **không phải ASC** là đủ điều kiện.

**Giải pháp:**
- Frontend (`eligibility.ts`): Đổi `isCSOrAbove()` → `isNotASC()`; message đổi thành `(không được là ASC)`
- Backend (SQL RPC `check_eligibility`): Bỏ `v_cs_ranks`, dùng `LOWER(rank_name) != 'asc'`

**Files sửa:**
- `webapp/src/lib/eligibility.ts`
- `webapp/supabase/migrations/001_initial_schema.sql`
- `webapp/docs/PROGRESS.md`

---

### 2. Gộp agent_code vào staff_id

**Vấn đề:** Mã NV (`staff_id`) và Mã Agent (`agent_code`) trong thực tế là một. Có mâu thuẫn giữa thiết kế (PLAN nói `staff_id` là unique key) và code (upsert lại dùng `agent_code` làm onConflict).

**Giải pháp:** Xóa hoàn toàn trường `agent_code`, giữ `staff_id` làm unique key cho upsert.

**Files sửa:**
- `webapp/supabase/migrations/001_initial_schema.sql` — Xóa cột `agent_code`
- `webapp/src/types/index.ts` — Xóa `agent_code` khỏi `Agent` interface
- `webapp/src/pages/UploadPage.tsx` — Expected headers, validate, upsert logic đổi sang `staff_id`
- `webapp/src/pages/AgentsPage.tsx` — Xóa cột Mã Agent, search + export theo `staff_id`
- `webapp/src/pages/AgentDetailPage.tsx` — Xóa dòng Mã Agent, title + M1 list hiển thị `staff_id`
- `webapp/src/components/CreateRequestModal.tsx` — Search + display đổi sang `staff_id`
- `webapp/src/components/ComposeTemplateModal.tsx` — Placeholder `{{agentCode}}` → `{{staffId}}`
- `webapp/src/pages/RequestsPage.tsx` — Query + display + export đổi sang `staff_id`
- `webapp/src/pages/RequestDetailPage.tsx` — Query + display đổi sang `staff_id`
- `webapp/src/pages/DashboardPage.tsx` — Query + display đổi sang `staff_id`
- `webapp/src/pages/TrashPage.tsx` — Query + display đổi sang `staff_id`
- `webapp/scripts/extract_agents.py` — Output SQL chỉ insert `staff_id`
- `webapp/supabase/seed_data.sql` — Xóa cột `agent_code`
- `webapp/supabase/import_agents.sql` — Xóa cột `agent_code`
- `webapp/docs/PROGRESS.md` — Cập nhật mô tả
- `PLAN-t1-change-tracker.md` — Cập nhật schema mô tả
- `UI-DESIGN.md` — Xóa cột Mã Agent khỏi mockup

---

### 3. Fix lỗi tạo đề xuất khi agent chưa có T1

**Vấn đề:** Khi tạo `t1_requests`, `old_t1_id` bị lỗi `violates not-null constraint` vì agent chưa có T1 (`current_t1_id = null`).

**Giải pháp:** Bỏ `NOT NULL` cho `old_t1_id` ở bảng `t1_requests` và `t1_changes`.

**Files sửa:**
- `webapp/supabase/migrations/001_initial_schema.sql` — `old_t1_id UUID` (bỏ NOT NULL)
- `webapp/src/types/index.ts` — `old_t1_id: string | null`

**Lưu ý triển khai:** Schema local đã sửa nhưng DB trên Supabase chưa tự động sync. Cần chạy thủ công trong SQL Editor:
```sql
ALTER TABLE public.t1_requests ALTER COLUMN old_t1_id DROP NOT NULL;
ALTER TABLE public.t1_changes ALTER COLUMN old_t1_id DROP NOT NULL;
```

---

### 4. Cải tiến trang Email Templates

**Vấn đề:**
- Menu Email Templates ẩn vì chỉ cho role `admin`
- Placeholder (`{{agentName}}`, `{{agentCode}}`...) chỉ hiển thị, không click để chèn được
- `{{agentCode}}` đã lỗi thờivì đã xóa trường `agent_code`

**Giải pháp:**
- Hướng dẫn user đổi role thành `admin` trong Supabase Table Editor
- Thêm tính năng **click placeholder để chèn** vào textarea tại vị trí con trỏ
- Đổi `{{agentCode}}` → `{{staffId}}`

**Files sửa:**
- `webapp/src/pages/EmailTemplatesPage.tsx`

---

### 5. Deploy production

**URL:** https://t1-change-tracker.vercel.app

**Cách deploy:** `cd webapp && vercel --prod --yes`

---

## 2026-05-27

### 6. Điều chỉnh workflow B2 — nhập ngày xác nhận, cảnh báo 3 ngày làm việc, xác nhận thay đổi từ ngày thứ 4

**Thay đổi:**
- Khi chuyển sang B2, admin phải nhập ngày xác nhận (date picker) thay vì auto ghi `NOW()`.
- Dashboard thêm card **"B2 chờ phản hồi chấp thuận"**: tính deadline = ngày xác nhận + 3 ngày làm việc (trừ T7, CN, ngày lễ VN), cảnh báo đỏ khi quá hạn.
- Dashboard thêm card **"B2 đủ điều kiện xác nhận thay đổi"**: từ ngày thứ 4 (ngày xác nhận + 4 ngày làm việc), admin có thể bấm **"Xác nhận thay đổi"** để hoàn tất request ngay (bypass B3→B4→B5) hoặc **"Hủy đề xuất"**.
- Cả 2 nút đều có **countdown 10 giây** (modal `CountdownConfirmModal`) để tránh misclick.
- Không auto-update, chỉ xảy ra khi admin thao tác tay.

**Files sửa:**
- `webapp/src/lib/eligibility.ts` — Thêm `addBusinessDays`, `isBusinessDay`, `checkCanChooseNewT1`, `getM1ImpactSummary`
- `webapp/src/lib/request-actions.ts` — Tạo mới, tách `completeRequestAction` reusable
- `webapp/src/components/CountdownConfirmModal.tsx` — Tạo mới
- `webapp/src/pages/RequestDetailPage.tsx` — Modal nhập ngày B2, refactor dùng `completeRequestAction`
- `webapp/src/pages/DashboardPage.tsx` — 2 card B2 + query holidays + countdown modal
- `webapp/docs/CHANGELOG.md`

### 7. M1 Impact Analysis trong modal Tạo đề xuất

**Thay đổi:**
- Khi tạo đề xuất, hiển thị thêm section **"Tác động đến ngưởi dưới line"**:
  - Tổng số M1 của agent đang đổi T1.
  - Số M1 đủ điều kiện chọn T1 mới.
  - Số M1 không đủ điều kiện (sẽ ở lại với T2).
  - Expandable list chi tiết từng M1 + lý do.

**Files sửa:**
- `webapp/src/components/CreateRequestModal.tsx`
- `webapp/src/lib/eligibility.ts`

### 8. Fix M1 không tự động chuyển T1 khi request hoàn tất

**Vấn đề:** Khi admin xác nhận hoàn tất đổi T1, agent chính được cập nhật `current_t1_id` sang T1 mới, nhưng các M1 dưới line vẫn giữ `current_t1_id` = agent cũ → tab M1 của agent cũ vẫn hiển thị họ.

**Giải pháp:** Trong `completeRequestAction`, sau khi tạo `m1_transition_tasks`, cập nhật `agents.current_t1_id = old_t1_id` (T2 tạm) cho toàn bộ M1.

**Files sửa:**
- `webapp/src/lib/request-actions.ts`

### 9. Định dạng ngày giờ dd/mm/yyyy, GMT+7

**Thay đổi:** Toàn bộ app hiển thị ngày theo định dạng `dd/mm/yyyy` (2 chữ số ngày/tháng), timezone `Asia/Ho_Chi_Minh`.

**Files sửa:**
- `webapp/src/lib/date-utils.ts` — Tạo mới (`formatDate`, `formatDateTime`, `formatTime`)
- `webapp/src/pages/AgentsPage.tsx`
- `webapp/src/pages/AgentDetailPage.tsx`
- `webapp/src/pages/RequestsPage.tsx`
- `webapp/src/pages/RequestDetailPage.tsx`
- `webapp/src/pages/DashboardPage.tsx`
- `webapp/src/pages/ActivityLogPage.tsx`
- `webapp/src/pages/TrashPage.tsx`
- `webapp/src/pages/HolidaysPage.tsx`
- `webapp/src/components/ComposeTemplateModal.tsx`

### 10. Fix hiển thị UUID thay vì tên + staff_id

**Vấn đề:** Nhiều chỗ trong app hiển thị `current_t1_id`, `old_t1_id`, `proposed_new_t1_id` dưới dạng UUID cắt ngắn (vd: `939774a7`) thay vì tên ngưởi.

**Giải pháp:** Load thêm thông tin agent liên quan (T1 cũ, T1 mới, ngưởi giới thiệu) qua join/query riêng, hiển thị `Họ tên - staff_id`.

**Files sửa:**
- `webapp/src/pages/AgentsPage.tsx` — Cột "T1 hiện tại"
- `webapp/src/pages/RequestsPage.tsx` — Cột "T1 cũ → T1 mới", Export
- `webapp/src/pages/AgentDetailPage.tsx` — Tab M1, Lịch sử T1, T1 Hiện tại, Ngưởi giới thiệu
- `webapp/src/pages/RequestDetailPage.tsx` — Header T1 CŨ / T1 MỚI, Agent info
- `webapp/src/pages/ActivityLogPage.tsx` — T1 cũ → T1 mới trong log item
- `webapp/src/pages/DashboardPage.tsx` — Agent name, T1 name trong B2 cards

### 11. Fix RLS — operator không thể insert t1_changes, activity_logs, m1_transition_tasks

**Vấn đề:** Role `operator` bị RLS chặn khi bấm "Xác nhận thay đổi" từ Dashboard vì `completeRequestAction` insert vào 3 bảng này.

**Giải pháp:** Thêm policy INSERT cho operator.

**Files sửa:**
- `webapp/supabase/migrations/003_fix_rls_policies.sql` — Tạo mới

### 12. Schema cleanup — xóa cột agent_code thừa

**Thay đổi:** Database production vẫn còn cột `agent_code` từ schema cũ. Xóa cột và đồng bộ file import.

**Files sửa:**
- `webapp/supabase/cleanup_agent_data.sql` — Tạo mới (script xóa data giữ schema)
- `webapp/supabase/import_agents.sql` — Revert về không có `agent_code`

### 13. BUG-008: DivisionsPage — Head Agent searchable dropdown + table scroll

**Vấn đề:**
1. Form "Sửa division" yêu cầu nhập UUID thủ công cho `head_agent_id` → admin không thể dùng thực tế.
2. Bảng divisions hiển thị toàn bộ 29 dòng, không giới hạn chiều cao → page dài, khó quan sát.

**Giải pháp:**
1. Thay input text UUID bằng **searchable dropdown**: gõ tên hoặc staff_id → query Supabase → chọn agent → lưu UUID ngầm.
2. Giới hạn chiều cao bảng `max-h-[400px]` với `overflow-y-auto` + `sticky` header.

**Files sửa:**
- `webapp/src/pages/DivisionsPage.tsx` — Searchable dropdown, sticky scroll table


### 14. BUG-009: AgentsPage không hiển thị Division — Schema gap `division_id` INTEGER vs UUID

**Vấn đề:**
1. `AgentsPage` không có cột Division trong bảng.
2. `agents.division_id` là `INTEGER` (schema cũ) trong khi `divisions.id` là `UUID` (schema mới). Trigger `recompute_division_on_referrer_change` gán UUID vào cột INTEGER → sẽ gây lỗi cast.

**Giải pháp:**
1. **Schema migration** (`011_fix_division_id_uuid.sql`):
   - Tạo cột `division_uuid UUID`, compute division cho toàn bộ agents (head → division của head, còn lại → "Khác")
   - Drop cột `division_id` INTEGER cũ, rename `division_uuid` → `division_id`
   - Tạo index, recreate trigger với kiểu UUID đúng
2. **Frontend:**
   - `types/index.ts` — `Agent.division_id: string | null`
   - `AgentsPage.tsx` — query divisions, thêm cột Division, update export
   - `AgentDetailPage.tsx` — hiển thị division trong info card

**Files sửa:**
- `webapp/supabase/migrations/011_fix_division_id_uuid.sql` — Tạo mới
- `webapp/src/types/index.ts`
- `webapp/src/pages/AgentsPage.tsx`
- `webapp/src/pages/AgentDetailPage.tsx`


### 15. FEAT-008: Division Safety Net — Force Recompute & getAgentDivision RPC

**Mô tả:**
Hoàn thiện Lớp 2 và Lớp 3 của Division Safety Net theo thiết kế FEAT-006:

- **Lớp 2:** RPC `get_agent_division(agent_id)` — tính division đúng theo business rule (agent là head → division đó, có T1 → đi lên cây T1 tìm head → division của head, fallback → "Khác")
- **Lớp 3:** Nút "🔄 Tính lại Division" trong trang Divisions — admin force recompute toàn bộ agents với CountdownConfirmModal 10s

**Files sửa:**
- `webapp/supabase/migrations/012_division_safety_net.sql` — 2 RPC functions mới
- `webapp/src/pages/DivisionsPage.tsx` — Thêm button + CountdownConfirmModal + gọi RPC

