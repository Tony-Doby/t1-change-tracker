# Tiến độ T1 Change Tracker

> File này dùng để theo dõi tiến độ và nối lại công việc sau khi ngưng.  
> Cập nhật: 2026-05-27

---

## ✅ Đã hoàn thành

### Phase 1: Foundation
- [x] Khởi tạo project React 19 + Vite + TypeScript + Tailwind CSS v4
- [x] Cài dependencies: `@supabase/supabase-js`, `react-router-dom`, `@tanstack/react-query`, `xlsx`, `date-fns`, `lucide-react`
- [x] TypeScript types cho toàn bộ entities (`Agent`, `T1Request`, `UserProfile`, `ActivityLog`, ...)
- [x] Supabase client thật (`supabase.ts`) — đã xóa mock fallback
- [x] Auth context: Login, Change Password (lần đầu), Logout, Session — kết nối Supabase Auth + `user_profiles`
- [x] App Shell: Header (56px) + Sidebar (240px, collapsible) + RBAC nav items + badge
- [x] Routing: 13 routes với ProtectedRoute / PublicRoute
- [x] Toast/Notification system (global)

### Phase 2: Agent Management, Upload & Templates
- [x] **Agents List**: Query từ Supabase, Search, 7 quick filter presets, bookmark ⭐ (localStorage), pagination
- [x] **Agent Detail**: Query `agents` + `t1_changes` từ Supabase. Tabs: Lịch sử T1, M1 list, Lịch sử làm T1
- [x] **Upload Data**: Drag & drop, parse `.xlsx/.csv` (SheetJS), validate, preview, `upsert` vào bảng `agents` (onConflict `staff_id`)
- [x] **Email Templates**: Query từ `email_templates`, chỉnh sửa, lưu DB, preview modal

### Phase 3: Eligibility & Request Creation
- [x] Eligibility engine (`src/lib/eligibility.ts`) — kiểm tra 91 ngày, 180 ngày, quota 3 lần, cấp bậc không phải ASC (đã refactor để nhận data từ bên ngoài)
- [x] Create Request Modal: Searchable dropdown chọn T1 mới, eligibility real-time, T1 Capacity indicator
- [x] **M1 Impact Analysis**: Trong modal tạo đề xuất, hiển thị tổng số M1 của agent đang đổi T1, phân loại đủ/không đủ điều kiện chọn T1 mới, expandable list chi tiết
- [x] Insert `t1_requests` vào DB khi tạo đề xuất
- [x] PostgreSQL Function `check_eligibility`, `get_t1_capacity`, `get_my_role` trong schema
- [x] **M1 Transition Task automation**: Khi hoàn tất request, tự động tạo `m1_transition_tasks` cho các M1 của agent vừa đổi T1
- [x] **Lazy processing**: Dashboard gọi RPC `process_expired_m1_transitions()` để cập nhật task quá hạn
- [x] **Áp dụng T2**: Nút trên Dashboard cập nhật `agents.current_t1_id`, task status, ghi `activity_logs`

### Phase 4: Request Workflow
- [x] Requests List: Query `t1_requests` (join `agents`) từ Supabase. Kanban summary + bảng theo status, search
- [x] Request Detail: Query request + comments + step history từ DB
- [x] Step progress bar (3 bước: B1→B2→B3), **B2 bắt buộc nhập ngày xác nhận** (date picker). B3 là điểm quyết định: "Đồng ý" (khóa trong 3 ngày LV) / "Hủy" (luôn hiện). Cập nhật DB + ghi `activity_logs`
- [x] Thread comments: Query `request_comments`, insert mới vào DB
- [x] Mini timeline Step History (expandable) từ `activity_logs`
- [x] Notification checklist (B3) — UI
- [x] **Dashboard B2 Alerts**: Cảnh báo 3 ngày làm việc + card xác nhận thay đổi từ ngày thứ 4
- [x] **Countdown 10s**: Modal xác nhận cho "Xác nhận thay đổi" và "Hủy đề xuất" trên Dashboard và Request Detail
- [x] "Hoàn tất" request: từ B3 (sau khi đủ 3 ngày LV) hoặc **từ Dashboard khi đã qua ngày thứ 4**, insert `t1_changes`, update `agents.current_t1_id`, ghi log
- [x] "Hủy" request với reason → cập nhật DB

### Phase 5: Dashboard, Activity, Trash, Export
- [x] **Dashboard**: Query stats từ `agents`, `requests`, `user_bookmarks`, `m1_transition_tasks`
- [x] **Activity Log**: Query `activity_logs` (join `agents`) từ Supabase, timeline grouped by date, filter/search
- [x] **Thùng rác**: Query `agents` + `t1_requests` có `deleted_at`, restore (set null), permanent delete
- [x] **Holidays**: Query `holidays` từ DB, CRUD
- [x] Export Excel modal (dùng chung Agents + Requests)
- [x] Nút "Áp dụng T2 làm T1 chính thức" trên Dashboard (update DB + task status + activity_logs)
- [x] Soạn mẫu trên Agents Page (query agent từ DB, auto-fill placeholder, copy nội dung/email)
- [x] **Định dạng ngày giờ dd/mm/yyyy GMT+7**: `date-utils.ts`, áp dụng toàn bộ app
- [x] **Hiển thị tên thay vì UUID**: AgentsPage, RequestsPage, AgentDetailPage, RequestDetailPage, ActivityLogPage, DashboardPage — load related agents map, hiển thị `full_name - staff_id`
- [x] **Fix RLS operator INSERT policies**: `t1_changes`, `activity_logs`, `m1_transition_tasks` cho phép operator insert

### Phase 6: Supabase Backend
- [x] Tạo Supabase project `t1-change-tracker` (Singapore)
- [x] SQL schema `001_initial_schema.sql` (11 bảng + 3 RPC + trigger)
- [x] RLS policies cho `admin` / `operator` / `viewer`
- [x] Trigger `handle_new_user()` auto-create `user_profiles`
- [x] `.env` với `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [x] **Xóa hoàn toàn `mock-data.ts`** — app 100% dùng real DB

---

## ⏳ Chưa làm / Cần làm tiếp

### Tính năng còn thiếu
- [x] **M1 Transition Task automation**: Khi hoàn tất request, tự động tạo `m1_transition_tasks` cho các M1 của agent vừa đổi T1. Dashboard gọi RPC `process_expired_m1_transitions()` + nút "Áp dụng T2" update DB
- [ ] **Email sending thật**: Hiện chỉ copy nội dung/email. Cần tích hợp SendGrid/Resend để gửi email từ backend
- [ ] **Realtime updates**: Chưa dùng Supabase Realtime (subscriptions) cho comments, status changes
- [ ] **In-app Notifications**: Chưa có hệ thống thông báo (badge, dropdown)
- [ ] **Search/Filter server-side**: Hiện query all rồi filter client-side (OK với <10k records, cần pagination server-side nếu scale)
- [ ] **TanStack Query**: Đã cài nhưng chưa dùng — các page đang dùng `useState` + `useEffect` thủ công

### Polish & Deploy
- [ ] **Responsive mobile**: Chưa optimize cho màn hình nhỏ (bỏ qua theo yêu cầu)
- [x] **Lazy-load `xlsx`**: Bundle giảm từ ~988KB → ~566KB main + ~425KB xlsx chunk
- [x] **Config deploy**: `vercel.json` + `DEPLOY.md` hướng dẫn step-by-step
- [x] **Deploy production**: Vercel auto-deploy từ Git push — https://t1-change-tracker.vercel.app

### Dữ liệu & Test
- [x] **Sample data**: Đã import ~2500 agents từ eravnTrans qua `import_agents.sql`
- [x] **Test RLS policies**: Đã test với role operator (fix lỗi INSERT t1_changes, activity_logs, m1_transition_tasks)
- [x] **Test RPC functions**: `process_expired_m1_transitions` đã được gọi từ Dashboard. `check_eligibility` chưa được gọi từ frontend (dùng JS engine local).

---

## 📁 Cấu trúc thư mục chính

```
webapp/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # App Shell
│   │   ├── Toast.tsx               # Toast system
│   │   ├── CreateRequestModal.tsx  # Tạo đề xuất (DB)
│   │   ├── CountdownConfirmModal.tsx # Modal đếm ngược 10s
│   │   ├── ComposeTemplateModal.tsx # Soạn mẫu email
│   │   └── ExportModal.tsx         # Export Excel
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── ChangePasswordPage.tsx
│   │   ├── DashboardPage.tsx       # Query DB
│   │   ├── AgentsPage.tsx          # Query DB
│   │   ├── AgentDetailPage.tsx     # Query DB
│   │   ├── RequestsPage.tsx        # Query DB
│   │   ├── RequestDetailPage.tsx   # Query DB
│   │   ├── UploadPage.tsx          # Parse + Upsert DB
│   │   ├── EmailTemplatesPage.tsx  # Query DB
│   │   ├── ActivityLogPage.tsx     # Query DB
│   │   ├── TrashPage.tsx           # Query DB
│   │   └── HolidaysPage.tsx        # Query DB
│   ├── hooks/
│   │   └── useAuth.tsx             # Supabase Auth thật
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── eligibility.ts          # Eligibility engine + business days + M1 impact
│   │   ├── request-actions.ts      # completeRequestAction reusable
│   │   └── constants.ts            # BOOKMARKS_KEY
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full PostgreSQL schema
├── .env                            # Supabase credentials
└── docs/
    ├── PROGRESS.md                 # File này
    ├── PLAN-t1-change-tracker.md   # Plan gốc
    └── UI-DESIGN.md                # Design spec
```

---

## 🚀 Cách chạy lại

```bash
cd track-t1-changes/webapp
npm install
npm run dev        # dev server
# hoặc
npm run build      # production build
npm run preview    # preview production
```

## 🔑 Chế độ hiện tại

- **Auth**: Supabase Auth thật. Cần tạo user trong Supabase Dashboard → Authentication → Users
- **Data**: 100% từ Supabase DB. Mock data đã xóa.
- **Role mặc định**: `operator`. Để làm admin, cập nhật `user_profiles.role = 'admin'` trong Supabase Table Editor.

---

## 📝 Khi muốn tiếp tục

Nói với AI:  
> *"Làm deploy lên Vercel"* hoặc *"Tích hợp gửi email"* hoặc *"Tự động tạo M1 transition task"* hoặc *"Dùng TanStack Query refactor"*
