# Tiến độ T1 Change Tracker — Quick Resume

> File này là **bản tóm tắt nhanh** để nối lại công việc sau khi ngưng.  
> **Đọc kèm** `AGENTS.md` + `KNOWLEDGE.md` để nắm gotchas & constraints.  
> **Xem trạng thái feature chi tiết** tại `PLAN-feature-dev.md` → Feature Registry.  
> Cập nhật: 2026-08-13 — review source, integration và tài liệu hiện hành.

---

## 🚀 Cách chạy lại

```bash
cd track-t1-changes/webapp
npm install
npm run dev        # dev server
npm run build      # production build (tsc + vite build)
npm run preview    # preview production
npm run verify     # tsc + build + lint (smoke test pre-check)
npm run test       # vitest run (unit tests)
npm run test:watch # vitest watch mode
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
│   ├── components/           # Shared UI + feature folders (agent-detail, dashboard, drive-manager, excel-generator, request-detail...)
│   ├── pages/                # 16 pages, gồm ChangePasswordPage, ExcelGeneratorPage và DriveManagerPage
│   ├── hooks/                # useAuth, useDebounce, useFocusTrap, queries/ (TanStack Query hooks)
│   ├── ui/                   # Twenty primitives: theme, layout, display, input, navigation, feedback
│   ├── lib/                  # supabase.ts, eligibility.ts, request-actions.ts, agent-actions.ts, date-utils.ts, constants.ts
│   ├── types/                # index.ts — tất cả TypeScript interfaces
│   ├── App.tsx               # 16 route declarations + guards ProtectedRoute/AdminRoute + PageTransition
│   ├── main.tsx              # QueryClientProvider + AuthProvider + ToastProvider + DialogProvider
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
| ~~*"Tích hợp gửi email"*~~ | ~~FEAT-001 — Resend/SendGrid Edge Function~~ |
| ~~*"Realtime updates"*~~ | ~~FEAT-002 — Supabase Realtime subscription~~ |
| ~~*"Notifications thật"*~~ | ~~FEAT-003 — Bảng `notifications` + tạo noti tự động~~ |
| ~~*"TanStack Query refactor"*~~ | ~~FEAT-004 — Custom hooks + refactor pages~~ |
| ~~*"Email activities tracking"*~~ | ~~FEAT-025 — Bảng `email_activities` + trigger count~~ |
| ~~*"Xóa mẫu email"*~~ | ~~FEAT-026 — Delete Email Template~~ |
| *"Gửi email qua Google Apps Script"* | FEAT-027 — Edge Function + Apps Script Web App (planned) |
| *"Google Drive Admin Panel"* | FEAT-030 — Apps Script proxy + quản lý Drive (done) |
| *"Cấp quyền Drive linh hoạt"* | FEAT-031 — Tự nhận diện loại Drive + 5 role + email/anyone-with-link (done) |
| *"Bảng Quét folder tương tác"* | FEAT-032 — Search, lọc cấp/loại Drive, chọn nhiều + cấp quyền hàng loạt (done) |
| ~~*"Dashboard M1 full width"*~~ | ~~FEAT-028 — Ẩn chart/bookmark, M1 filter tabs~~ |
| ~~*"Dashboard full viewport"*~~ | ~~FEAT-029 — M1 fill remaining height~~ |
| ~~*"Dọn ESLint errors"*~~ | ~~REFACTOR-006 — Fix 172 lint errors~~ |
| *"Search presets server-side"* | FEAT-005 — RPC `search_agents` + bật presets |
| ~~*"Schema v2 hoàn chỉnh"*~~ | ~~FEAT-006 — UI dùng hết cột mới, upload headers mới~~ |
| ~~*"Deactivation hoàn chỉnh"*~~ | ~~FEAT-007 — Tab lịch sử chấm dứt ở AgentDetailPage~~ |
| ~~*"Sidebar gom nhóm + page-tabs"*~~ | ~~FEAT-038 — Agent Panel / Tools / Settings, navigation config tập trung~~ |

> ⚠️ **Tất cả feature trên đều phải lập plan trong `PLAN-feature-dev.md` trước khi code.** Xem `AGENTS.md` section 4.

---

## Trạng thái đã xác minh

- Review 2026-08-13: **164** file source TypeScript/TSX (không gồm test), **7** test file với **98** test case khai báo.
- `npm.cmd run build`: **pass** (TypeScript + Vite production build) ngày 2026-08-13. Bundle chính là 960 kB minified / 258 kB gzip; Vite cảnh báo chunk vượt 600 kB.
- `npm.cmd run test`: **pass — 7 test files, 98 tests** ngày 2026-08-13. Lần timeout trước là do giới hạn 60 giây khi chạy chung với các kiểm tra khác, không phải test failure.
- `npm.cmd run lint` chưa có kết quả hoàn chỉnh trong môi trường review; chạy lại riêng trong local/CI trước khi xác nhận `npm run verify` xanh.
- Điều hướng sidebar/page-tabs lấy từ `src/config/navigation.ts` (`NAV_GROUPS`); route vẫn khai báo tại `src/App.tsx` và phải khớp path.
- `/admin/google-drive` hiện là **Drive Manager** (Cây Drive / Quét folder / Template / Lịch sử), thay cho `AppsScriptAdminPage` cũ.
- Google Drive folder/template chỉ cho chọn tối đa `fileOrganizer`; `organizer` chỉ hợp lệ ở cấp Shared Drive, không áp cho folder/file con.
- `staff_id` là key ghi/import; `agent_code` vẫn là field legacy read-only trong `Agent` và Agent Detail. Request contract còn `step4`/`step5` dù product flow là B1 → B2 → B3.
- Upload Agent hiện chưa có Web Worker/batch import và dùng SheetJS cho CSV; xem `REFACTOR-007` trước khi thay đổi luồng này.
