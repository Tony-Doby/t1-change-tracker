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
- Dù là refactor nhỏ hay sửa UI, nếu chưa có plan trong `PLAN-feature-dev.md` hoặc `PLAN-bug-fixes.md` → phải hỏi user trước. (Các plan đã done/fixed lưu ở `PLAN-feature-archive.md` / `PLAN-bug-archive.md`)
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

### 5.4 Unit Test Policy

> Xem `AGENTS.md` section 3 — "Quy tắc Unit Test (bắt buộc có điều kiện)". Phần này bổ sung chi tiết kỹ thuật và ví dụ.

#### Bắt buộc viết unit test khi:

- Thêm/sửa hàm **pure** trong `src/lib/` liên quan đến:
  - Logic tính toán (ví dụ: `addBusinessDays`, `daysSince`).
  - Validation / business rules (ví dụ: `checkEligibility`, `getT1Capacity`).
  - Transform / parse dữ liệu (ví dụ: `evaluateExpression`, `replaceExpressionsInCell`).
- **Bug fix**: phải thêm regression test tái hiện bug trước khi fix.
- Hàm utility được dùng ở nhiều nơi.

#### Không bắt buộc unit test khi:

- Thay đổi UI thuần túy: màu sắc, layout, text, tooltip.
- Config, constant, type-only changes.
- Prototype / feature thử nghiệm (phải ghi nhận rõ trong plan).
- React component đơn giản.

#### Tiêu chí chất lượng test

- Tên test mô tả rõ behavior.
- Test độc lập, không phụ thuộc thứ tự chạy.
- Test output/behavior, không test implementation detail.
- Mock ít nhất có thể; ưu tiên hàm pure không cần mock.
- Mỗi test chỉ assert một khái niệm chính.

#### Chạy test trước khi coi task xong

```bash
cd track-t1-changes/webapp
npm run test        # unit tests
npm run verify      # tsc + build + eslint
```

#### Ví dụ regression test

```ts
// src/lib/eligibility.test.ts
it('returns ineligible for ASC rank regardless of case', () => {
  expect(checkEligibility({ rank_name: 'asc', hire_date: '2020-01-01', last_t1_change: null })).toEqual({
    eligible: false,
    reason: '(không được là ASC)',
  });
});
```

---

## 6. Excel Generator Constraints (FEAT-019)

### 6.1 Expression parser chỉ chạy trên dòng template (`template_header_row`)
- App chỉ evaluate expression `(R.num)`, `(dd/mm/yyyy)`... trên **đúng 1 dòng** được chỉ định là `template_header_row`.
- Các dòng trước (tiêu đề) và sau (chữ ký) trong file export template được giữ nguyên, **không evaluate expression**.
- Nếu user đặt expression ở dòng data hoặc dòng tiêu đề → expression hiển thị nguyên xi.

### 6.2 Expression-only cells tự động skip mapping (BUG-015 fix)
- Cell chỉ chứa expression thuần túy `(R.num)`, `(dd/mm/yyyy)` → app tự động **skip mapping** cho cell đó, expression luôn evaluate đúng.
- Nếu cell kết hợp text + expression (ví dụ: `{{Họ tên}} - (ddmmyy)(R.num)`) → vẫn evaluate expression sau khi replace inline field refs.
- **Lưu ý:** `isExpressionOnly()` dùng regex `/^\([^)]+\)$/`, nếu cell có space xung quanh vẫn match nhờ `.trim()`.

### 6.3 Inline Field Reference `{{Field}}` (FEAT-020)
- Syntax `{{Tên Field}}` trong cell template để kết hợp data động + expression + text cố định.
- `replaceFieldReferences()` chạy sau expression evaluation, áp dụng mapping + uppercase nếu có.
- Ví dụ: `{{Họ và tên}} - (ddmmyy)(R.num)` → `Trần Lê Toàn Hữu - 03062607`

### 6.4 Chọn ngày generate (FEAT-020)
- `baseDate` mặc định là ngày hiện tại, user có thể chọn ngày khác qua input date picker trong GeneratePanel.
- Expression `(dd)`, `(mm)`, `(yy)`... sẽ dùng ngày đã chọn.

### 6.5 `FieldMappingValue` định nghĩa ở 2 nơi — phải sync
- `src/types/index.ts` và `src/lib/excel-generator.ts` đều định nghĩa `FieldMappingValue`.
- Nếu thêm field (ví dụ `uppercase?: boolean`) → **phải sửa cả 2 file**, không chỉ 1.
- **Gợi ý refactor sau:** Export từ `types/index.ts`, bỏ định nghĩa cục bộ trong `excel-generator.ts`.

### 6.6 CSV import: SheetJS auto-convert số/date → mất số 0, lỗi date
- SheetJS `XLSX.read` parse CSV tự động convert giá trị toàn số (CCCD, SĐT) thành `number` → **mất số 0 đầu**.
- Giá trị giống date (`25/03/2022`) bị parse thành Excel serial number → `String()` ra số lạ (`44508.000...`).
- **Không dùng `XLSX.read` cho CSV** khi cần giữ nguyên text.
- **Giải pháp:** Parse CSV raw text thủ công (`file.text()` + custom parser xử lý quoted fields). Đã implement `parseCsvText()` + `readCsvFile()` trong `excel-generator.ts`.

### 6.7 XLSX import: KHÔNG dùng `cellDates: true` — dùng serial + 1900 epoch (BUG-032 Phase 2)
- **TUYỆT ĐỐI KHÔNG DÙNG** `cellDates: true` khi đọc file data XLSX. SheetJS parse Excel serial date thành `Date` object bị lệch timezone (ví dụ serial `44822` → `2022-09-17T16:59:30Z` thay vì `2022-09-18T00:00:00Z`).
- `readDataFile()` iterate cells thay vì `sheet_to_json`. Detect date serial bằng `cell.w` match pattern `\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}`.
- `excelSerialToDate(serial)` — tính ngày chính xác từ serial theo **1900 epoch** (`1899-12-30`). Serial `44822` → `2022-09-18T00:00:00Z`.
- Sau khi có Date chính xác, format bằng `formatDateDDMMYYYY()` với `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })`.
- Cell string/number khác: dùng `cell.v` (raw value) để giữ nguyên nội dung, không dùng `cell.w` (có thể có dấu phẩy phân cách).

### 6.8 Date handling trong Excel Generator — LUÔN dùng `Asia/Ho_Chi_Minh` (BUG-032)
- Toàn bộ luồng Excel Generator phải xử lý date theo timezone `Asia/Ho_Chi_Minh`, không dùng local timezone của browser.
- `parseDateFromInput(dateStr)` — parse `YYYY-MM-DD` từ `<input type="date">` thành Date ở **local timezone** (`new Date(y, m - 1, d)`) thay vì `new Date("YYYY-MM-DD")` (mặc định parse UTC 00:00).
- `formatDateDDMMYYYY()` — dùng `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })` để format Date object.
- `formatDateToken()` trong expression parser — dùng `Intl.DateTimeFormat` với `timeZone: 'Asia/Ho_Chi_Minh'` để lấy `dd`, `mm`, `yy`, `yyyy`.
- **Lưu ý đặc biệt:** SheetJS `cellDates: true` có known issue với timezone offset. Tính ngày từ serial + 1900 epoch là cách chính xác nhất.

### 6.9 Vitest setup với React 19 + `@testing-library/jest-dom` (FEAT-024)
- Dùng `import '@testing-library/jest-dom/vitest'` trong `src/test/setup.ts` — **KHÔNG DÙNG** `import '@testing-library/jest-dom'` (sẽ bị lỗi `expect is not defined`).
- `vitest.config.ts` cần `test.environment: 'jsdom'` và `setupFiles: ['./src/test/setup.ts']`.
- TypeScript strict mode (`verbatimModuleSyntax`, `noUnusedLocals`): không dùng `globals: true`, nên import `describe, it, expect` từ `vitest` trong từng test file.
- Mock `Date.now()` bằng `vi.useFakeTimers()` + `vi.setSystemTime()` để test `daysSince()` không bị flaky theo ngày chạy.

---

## 7. Known Limitations (đang theo dõi)

| Vấn đề | Trạng thái | Plan xử lý |
|--------|-----------|------------|
| Email chỉ copy, chưa gửi thật | Planned | `PLAN-feature-dev.md` FEAT-027 (Google Apps Script) |
| ~~Chưa có In-app Notifications (real)~~ | **Đã hoàn thành (2026-05-29)** | `PLAN-feature-dev.md` FEAT-003 |
| ~~Chưa dùng Supabase Realtime~~ | **Đã hoàn thành (2026-06-19)** | `PLAN-feature-dev.md` FEAT-002 |
| ~~TanStack Query chưa được dùng~~ | **Đã hoàn thành (2026-05-30)** | `PLAN-feature-dev.md` FEAT-004 |
| Search presets phức tạp bị ẩn | Chưa làm | `PLAN-feature-dev.md` FEAT-005 |
| UI-DESIGN.md chưa update hết | Đang theo dõi | Cập nhật dần khi redesign |
| ~~Excel Generator: Expression parser bị override khi map trùng tên~~ | **Đã hoàn thành (2026-06-04)** | `PLAN-bug-fixes.md` BUG-015 |
| ~~Excel Generator: Chưa hỗ trợ inline field reference `{{Field}}`~~ | **Đã hoàn thành (2026-06-04)** | `PLAN-feature-dev.md` FEAT-020 |
| ~~Excel Generator: Chưa hỗ trợ edit template đã lưu~~ | **Đã hoàn thành (2026-06-04)** | `PLAN-feature-dev.md` FEAT-021 |
| ~~`addBusinessDays()` bị lệch timezone do `toISOString()` dùng UTC~~ | **Đã fix (2026-06-10)** | Parse bằng `new Date(y, m-1, d)` + helper `formatLocalDate()` |

---

## 8. Google Drive Admin — Apps Script (FEAT-030/031/032)

### 8.1 Thêm action Apps Script mới = sửa 2 nơi + redeploy
- Action mới (vd `detectDriveTypes`) phải được thêm vào **cả** `ALLOWED_ACTIONS` (Edge Function `google-apps-script-proxy/index.ts`) **và** `switch` trong `doPost` (`FEAT-030-apps-script.gs`).
- Thiếu ở Edge Function → lỗi `400 Action "..." is not allowed` (chặn trước khi tới Apps Script).
- **Sau khi sửa**: `supabase functions deploy google-apps-script-proxy` **và** Apps Script → **Deploy → New version**. Sửa file repo KHÔNG tự cập nhật bản đang chạy.

### 8.2 Loại Drive chỉ phân biệt được qua `driveId` (không qua URL/ID)
- My Drive vs Shared Drive **không** suy ra được từ link/ID. Phải gọi `Drive.Files.get(id, { fields: 'driveId', supportsAllDrives: true })`: có `driveId` ⇒ Shared Drive.
- Mọi lệnh Advanced Drive Service trên item Shared Drive phải kèm `supportsAllDrives: true`, nếu không sẽ "not found".
- `scanFolders` chỉ detect 1 lần ở folder gốc rồi gán cho mọi con — cây folder không thể nằm cả 2 loại Drive.

### 8.3 Role `fileOrganizer`/`organizer` chỉ hợp lệ trên Shared Drive
- 3 role chung cho cả 2 loại Drive: `reader`, `commenter`, `writer`.
- 2 role chỉ-Shared: `fileOrganizer` (Người quản lý nội dung), `organizer` (Người quản lý). Áp lên item My Drive → API lỗi.
- UI chỉ mở khóa 5 role khi **toàn bộ** item là Shared Drive; danh sách lẫn 2 loại → giới hạn 3 role chung + banner. Backend `setPermissions` cũng validate lại từng item.

### 8.4 "Bất kỳ ai có link" = `type: 'anyone'` + `allowFileDiscovery: false`
- Cấp public-view-by-link: `Drive.Permissions.create({ type: 'anyone', role, allowFileDiscovery: false }, id, { supportsAllDrives: true })`.
- `allowFileDiscovery: false` = có link mới xem được (không bị tìm thấy/lập chỉ mục công khai).
- `setPermissions` dùng **1 code path duy nhất** (`Drive.Permissions.create`) cho cả My Drive lẫn Shared Drive, cả scope user lẫn anyone — không dùng `DriveApp.addEditor/setSharing`.

### 8.5 Drive Manager (FEAT-034) — Permission inheritance khi tạo folder
- Khi tạo folder mới bên trong folder đã được share, Google Drive **tự động kế thừa** quyền từ cha xuống con.
- `createFolderTree` tận dụng điều này: tạo cây folder đệ quy trước, sau đó chỉ apply những quyền **khác với quyền đã kế thừa**.
- Nếu sau này thêm quyền mới vào folder cha đã tồn tại, các con cũ **không** tự động nhận thêm quyền mới.
- Template lưu dạng **cây nested** (`{ name, permissions, children }`), không phải flat levels.

### 8.6 `drive_templates` — cột là `root` (nested), KHÔNG phải `levels` (BUG-039)
- Code (`types/index.ts` `DriveTemplate.root`, `useDriveTemplates.ts`) lưu cây template vào cột **`root` JSONB** (nested `{ name, permissions, children }`).
- Migration gốc `020_drive_manager.sql` tạo cột **`levels`** (flat, NON-NULL) — **lệch với code**. Đã sửa bằng migration `021_drive_templates_root.sql` (`ADD COLUMN root` + `DROP NOT NULL levels`).
- **Phải chạy tay `021` trên Supabase** (KNOWLEDGE 1.2). Nếu DB còn thiếu cột `root` → insert/update template trả lỗi *"column root does not exist"* → không lưu được template.
- `handleCreateTemplate`/`handleUpdateTemplate` trong `DriveManagerPage.tsx` đã được bọc try/catch + toast — mọi lỗi DB/RLS giờ hiển thị rõ thay vì nuốt im lặng.
