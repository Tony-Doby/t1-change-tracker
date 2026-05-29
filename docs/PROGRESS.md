# Tiến độ T1 Change Tracker — Quick Resume

> File này là **bản tóm tắt nhanh** để nối lại công việc sau khi ngưng.  
> **Đọc kèm** `AGENTS.md` + `KNOWLEDGE.md` để nắm gotchas & constraints.  
> **Xem trạng thái feature chi tiết** tại `PLAN-feature-dev.md` → Feature Registry.  
> Cập nhật: 2026-05-29

---

## 🚀 Cách chạy lại

```bash
cd track-t1-changes/webapp
npm install
npm run dev        # dev server
npm run build      # production build (tsc + vite build)
npm run preview    # preview production
```

---

## 🔑 Chế độ hiện tại

- **Auth**: Supabase Auth thật. Cần tạo user trong Supabase Dashboard → Authentication → Users
- **Data**: 100% từ Supabase DB. Mock data đã xóa.
- **Role mặc định**: `operator`. Để làm admin, cập nhật `user_profiles.role = 'admin'` trong Supabase Table Editor.

---

## 📁 Cấu trúc thư mục chính

```
webapp/
├── src/
│   ├── components/           # Layout, Toast, Modal, CommandPalette, NotificationDropdown, Skeleton, EmptyState, Pagination...
│   ├── pages/                # DashboardPage, AgentsPage, AgentDetailPage, RequestsPage, RequestDetailPage, RanksPage, DivisionsPage, UploadPage, TrashPage, HolidaysPage, ActivityLogPage, EmailTemplatesPage...
│   ├── hooks/                # useAuth, useDebounce, useFocusTrap
│   ├── lib/                  # supabase.ts, eligibility.ts, request-actions.ts, agent-actions.ts, date-utils.ts, constants.ts
│   ├── types/                # index.ts — tất cả TypeScript interfaces
│   ├── App.tsx               # Routing 13 routes + PageTransition
│   ├── main.tsx              # QueryClientProvider (TanStack Query) + AuthProvider + ToastProvider
│   └── index.css             # Design tokens, animations, print CSS
├── supabase/migrations/      # SQL schema + RPC + triggers + RLS
├── docs/                     # AGENTS.md, KNOWLEDGE.md, CHANGELOG.md, PLAN-feature-dev.md, PLAN-bug-fixes.md, UI-DESIGN.md, PROGRESS.md (file này)
└── .env                      # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

---

## 📝 Khi muốn tiếp tục

Nói với AI những cụm từ trigger sau:

| Cụm từ | Hành động AI |
|--------|-------------|
| *"Làm deploy lên Vercel"* | Build + `vercel --prod` (hỏi xác nhận trước) |
| *"Tích hợp gửi email"* | FEAT-001 — Resend/SendGrid Edge Function |
| *"Realtime updates"* | FEAT-002 — Supabase Realtime subscription |
| *"Notifications thật"* | FEAT-003 — Bảng `notifications` + tạo noti tự động |
| *"TanStack Query refactor"* | FEAT-004 — Custom hooks + refactor pages |
| *"Search presets server-side"* | FEAT-005 — RPC `search_agents` + bật presets |
| *"Schema v2 hoàn chỉnh"* | FEAT-006 — UI dùng hết cột mới, upload headers mới |
| *"Deactivation hoàn chỉnh"* | FEAT-007 — Tab lịch sử chấm dứt ở AgentDetailPage |

> ⚠️ **Tất cả feature trên đều phải lập plan trong `PLAN-feature-dev.md` trước khi code.** Xem `AGENTS.md` section 4.
