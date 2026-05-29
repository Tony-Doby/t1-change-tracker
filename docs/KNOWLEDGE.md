# Project Knowledge — T1 Change Tracker

> File này lưu các lưu ý kỹ thuật, gotchas, constraints và business rules mà AI **PHẢI ĐỌC** trước khi sửa code.  
> Đọc song song với `AGENTS.md` và `CHANGELOG.md`.  
> Khi phát hiện gotcha mới trong quá trình code, **cập nhật file này ngay** để AI sau không tái phạm.

---

## 1. Supabase Constraints

### 1.1 Max-rows limit (1000)
- Supabase REST API mặc định giới hạn **1000 rows** mỗi query.
- Query không có `.limit()` hoặc `.range()` chỉ trả về ~1000 rows mới nhất.
- **Ảnh hưởng:** `AgentsPage` (2549 agents), `ExportModal` khi export toàn bộ.
- **Cách xử lý:**
  - List + Search: dùng server-side pagination `.range(from, to)`.
  - Export toàn bộ: loop query batch 1000 rows.
  - Presets phức tạp (`near_91d`, `near_180d`, `quota_exceeded`): cần RPC server-side (xem `PLAN-feature-dev.md` FEAT-005).

### 1.2 Schema local ≠ DB production
- File `supabase/migrations/*.sql` chỉ là file **local**.
- Sửa schema (thêm cột, bỏ NOT NULL, tạo bảng mới...) **phải chạy `ALTER TABLE` thủ công** trong Supabase SQL Editor.
- **Không được giả định** migration file tự sync lên DB production.
- Khi tạo bảng mới: nhớ bật `ENABLE ROW LEVEL SECURITY` + thêm policies cho `admin` / `operator` / `viewer`.

### 1.3 RLS — Operator cần INSERT đặc biệt
- Role `operator` bị chặn INSERT một số bảng nếu thiếu policy.
- Đã fix: `t1_changes`, `activity_logs`, `m1_transition_tasks` cần policy INSERT cho operator.
- Nếu tạo bảng mới có logic insert từ frontend → **nhớ test với role operator**.

### 1.4 Auth & Roles
- Supabase Auth + bảng `user_profiles` mở rộng `auth.users`.
- Role mặc định khi tạo user: `operator`.
- Để làm admin: cập nhật `user_profiles.role = 'admin'` trong Supabase Table Editor.
- Menu `Email Templates` và `Trash` chỉ hiển thị cho `admin`.

### 1.5 Migration SQL — `CREATE POLICY` không có `IF NOT EXISTS`
- PostgreSQL **không hỗ trợ** `CREATE POLICY IF NOT EXISTS`.
- Nếu chạy lại migration hoặc policy đã tồn tại → lỗi `42710: policy "..." already exists`.
- **Cách xử lý:** Dùng `DROP POLICY IF EXISTS ...` trước khi `CREATE POLICY`, hoặc dùng file `*_safe_rerun.sql` để drop policies cũ trước.
- Các object khác an toàn khi rerun:
  - `CREATE TABLE IF NOT EXISTS` ✅
  - `CREATE OR REPLACE FUNCTION` ✅
  - `CREATE INDEX IF NOT EXISTS` ✅
  - `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` ✅
  - `CREATE POLICY` ❌ (dễ lỗi duplicate)

---

## 2. Business Rules (dễ code sai)

### 2.1 Không có `agent_code`
- Toàn bộ app chỉ dùng **`staff_id`** làm unique key.
- Import data upsert theo `staff_id` (onConflict), không phải `agent_code`.
- Placeholder email: `{{staffId}}`, **không phải** `{{agentCode}}`.
- UI hiển thị format: `Họ tên - staff_id`.

### 2.2 Eligibility cấp bậc
- Chỉ cần **`rank_name != 'ASC'`** (không phân biệt hoa thường).
- **Không dùng** whitelist CS_RANKS cũ.
- Message lỗi eligibility: `"(không được là ASC)"`.

### 2.3 `old_t1_id` nullable
- Agent chưa có T1 → `old_t1_id = null` trong `t1_requests` và `t1_changes`.
- Logic M1 transition **không được** wrap trong `if (old_t1_id)` — phải handle `null`.
- Khi `old_t1_id = null`: M1s được set `current_t1_id = null`, task tạo với `temp_t1_id = null`.

### 2.4 `temp_t1_id` nullable (sau BUG-001)
- Bảng `m1_transition_tasks.temp_t1_id` đã `DROP NOT NULL`.
- Dashboard hiển thị `"Không có T1 tạm"` khi `temp_t1_id = null`.

### 2.5 Quy trình Request chỉ còn 3 bước
- Workflow: **B1 → B2 → B3**.
- B1: Tạo đề xuất.
- B2: T1 mới xác nhận + nhập ngày xác nhận.
- B3: Điểm quyết định (Đồng ý / Hủy) sau 3 ngày làm việc.
- **Không còn B4, B5** trong UI. DB vẫn giữ cột cũ để tương thích ngược.
- Chart/Kanban chỉ hiển thị: B1, B2, B3, Hoàn tất, Đã hủy.

### 2.6 Ngày làm việc & Tính ngày
- "Ngày làm việc" = **Thứ 2 đến Thứ 6**.
- Trừ ngày lễ VN (bảng `holidays`).
- Tính deadline B2: ngày xác nhận + 3 ngày làm việc (dùng `date-fns` + holidays array).
- Không hard-code ngày lễ trong code — luôn query từ DB.

### 2.7 M1 Transition (30 ngày)
- Khi agent đổi T1, các M1 có **30 ngày** để chọn T1 mới.
- Trong 30 ngày: T2 đóng vai trò **T1 tạm** (`temp_t1_id`).
- Sau 30 ngày:
  - Nếu M1 không chọn → admin bấm `"Áp dụng T2 làm T1 chính thức"`.
  - Nếu M1 chọn T1 mới → tạo `t1_requests` mới cho M1 đó.
- Không có cron job → dùng **lazy processing** (gọi RPC khi admin mở Dashboard).

---

## 3. UI/UX Constraints

### 3.1 PageTransition + Modal Stacking Context
- `PageTransition` dùng CSS `transform: translateY()` cho animation fade-in.
- `transform` trên ancestor tạo **stacking context mới**.
- Modal `position: fixed` bên trong sẽ bị "trapped" — bị cắt bởi container cha thay vì overlay toàn màn hình.
- **Giải pháp bắt buộc:** Dùng `createPortal` từ `react-dom` để render modal ra `document.body`.
- Modal cần xử lý: `ComposeTemplateModal`, `CreateRequestModal`, `ExportModal`, `CountdownConfirmModal`.

### 3.2 Ngày giờ toàn app
- Định dạng: **`dd/mm/yyyy`** (2 chữ số ngày/tháng).
- Timezone: **`Asia/Ho_Chi_Minh`** (GMT+7).
- Dùng `src/lib/date-utils.ts` (`formatDate`, `formatDateTime`).
- **Không dùng** `toLocaleDateString()` mặc định vì sẽ ra định dạng/thờigian khác.

### 3.3 UI-DESIGN.md đã lỗi thời ở một số chỗ
- UI-DESIGN.md vẫn có giá trị reference nhưng cần biết:
  - Đã đổi từ 5 bước → 3 bước (B1→B2→B3).
  - Đã xóa cột "Mã Agent" → chỉ còn "Mã NV" (`staff_id`).
  - Đã đổi `{{agentCode}}` → `{{staffId}}`.
- Nếu conflict giữa UI-DESIGN.md và code thực tế → **ưu tiên code thực tế + CHANGELOG.md**.

---

## 4. Data & Import Constraints

### 4.1 Upsert theo `staff_id`
- Upload Excel/CSV: upsert vào bảng `agents` với `onConflict: 'staff_id'`.
- Validate header trước khi import.
- Batch insert tối đa 500 dòng/lần để tránh timeout.

### 4.2 Soft Delete
- Bảng `agents` và `t1_requests` dùng `deleted_at` (timestamp) cho soft delete.
- Query mặc định phải loại trừ: `.is('deleted_at', null)`.
- `TrashPage` query `deleted_at IS NOT NULL`.

---

## 5. Workflow & Collaboration Constraints

### 5.1 Không tự ý commit/deploy
- Xem `AGENTS.md` section 3. Tuyệt đối không `git commit`, `git push`, `vercel --prod` khi chưa được yêu cầu rõ ràng từng lần.
- Local repo nằm ở `track-t1-changes/webapp/.git` (không phải root `Main`).

### 5.2 Feature/Bug chưa có plan → không code
- Dù là refactor nhỏ hay sửa UI, nếu chưa có plan trong `PLAN-feature-dev.md` hoặc `PLAN-bug-fixes.md` → phải hỏi user trước.
- Refactor nhỏ (< 3 files, không đổi behavior): có thể ghi vào `KNOWLEDGE.md` (coding guideline) rồi làm luôn khi có xác nhận.
- Refactor lớn: phải có plan trong `PLAN-feature-dev.md` với prefix `REFACTOR-xxx`.

### 5.3 Comment `TODO` trong code
- Nếu phát hiện vấn đề nhỏ trong lúc code nhưng không thuộc scope hiện tại:
  ```typescript
  // TODO-PERF[FEAT-00X]: Query N+1, cần optimize sau
  // TODO-UI[BUG-00X]: Chưa test trên Safari
  // NOTE: Fallback hardcoded, sẽ bỏ khi DB đủ data
  ```
- Sau khi hoàn thành task hiện tại, quét toàn bộ `TODO` để chuyển thành plan chính thức.

---

## 6. Known Limitations (đang theo dõi)

| Vấn đề | Trạng thái | Plan xử lý |
|--------|-----------|------------|
| Email chỉ copy, chưa gửi thật | Chưa làm | `PLAN-feature-dev.md` FEAT-001 |
| ~~Chưa có In-app Notifications (real)~~ | **Đã hoàn thành (2026-05-29)** | `PLAN-feature-dev.md` FEAT-003 |
| Chưa dùng Supabase Realtime | Chưa làm | `PLAN-feature-dev.md` FEAT-002 |
| TanStack Query chưa được dùng | Chưa làm | `PLAN-feature-dev.md` FEAT-004 |
| Search presets phức tạp bị ẩn | Chưa làm | `PLAN-feature-dev.md` FEAT-005 |
| UI-DESIGN.md chưa update hết | Đang theo dõi | Cập nhật dần khi redesign |
