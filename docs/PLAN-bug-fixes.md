# Plan Bug Fixes — T1 Change Tracker

> File này dùng để lập kế hoạch chi tiết cho **từng bug** trước khi tiến hành fix.  
> Quy tắc: **Mỗi bug phải có 1 plan rõ ràng trong file này trước khi code.**  
> Sau khi fix xong, cập nhật trạng thái `status: fixed` và ghi vào `CHANGELOG.md`.

---

## Template cho mỗi bug

```markdown
### BUG-{id}: {Tiêu đề ngắn gọn}

- **Phát hiện**: {Ngày phát hiện}
- **Status**: `investigating` | `planned` | `in_progress` | `fixed` | `wontfix`
- **Severity**: `critical` | `high` | `medium` | `low`

#### 1. Mô tả bug
{Mô tả chi tiết hiện tượng lỗi}

#### 2. Root Cause
{Nguyên nhân gốc rễ đã xác định}

#### 3. SQL Verify (nếu cần)
```sql
-- Query để xác nhận bug
```

#### 4. Solution
{Mô tả giải pháp fix}

#### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `path/to/file.ts` | {Mô tả} |

#### 6. Schema / SQL changes
{ALTER TABLE, migration file, v.v.}

#### 7. Test Plan
{Bước test để verify sau fix}

#### 8. Notes
{Lưu ý triển khai, rủi ro, rollback plan}
```

---

## Bug Registry

| ID | Tiêu đề | Status | Ngày phát hiện | Ngày fix |
|----|---------|--------|----------------|----------|
| 021 | M1 Transition task không bị resolved khi agent hoàn tất chuyển T1 | fixed | 2026-06-05 | 2026-06-05 |
| 022 | B2PendingAlert không hiển thị do addBusinessDays parse ISO datetime sai | fixed | 2026-06-11 | 2026-06-11 |
| 023 | Dropdown placeholder trong HtmlEditor bị cắt và không scroll được | fixed | 2026-06-11 | 2026-06-11 |
| 024 | Placeholder `{{tempT1Name}}` bị trùng giá trị với `{{oldT1Name}}` | fixed | 2026-06-11 | 2026-06-11 |
| 025 | ComposeTemplateModal load sai T1 cũ / Temp T1 / New T1 | fixed | 2026-06-11 | 2026-06-11 |
| 026 | ComposeTemplateModal query `t1_requests` bị 400 Bad Request do cú pháp `.not('status', 'in', ...)` sai | fixed | 2026-06-11 | 2026-06-11 |
| 027 | ComposeTemplateModal lấy nhầm request khi agent có nhiều request | fixed | 2026-06-11 | 2026-06-11 |
| 028 | ComposeTemplateModal dropdown chọn loại mẫu tự đóng modal | fixed | 2026-06-12 | 2026-06-12 |
| 029 | ComposeTemplateModal không hiển thị mẫu email mới / vẫn hiển thị mẫu đã xóa | fixed | 2026-06-12 | 2026-06-12 |
| 030 | ComposeTemplateModal tự đóng khi chọn loại mẫu do AgentsPage dựa vào selection | fixed | 2026-06-12 | 2026-06-12 |
| 033 | Agent Detail lưu thông tin không tự refresh, phải F5 mới thấy mới | fixed | 2026-06-19 | 2026-06-19 |
| 035 | RequestsPage không tự cập nhật khi tạo / thay đổi request | fixed | 2026-06-19 | 2026-06-19 |
| 036 | Dashboard B2 chờ phản hồi chấp thuận không cập nhật khi active B2 | fixed | 2026-06-19 | 2026-06-19 |
| 037 | Dropdown "Quyền" (Google Drive Admin) sai chính tả "Ngườii" và thuật ngữ chưa khớp Google Drive | fixed | 2026-06-26 | 2026-06-26 |
| 038 | Thanh "đã chọn" trong cây Drive thiếu nút "Tạo folder theo template" | fixed | 2026-06-27 | 2026-06-27 |
| 039 | Không lưu được template Drive — DB còn cột `levels`, code dùng `root` + lỗi bị nuốt | fixed | 2026-06-27 | 2026-06-27 |
| 040 | `createFolderTree` lỗi "Template thiếu root folder" + không chạy trên Shared Drive | fixed | 2026-06-27 | 2026-06-27 |
| 041 | Quyền template lệch với Shared Drive — app cho chọn `organizer` (không gán được cho folder con) và nuốt lỗi áp quyền | fixed | 2026-06-27 | 2026-06-27 |

---

## BUG-040: `createFolderTree` lỗi "Template thiếu root folder" + không chạy trên Shared Drive

- **Phát hiện**: 2026-06-27
- **Status**: `fixed` (2026-06-27) — ⚠️ **cần copy `.gs` lên Apps Script + Deploy → Phiên bản mới**
- **Severity**: `high`

### 1. Mô tả bug
Trong Drive Manager, chọn 1 folder Shared Drive ("Text 2") → "Tạo folder theo template" → "Tạo folder". Toast báo lỗi generic "Edge Function returned a non-2xx status code". Tab Lịch sử ghi nhận chuỗi lỗi thật:
1. Ban đầu: `Unknown action: createFolderTree` — do bản Apps Script deploy chưa cập nhật (đã giải quyết bằng Deploy → Phiên bản mới).
2. Sau đó: **`Template thiếu root folder`** — lỗi logic trong `createFolderTree`.

### 2. Root Cause
**Lệch contract frontend ↔ Apps Script:**
- Frontend gửi `template: template.root` (`DriveManagerPage.tsx:258-262`) — tức **chính node gốc** `{ name, permissions, children }`. Khớp type `CreateFolderTreeParams.template: DriveTemplateFolder`.
- Apps Script lại đọc `params.template.root` (`FEAT-030-apps-script.gs` cũ) — lồng thêm 1 lớp → `undefined` → ném `Template thiếu root folder`.

**Rủi ro Shared Drive (đi kèm):** `createFolderTree` cũ dùng `DriveApp` (`getFolderById` → `createFolder` → `getPermissions`), hạn chế/đổ lỗi trên Shared Drive — trong khi item test là Shared Drive.

### 3. SQL Verify
Không cần (lỗi ở Apps Script, log trong `apps_script_logs`).

### 4. Solution
Viết lại `createFolderTree` trong `webapp/docs/FEAT-030-apps-script.gs`:
1. Đọc `params.template` **trực tiếp** làm node gốc (khớp type + frontend). Validate `rootTemplate.name`.
2. Thay `DriveApp` → **Advanced Drive Service**: `Drive.Files.create({ name, mimeType:'application/vnd.google-apps.folder', parents:[parentId] }, null, { supportsAllDrives: true })` → tạo folder được trên cả My Drive lẫn Shared Drive.
3. Bỏ `getInheritedPermission` (dùng `DriveApp.getPermissions`, lỗi trên Shared Drive). Áp thẳng quyền template qua `Drive.Permissions.create` — Drive tự kế thừa nên áp lại là idempotent. Giữ validate role chỉ-Shared (`fileOrganizer`/`organizer`) + `sendNotificationEmail: false`.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `webapp/docs/FEAT-030-apps-script.gs` | Rewrite `createFolderTree` (đọc `params.template` trực tiếp + Advanced Drive Service); xóa `getInheritedPermission` |

> Không sửa code app: type `CreateFolderTreeParams.template: DriveTemplateFolder` và payload frontend `template: template.root` đã đúng — `.gs` là chỗ lệch.

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Copy `webapp/docs/FEAT-030-apps-script.gs` lên project Apps Script → **Triển khai → Phiên bản mới**.
2. Đảm bảo secret `APPS_SCRIPT_WEB_APP_URL` của Edge Function trỏ đúng deployment vừa cập nhật.
3. Drive Manager → chọn 1 folder **My Drive** → tạo từ template → verify cây folder + quyền được tạo, tab Lịch sử = Thành công.
4. Lặp lại với folder **Shared Drive** ("Text 2") → verify thành công (không còn lỗi DriveApp).
5. Kiểm tra Google Drive thật: cây folder đúng cấu trúc template, quyền áp đúng, **không gửi email** cho người được cấp.

### 8. Notes
- **`createFolder` (action đơn) vẫn dùng `DriveApp`** → còn rủi ro tương tự trên Shared Drive. Nằm ngoài scope BUG-040 (chưa có repro). Ghi nhận làm follow-up nếu cần.
- Mỗi lần sửa `.gs` phải Deploy → Phiên bản mới mới có hiệu lực (KNOWLEDGE 8.1).
- Rollback: revert `createFolderTree` về bản DriveApp + Deploy lại.

---

## BUG-041: Quyền template lệch với Shared Drive — app cho chọn `organizer` + nuốt lỗi áp quyền

- **Phát hiện**: 2026-06-27
- **Status**: `fixed` (2026-06-27)
- **Severity**: `medium`

### 1. Mô tả bug
Khi tạo folder từ template / cấp quyền trong Drive Manager:
1. Quyền hiển thị trong app **lệch** với quyền thật trên Shared Drive.
2. Không set được vai trò **"Người quản lý"** (`organizer`) cho người khác — trên Shared Drive mức cao nhất chỉ là **"Người quản lý nội dung"** (`fileOrganizer`).

### 2. Root Cause
**Giới hạn nền tảng của Google (không phải bug code):** Google Drive **không cho gán `organizer` cho folder/file con bên trong Shared Drive** — `organizer` chỉ hợp lệ ở cấp Shared Drive (cả ổ). API trả lỗi `Organizer role is only valid for shared drives`. Mức tối đa cho item con là `fileOrganizer`. Dialog chia sẻ gốc của Google cũng chỉ tới "Người quản lý nội dung".

**Lỗi UX của app (sửa được):**
- App vẫn cho chọn `organizer` ("Người quản lý") trong editor template (`DRIVE_ROLES`) và form cấp quyền (`SHARED_ONLY_ROLES`).
- Khi `createFolderTree` áp `organizer` lên folder con, Google từ chối nhưng lỗi bị **bắt và nuốt âm thầm** — chỉ ghi vào `node.permissionsApplied[].error` (`FEAT-030-apps-script.gs`), folder vẫn tạo, app báo "thành công".
- Hệ quả: app hiển thị **ý định** của template (organizer), Drive thật chỉ nhận mức thấp hơn / không gì → **lệch**.

### 3. SQL Verify
Không cần.

### 4. Solution (A + B — user duyệt 2026-06-27)
**A — Bỏ `organizer` khỏi danh sách role chọn được ở cấp folder/template** (giữ tối đa `fileOrganizer`), kèm dòng giải thích giới hạn của Google. Giữ `organizer` trong type `DriveRole` + `roleLabel()` để hiển thị dữ liệu template cũ.

**B — Nổi lỗi áp quyền sau khi tạo folder từ template:** đọc `permissionsApplied[].error` trả về; nếu có quyền áp lỗi → toast cảnh báo (warning) liệt kê folder + email + role lỗi, thay vì luôn báo "thành công".

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/drive-manager/template-editor-utils.ts` | Bỏ `'organizer'` khỏi `DRIVE_ROLES`; đổi `DEFAULT_TEMPLATE_ROOT` organizer→fileOrganizer |
| `src/components/drive-manager/TemplateEditorModal.tsx` | Đổi default local organizer→fileOrganizer; thêm dòng hint giải thích |
| `src/components/apps-script/SetPermissionsForm.tsx` | `SHARED_ONLY_ROLES` bỏ `'organizer'` (còn `['fileOrganizer']`); chỉnh hint/cảnh báo |
| `src/types/index.ts` | Thêm `AppliedPermission`, `CreatedFolderNode`, `CreateFolderTreeResult` |
| `src/components/drive-manager/create-folder-tree-utils.ts` | **Mới** — pure `collectPermissionFailures` / `formatPermissionFailures` |
| `src/components/drive-manager/create-folder-tree-utils.test.ts` | **Mới** — regression test (6 case) |
| `src/pages/DriveManagerPage.tsx` | `executeAction` thêm `silentSuccess`; `handleCreateFromTemplate` báo warning khi có quyền áp lỗi |

> **Không cần sửa `.gs` / redeploy Apps Script.** Bản BUG-040 đã trả `permissionsApplied[].error`; validate `organizer` trong `.gs` giữ nguyên làm phòng vệ cho template cũ.

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. `npm run build` + `npm run test` pass (thêm 6 test pure cho `collectPermissionFailures` / `formatPermissionFailures`).
2. Editor template: dropdown "Quyền" chỉ còn tới "Người quản lý nội dung", không còn "Người quản lý"; có dòng hint giải thích.
3. Form cấp quyền cho item Shared Drive: role tối đa = "Người quản lý nội dung".
4. Tạo folder từ template trên Shared Drive với template (cũ) còn `organizer` → toast **warning** liệt kê quyền áp lỗi (không còn báo "thành công" giả).
5. Tạo folder từ template mà mọi quyền áp OK → toast "Đã tạo folder từ template".

### 8. Notes
- Đây chủ yếu là giới hạn của Google + UX; không thay đổi hành vi backend.
- Nếu sau này cần cấp **Manager toàn ổ chung** (phương án C, user **chưa** duyệt): thêm action riêng gán `organizer` với `fileId = ID Shared Drive` (gốc ổ), không phải folder con.
- Template cũ đã lưu `organizer` vẫn hiển thị đúng nhãn; khi áp sẽ báo lỗi rõ ràng (plan B) thay vì âm thầm.

---

## BUG-038: Thanh "đã chọn" trong cây Drive thiếu nút "Tạo folder theo template"

- **Phát hiện**: 2026-06-27
- **Status**: `fixed` (2026-06-27)
- **Severity**: `medium`

### 1. Mô tả bug
Trong **Drive Manager → Cây Drive → [mở 1 cây]**, khi tick checkbox chọn folder, thanh hành động cuối bảng chỉ hiển thị **1 nút "Cấp quyền"**. Không có nút "Tạo folder theo template" cho folder đang chọn. Chức năng tạo từ template hiện chỉ truy cập được qua menu `⋮` của từng dòng.

### 2. Root Cause
`TreeDetailView.tsx:272-286` — khối render thanh selection chỉ có nút "Cấp quyền" (`handleBulkGrant`). Action `createFromTemplate` chỉ được expose trong `DriveTreeTable.tsx:190` (menu `⋮` từng dòng), không có ở thanh bulk.

> Lưu ý kỹ thuật: `createFolderTree` của Apps Script tạo cây con bên trong **1 folder cha duy nhất** (`parentFolderId`). Vì vậy nút này chỉ hợp lý khi chọn **đúng 1 folder**; chọn nhiều → ẩn nút hoặc disable kèm tooltip.

### 3. SQL Verify
Không cần (thuần frontend).

### 4. Solution
1. Thêm prop `onCreateFromTemplate: (node: { id: string; name: string }) => void` vào `TreeDetailView`.
2. Trong thanh selection: khi `selectedIds.size === 1`, hiển thị thêm nút **"Tạo folder theo template"**. Lấy row tương ứng từ `currentTreeData` (đã có `id`, `name`) và gọi `onCreateFromTemplate`.
3. Khi `selectedIds.size > 1`: không hiển thị nút này (hoặc disable + tooltip "Chỉ chọn 1 folder để tạo từ template").
4. Trong `DriveManagerPage.tsx`: truyền `onCreateFromTemplate={(node) => setCreateFromTemplateNode(...)}` — tái dùng modal `CreateFromTemplateModal` sẵn có. Vì `createFromTemplateNode` đang kiểu `DriveTreeNode`, sẽ dựng node tối thiểu từ `currentTreeData` hoặc nới kiểu state để nhận `{ id, name }` (modal chỉ dùng `id` + `name`).

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/drive-manager/TreeDetailView.tsx` | Thêm prop + nút "Tạo folder theo template" trong thanh selection (chỉ khi chọn đúng 1 folder) |
| `src/pages/DriveManagerPage.tsx` | Truyền `onCreateFromTemplate` xuống `TreeDetailView`, mở `CreateFromTemplateModal` |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở 1 cây Drive → tick 1 folder → verify thanh dưới có cả "Cấp quyền" và "Tạo folder theo template".
2. Bấm "Tạo folder theo template" → `CreateFromTemplateModal` mở đúng folder đã chọn → tạo thành công.
3. Tick 2+ folder → verify nút bị ẩn/disable.
4. Build pass.

### 8. Notes
- Phụ thuộc gián tiếp: muốn tạo được folder từ template thì template phải lưu được (xem **BUG-039**). Nên fix BUG-039 trước hoặc cùng đợt.
- Rollback: revert 2 file.

---

## BUG-039: Không lưu được template Drive — DB còn cột `levels`, code dùng `root` + lỗi bị nuốt

- **Phát hiện**: 2026-06-27
- **Status**: `fixed` (2026-06-27) — ⚠️ **cần chạy tay migration `021_drive_templates_root.sql` trên Supabase**
- **Severity**: `high`

### 1. Mô tả bug
Trong **Drive Manager → Template**, mở editor tạo/sửa template, bấm **Lưu** không có tác dụng: template không được lưu, không có thông báo lỗi. Modal đứng im.

### 2. Root Cause
Lệch schema giữa code và DB:
- Code dùng cột **`root`** (cây nested `{ name, permissions, children }`):
  - `src/types/index.ts:478` — `DriveTemplate.root`
  - `src/hooks/queries/useDriveTemplates.ts:24` — `insert({ name, root, created_by })`
- DB bảng `drive_templates` (migration `020_drive_manager.sql:9`) chỉ có cột **`levels JSONB NOT NULL`**, **không có cột `root`**. (Đã xác nhận qua Supabase Table Editor: 6 cột `id, name, levels, created_by, created_at, updated_at`.)

→ `insert`/`update` cột `root` bị PostgREST từ chối (*column "root" does not exist*); thêm nữa `levels NOT NULL` không có giá trị cũng chặn insert.

Lỗi không hiển thị vì `handleCreateTemplate` / `handleUpdateTemplate` (`DriveManagerPage.tsx:224-239`) **không có try/catch** và được gọi qua `void` → promise rejection bị nuốt, không có toast.

### 3. SQL Verify
```sql
-- Xem cấu trúc cột hiện tại
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drive_templates';

-- Đếm số row đang có (kiểm tra trước khi đụng cột levels)
SELECT count(*) FROM public.drive_templates;
```

### 4. Solution
**Phần A — DB (chạy tay trong Supabase SQL Editor, theo KNOWLEDGE.md 1.2):**
Tạo migration mới `021_drive_templates_root.sql` và chạy tay:
```sql
ALTER TABLE public.drive_templates
  ADD COLUMN IF NOT EXISTS root JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Cột levels không còn được code dùng tới. Bỏ ràng buộc NOT NULL để an toàn;
-- nếu count(*) = 0 (hoặc dữ liệu cũ không cần giữ) có thể DROP hẳn.
ALTER TABLE public.drive_templates ALTER COLUMN levels DROP NOT NULL;
-- ALTER TABLE public.drive_templates DROP COLUMN levels;   -- tùy chọn, sau khi xác nhận không còn dữ liệu cần giữ
```

**Phần B — Frontend (bắt lỗi để không nuốt im lặng):**
Bọc try/catch + toast lỗi trong `handleCreateTemplate` và `handleUpdateTemplate` (`DriveManagerPage.tsx`), để mọi lỗi DB/RLS lần sau hiển thị rõ thay vì im lặng.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `webapp/supabase/migrations/021_drive_templates_root.sql` | **MỚI** — ADD COLUMN `root`, DROP NOT NULL `levels`. Chạy tay trong Supabase. |
| `src/pages/DriveManagerPage.tsx` | Thêm try/catch + `show(err.message, 'error')` cho `handleCreateTemplate` / `handleUpdateTemplate` |

### 6. Schema / SQL changes
Có — xem mục 4 phần A. **Bắt buộc chạy tay** trên Supabase production; file migration local không tự sync.

### 7. Test Plan
1. Chạy ALTER trong Supabase SQL Editor → verify cột `root` tồn tại.
2. Reload app → Template → "Thêm template" → điền tên + cây → Lưu → toast "Đã tạo template", template xuất hiện trong danh sách.
3. Sửa template đã có → Lưu → toast "Đã cập nhật template", thay đổi được lưu.
4. (Negative) Tạm thu hồi quyền/đổi tên cột để ép lỗi → verify giờ có toast báo lỗi thay vì im lặng.
5. Build pass.

### 8. Notes
- Sau khi lưu được template, nút ở **BUG-038** mới thực sự dùng được (cần có template để chọn).
- Cập nhật `020_drive_manager.sql` (hoặc ghi chú) cho khớp `root` để migration mới không lệch tài liệu.
- Rollback: DROP COLUMN `root` + revert `DriveManagerPage.tsx`. (Cẩn trọng nếu đã có template lưu vào `root`.)

---

## BUG-037: Dropdown "Quyền" (Google Drive Admin) sai chính tả "Ngườii" và thuật ngữ chưa khớp Google Drive

- **Phát hiện**: 2026-06-26
- **Status**: `fixed` (2026-06-26, trong **FEAT-031** — xem `PLAN-feature-dev.md`)
- **Severity**: `low`

> ⚠️ Fix typo này được thực hiện **như một phần của FEAT-031** (cấp quyền Drive linh hoạt), vì FEAT-031 viết lại toàn bộ `roleOptions`. Không fix riêng lẻ.

### 1. Mô tả bug
Trong trang **Google Drive Admin** (`/admin/google-drive`) → tab **Cấp quyền** (`SetPermissionsForm`), dropdown **"Quyền"** hiển thị 3 option bị **sai chính tả "Ngườii"** (thừa chữ *i*):
- "Ngườii xem (reader)"
- "Ngườii bình luận (commenter)"
- "Ngườii chỉnh sửa (writer)"

Ngoài lỗi chính tả, thuật ngữ chưa khớp với nhãn chuẩn tiếng Việt của Google Drive (reader = "Người xem", commenter = "Người nhận xét", writer/editor = "Người chỉnh sửa").

### 2. Root Cause
Hardcode trong biến `roleOptions` tại `src/components/apps-script/SetPermissionsForm.tsx:12-16`:
```ts
const roleOptions = [
  { value: 'reader', label: 'Ngườii xem (reader)' },
  { value: 'commenter', label: 'Ngườii bình luận (commenter)' },
  { value: 'writer', label: 'Ngườii chỉnh sửa (writer)' },
]
```
Lỗi typo "Ngườii" (lỗi gõ lặp lại trong dự án). Giá trị `value` (`reader`/`commenter`/`writer`) **đúng** và khớp với `SetPermissionsParams['role']` cũng như Apps Script backend — KHÔNG được đổi.

### 3. SQL Verify
Không cần.

### 4. Solution
Chỉ sửa phần `label` của `roleOptions`, giữ nguyên `value`:
```ts
const roleOptions = [
  { value: 'reader', label: 'Người xem (reader)' },
  { value: 'commenter', label: 'Người nhận xét (commenter)' },
  { value: 'writer', label: 'Người chỉnh sửa (writer)' },
]
```
- Sửa typo "Ngườii" → "Người" (cả 3 dòng).
- Đổi "bình luận" → "nhận xét" để khớp thuật ngữ Google Drive (commenter = "Người nhận xét").
- Giữ hậu tố tiếng Anh `(reader)`/`(commenter)`/`(writer)` để rõ nghĩa kỹ thuật (khớp role gửi lên Apps Script).

> ⚠️ **Phạm vi backend**: Apps Script `setPermissions` chỉ hỗ trợ 3 role này (`addViewer`/`addCommenter`/`addEditor`). Các role "Người đóng góp" / "Người quản lý nội dung" trong ảnh Google thuộc Shared Drive, không nằm trong phạm vi fix.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/apps-script/SetPermissionsForm.tsx` | Sửa `label` của 3 phần tử `roleOptions` (dòng 13-15) — fix typo + thuật ngữ |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở `/admin/google-drive` → tab "Cấp quyền".
2. Mở dropdown "Quyền" → verify 3 option hiển thị: "Người xem (reader)", "Người nhận xét (commenter)", "Người chỉnh sửa (writer)" — không còn "Ngườii".
3. Verify giá trị gửi lên (network/log `apps_script_logs`) vẫn là `reader`/`commenter`/`writer`.
4. Build pass.

### 8. Notes
- Đây là pure UI label fix, không ảnh hưởng logic. Rollback: revert 3 dòng label.
- **Cân nhắc cần xác nhận**: có giữ hậu tố tiếng Anh `(reader)`... hay bỏ để giống hệt Google Drive? Mặc định plan giữ hậu tố.

---

## BUG-036: Dashboard B2 chờ phản hồi chấp thuận không cập nhật khi active B2

- **Phát hiện**: 2026-06-19
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Từ Request Detail, chuyển request sang B2 (nhập ngày xác nhận). Sau khi thành công, quay về Dashboard, phần **"B2 chờ phản hồi chấp thuận"** không hiển thị request vừa chuyển. Phải F5 mới thấy.

### 2. Root Cause
`RequestDetailPage.tsx` sau action `confirmStep2Date` chỉ invalidate `['request', 'detail', id]` và `['requests']`, không invalidate `['dashboard', 'b2Requests']` — query dùng cho `B2PendingAlert` / `B2EligibleList` trong `DashboardPage.tsx`.

Tương tự, các action `handleConfirmChange` và `handleCancelRequest` trong RequestDetailPage cũng cần invalidate dashboard queries để Dashboard stats và B2 list đồng bộ.

### 3. SQL Verify
Không cần.

### 4. Solution
Trong `RequestDetailPage.tsx`, sau 3 action thay đổi status (`confirmStep2Date`, `handleConfirmChange`, `handleCancelRequest`), bổ sung invalidate:
- `['dashboard', 'b2Requests']`
- `['dashboard', 'stats']`
- `['dashboard', 'statusCounts']`

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/RequestDetailPage.tsx` | Sau mỗi action thay đổi status, invalidate dashboard queries |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Từ Request Detail của request B1, bấm "Chuyển sang B2" → nhập ngày xác nhận → Lưu.
2. Quay về Dashboard → verify request xuất hiện trong "B2 chờ phản hồi chấp thuận", không cần F5.
3. Từ Request Detail, hoàn tất hoặc hủy 1 request B2 → quay về Dashboard → verify request biến mất khỏi B2 pending/alert và stats cập nhật.
4. Build pass, tests pass.

### 8. Notes
- Không cần chờ Realtime; invalidate ngay sau mutation đảm bảo Dashboard đồng bộ.
- Rollback: Revert các dòng invalidate thêm.

---

## BUG-035: RequestsPage không tự cập nhật khi tạo / thay đổi request

- **Phát hiện**: 2026-06-19
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Sau khi tạo request mới từ `CreateRequestModal`, badge "Requests" trên sidebar tự động cập nhật (do FEAT-002 Realtime), nhưng khi navigate sang trang Requests, request mới không xuất hiện trong danh sách. Phải nhấn F5 mới thấy.

Tương tự, khi thay đổi status request trong `RequestDetailPage` (chuyển B2, hoàn tất, hủy), quay lại RequestsPage cũng có thể thấy status cũ.

### 2. Root Cause
1. `CreateRequestModal.tsx` sau khi insert request thành công chỉ gọi `onClose()`, không invalidate query `['requests']`.
2. `RequestDetailPage.tsx` sau các action thay đổi status chỉ invalidate `['request', 'detail', id]`, không invalidate `['requests']`.
3. `RequestsPage.tsx` subscribe Realtime chỉ khi đang mở. Khi user tạo/thay đổi request từ trang khác, subscription không active nên cache cũ vẫn còn.

### 3. SQL Verify
Không cần.

### 4. Solution
- Trong `CreateRequestModal.tsx`: sau insert thành công, invalidate `['requests']` và `['layout', 'requestCount']`.
- Trong `RequestDetailPage.tsx`: sau các action `confirmStep2Date`, `handleConfirmChange`, `handleCancelRequest`, invalidate thêm `['requests']`.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/CreateRequestModal.tsx` | Import `useQueryClient`, invalidate `['requests']` và `['layout', 'requestCount']` sau tạo request thành công |
| `src/pages/RequestDetailPage.tsx` | Sau các action thay đổi status, invalidate thêm `['requests']` |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Từ Agent Detail, tạo request mới → modal đóng → navigate sang RequestsPage → verify request mới hiện ngay, không cần F5.
2. Từ RequestsPage, mở 1 request đang B1 → chuyển sang B2 → quay lại RequestsPage → verify status cập nhật.
3. Hoàn tất / hủy 1 request trong RequestDetailPage → quay lại RequestsPage → verify status cập nhật.
4. Badge sidebar vẫn tự động cập nhật.
5. Build pass, tests pass.

### 8. Notes
- Không cần chờ Realtime event; invalidate ngay sau mutation đảm bảo UI đồng bộ.
- Rollback: Revert các dòng invalidate thêm.

---

## BUG-033: Agent Detail lưu thông tin không tự refresh, phải F5 mới thấy mới

- **Phát hiện**: 2026-06-19
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
Trang Agent Detail → tab "Thông tin Agent" → bấm "Sửa" → đổi cấp bậc (rank) → bấm "Lưu". UI chuyển về chế độ xem nhưng vẫn hiển thị rank cũ. Phải nhấn F5 refresh toàn bộ trang thì rank mới mới được hiển thị.

### 2. Root Cause
`AgentInfoTab.tsx` sau khi gọi `supabase.from('agents').update(...)` thành công chỉ gọi `setIsEditing(false)` để chuyển về view mode, nhưng **không invalidate cache** của query `['agent', 'detail', agentId]` đang được dùng ở `AgentDetailPage.tsx`. Vì `useAgentDetailQuery` có `staleTime` 5 phút, dữ liệu cũ vẫn được giữ lại. F5 mới buộc refetch.

Lưu ý: logic update `rank_name` đồng bộ theo `rank_id` (dòng 119-123) vẫn đúng — DB đã lưu giá trị mới.

### 3. SQL Verify
Không cần.

### 4. Solution
Dùng `useQueryClient` trong `AgentInfoTab.tsx`. Sau khi update DB thành công, invalidate:
- `['agent', 'detail', agent.id]` — buộc `AgentDetailPage` refetch và hiển thị rank mới ngay.
- `['agents']` — đảm bảo danh sách ở `AgentsPage` cũng cập nhật rank mới.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/agent-detail/AgentInfoTab.tsx` | Import `useQueryClient`, gọi `invalidateQueries` sau khi update thành công |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Vào Agent Detail của 1 agent có rank ASC.
2. Bấm Sửa → đổi rank sang CS → Lưu.
3. Verify: UI hiển thị rank "CS" ngay lập tức, không cần F5.
4. Quay lại AgentsPage → verify cột "Cấp bậc" của agent đó cũng hiển thị "CS".
5. Build pass. Tests pass.

### 8. Notes
- Rollback: Revert import `useQueryClient` và 2 dòng `invalidateQueries`.
- Có thể cân nhắc dùng `setQueryData` để optimistic update, nhưng `invalidateQueries` đơn giản và an toàn hơn.

---

## BUG-021: M1 Transition task không bị resolved khi agent hoàn tất chuyển T1

- **Phát hiện**: 2026-06-05
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Khi agent hoàn tất request chuyển T1 (ví dụ: Võ Phúc Thịnh - TV00091 chuyển từ Trần Vĩnh Phi Long sang Huỳnh Thanh Huy), các `m1_transition_tasks` cũ mà agent đó là M1 vẫn còn `status = 'pending'` và tiếp tục hiển thị trong Dashboard M1 Transition.

Ví dụ cụ thể:
- Võ Phúc Thịnh là M1 của Huỳnh Thanh Huy. Khi Huỳnh Thanh Huy chuyển line, hệ thống tạo task với `temp_t1_id = Trần Vĩnh Phi Long`.
- Sau đó Võ Phúc Thịnh hoàn tất request riêng để chuyển sang Huỳnh Thanh Huy (T1 mới chính thức).
- Task cũ vẫn còn `pending` → Dashboard vẫn hiển thị Võ Phúc Thịnh trong M1 Transition.

### 2. Root Cause
`completeRequestAction` trong `request-actions.ts` không xử lý các `m1_transition_tasks` có `m1_agent_id = request.agent_id`. Khi agent được gán `current_t1_id = proposed_new_t1_id`, các task transition cũ của agent đó (tạo ra khi T1 cũ của họ chuyển line) không được đánh dấu resolved.

### 3. SQL Verify
```sql
-- Tìm các M1 transition tasks của agent đã hoàn tất request
SELECT t.id, t.m1_agent_id, t.departed_agent_id, t.temp_t1_id, t.status, t.created_at
FROM m1_transition_tasks t
JOIN agents a ON a.id = t.m1_agent_id
JOIN t1_requests r ON r.agent_id = a.id AND r.status = 'completed'
WHERE t.status IN ('pending', 'expired')
ORDER BY t.created_at DESC;
```

### 4. Solution
Trong `completeRequestAction`, sau khi update `agents.current_t1_id` cho agent (bước 3), thêm bước resolve các task cũ:

```ts
// Resolve any pending/expired M1 transition tasks for this agent
// since they now have an official new T1
await supabase
  .from('m1_transition_tasks')
  .update({ status: 'm1_changed', resolved_at: now })
  .eq('m1_agent_id', request.agent_id)
  .in('status', ['pending', 'expired'])
```

Lý do update thành `m1_changed` thay vì xóa:
- Giữ audit trail trong DB.
- `m1_changed` là giá trị hợp lệ theo DB constraint `CHECK (status IN ('pending', 't2_assigned', 'm1_changed', 'expired'))`.
- `useM1TransitionsQuery` chỉ query `status IN ('pending', 'expired')` → task `m1_changed` tự động biến mất khỏi Dashboard.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/lib/request-actions.ts` | Thêm bước resolve `m1_transition_tasks` có `m1_agent_id = request.agent_id` sau khi update agent |

### 6. Schema / SQL changes
Không cần. Cột `resolved_at` đã tồn tại trong `m1_transition_tasks`.

### 7. Test Plan
1. Tạo scenario: Agent A là M1 của T1 X. T1 X chuyển line → A xuất hiện trong M1 Transition.
2. Agent A tạo request chuyển T1 sang T1 Y → hoàn tất request.
3. Verify: Agent A biến mất khỏi Dashboard M1 Transition (task cũ được update `status = 'resolved'`).
4. Verify trong DB: `SELECT * FROM m1_transition_tasks WHERE m1_agent_id = A.id` → `status = 'm1_changed'`, `resolved_at IS NOT NULL`.

### 8. Notes
- Không ảnh hưởng đến các task mới tạo trong cùng `completeRequestAction` (bước 5) vì task mới có `m1_agent_id` là M1 của agent hoàn tất, không phải chính agent đó.
- Rollback: Revert `request-actions.ts`, chạy SQL update các task `m1_changed` về `pending`.

---

---


## BUG-022: B2PendingAlert không hiển thị do addBusinessDays parse ISO datetime sai

- **Phát hiện**: 2026-06-11
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Request đang ở B2 (`status = 'step2'`, `step2_confirmed_at` có giá trị) nhưng không hiển thị trong Dashboard section **"B2 chờ phản hồi chấp thuận"** (`B2PendingAlert`). Component hoàn toàn biến mất khỏi Dashboard (return null) vì request không rơi vào `b2Pending`, `b2Alert`, hay `b2Eligible` nào.

### 2. Root Cause
`addBusinessDays()` trong `src/lib/eligibility.ts` parse `startDateStr` bằng cách split theo dấu `-`:
```ts
const [y, m, d] = startDateStr.split('-').map(Number)
```

Khi nhận ISO datetime string từ Supabase (ví dụ: `"2026-06-10T10:00:00+00:00"`):
- `d = Number("10T10:00:00+00:00")` = **NaN**
- `new Date(2026, 5, NaN)` = **Invalid Date**
- `isBusinessDay("NaN-NaN-NaN", holidays)` = true (vì `getDay()` của Invalid Date = NaN, không phải 0/6)
- Loop chạy 3 lần, `remaining` giảm về 0, function trả về **Invalid Date**

Trong `DashboardPage.tsx`:
```ts
const b2Pending = b2Requests.filter((r) => today <= r.deadline3)
// Invalid Date <= valid Date → false (theo JS spec)
```

→ Request bị "nuốt" — không vào `b2Pending`, `b2Alert`, hay `b2Eligible`.

### 3. SQL Verify
```sql
-- Tìm requests ở B2 đã xác nhận
SELECT id, agent_id, step2_confirmed_at, status
FROM t1_requests
WHERE status = 'step2' AND step2_confirmed_at IS NOT NULL
ORDER BY step2_confirmed_at DESC;
```

### 4. Solution
Sửa `addBusinessDays` để cắt lấy phần date (`YYYY-MM-DD`) trước khi parse:
```ts
const dateOnly = startDateStr.slice(0, 10)
const [y, m, d] = dateOnly.split('-').map(Number)
```

Fix tại `addBusinessDays` thay vì từng chỗ gọi vì:
- Bảo vệ tất cả callers: `useB2RequestsQuery`, `RequestDetailPage`, v.v.
- `addBusinessDays` không nên giả định input luôn là `YYYY-MM-DD`

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/lib/eligibility.ts` | `addBusinessDays`: thêm `startDateStr.slice(0, 10)` trước khi split |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Trong Supabase SQL Editor, kiểm tra `addBusinessDays` với ISO datetime string:
   ```sql
   -- Không cần, fix ở frontend
   ```
2. Chạy `npm run test` — verify 26 tests eligibility vẫn pass
3. Trên dev server (localhost:5174), verify request B2 đã xác nhận hiển thị trong Dashboard
4. Kiểm tra `RequestDetailPage` — deadline B2 vẫn tính đúng

### 8. Notes
- `eligibility.test.ts` có test `addBusinessDays` nhưng chỉ dùng `YYYY-MM-DD` string. Cần thêm test case với ISO datetime string để regression-proof.
- Rollback: Revert 1 dòng trong `eligibility.ts`.

---

## BUG-023: Dropdown placeholder trong HtmlEditor bị cắt và không scroll được

- **Phát hiện**: 2026-06-11
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
Trong modal chỉnh sửa mẫu email (`TemplateEditModal`), khi bấm dropdown "Chèn placeholder", danh sách 14 placeholders bị cắt ngang bởi container `HtmlEditor` và không thể scroll. Phần dưới của dropdown biến mất, user không thể chọn các placeholder ở cuối danh sách.

### 2. Root Cause
1. Container ngoài cùng của `HtmlEditor` có class `overflow-hidden`, tạo một clipping boundary. Dropdown menu dùng `absolute` positioning nhưng vẫn bị cắt khi vượt ra ngoài container cha.
2. Dropdown menu không có `max-height` hay `overflow-y-auto`, nên khi có 14 items nó tràn dài xuống dưới và bị `overflow-hidden` cắt bỏ.

### 3. SQL Verify
Không cần.

### 4. Solution
1. Bỏ `overflow-hidden` ở container ngoài cùng của `HtmlEditor` để dropdown không bị clip.
2. Thêm `overflow-hidden rounded-md` vào div editor area (phần `style={{ height }}`) để vẫn giữ góc bo tròn cho khung soạn thảo.
3. Thêm `max-h-60 overflow-y-auto` vào dropdown menu để nó tự cuộn khi danh sách dài, tránh tràn ra ngoài modal.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/HtmlEditor.tsx` | Bỏ `overflow-hidden` container ngoài; thêm `overflow-hidden rounded-md` vào editor area; thêm `max-h-60 overflow-y-auto` vào dropdown menu |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở modal chỉnh sửa mẫu email (`TemplateEditModal`).
2. Bấm dropdown "Chèn placeholder".
3. Verify: dropdown hiển thị đầy đủ, có thanh scroll nếu danh sách dài, không bị cắt bởi container.
4. Verify: có thể click chọn placeholder ở cuối danh sách (ví dụ: `{{b3Deadline}}`).
5. Build pass.

### 8. Notes
- Rollback: Revert 3 dòng trong `HtmlEditor.tsx`.


---

## BUG-024: Placeholder `{{tempT1Name}}` bị trùng giá trị với `{{oldT1Name}}`

- **Phát hiện**: 2026-06-11
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Placeholder `{{tempT1Name}}` và `{{tempT1StaffId}}` trong email template đang render cùng giá trị với `{{oldT1Name}}` / `{{oldT1StaffId}}`. Ví dụ: nếu T1 cũ là "Trần Văn B", thì cả `{{oldT1Name}}` và `{{tempT1Name}}` đều ra "Trần Văn B", dù trong DB `temp_t1_id` là một ngườii khác.

### 2. Root Cause
1. `ComposeTemplateModal.tsx` — `loadData()` không select `temp_t1_id` từ `t1_requests`, nên không có dữ liệu T1 tạm. Code "fallback" map `{{tempT1Name}}` → `t1Old?.full_name`.
2. `SendEmailModal.tsx` — thiếu prop `tempT1`, `previewData['{{tempT1Name}}']` cũng dùng `t1Old?.full_name`.
3. UI hiển thị email liên quan cũng gán `T1 tạm` = `t1Old?.email`.

### 3. SQL Verify
```sql
-- Kiểm tra request có temp_t1_id khác old_t1_id
SELECT id, agent_id, old_t1_id, temp_t1_id, proposed_new_t1_id
FROM t1_requests
WHERE temp_t1_id IS NOT NULL AND old_t1_id IS NOT NULL
  AND temp_t1_id != old_t1_id;
```

### 4. Solution
1. Trong `ComposeTemplateModal.tsx`:
   - Select thêm `temp_t1_id` từ `t1_requests`
   - Load agent tạm từ `temp_t1_id`
   - Sửa replace `{{tempT1Name}}` / `{{tempT1StaffId}}` dùng `tempT1`
   - Sửa UI email liên quan: `T1 tạm` hiển thị `tempT1?.email`
   - Truyền `tempT1` xuống `SendEmailModal`
2. Trong `SendEmailModal.tsx`:
   - Thêm prop `tempT1: Agent | null`
   - Thêm `{{tempT1StaffId}}` vào danh sách placeholder
   - Sửa `previewData` dùng `tempT1?.full_name` / `tempT1?.staff_id`

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Load `tempT1`, sửa replace + UI |
| `src/components/SendEmailModal.tsx` | Thêm prop `tempT1`, sửa previewData + placeholders |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Tạo request có `temp_t1_id` khác `old_t1_id`.
2. Mở `ComposeTemplateModal`, chọn template có `{{tempT1Name}}` và `{{oldT1Name}}`.
3. Verify: hai placeholder render tên khác nhau.
4. Verify UI email liên quan: T1 cũ và T1 tạm hiển thị email khác nhau.
5. Build pass.

### 8. Notes
- Rollback: Revert 4 file.

---

## BUG-025: ComposeTemplateModal load sai T1 cũ / Temp T1 / New T1

- **Phát hiện**: 2026-06-11
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Khi mở `ComposeTemplateModal` từ Dashboard M1 Transition:
- `{{oldT1Name}}` hiển thị tên của Temp T1 thay vì T1 cũ
- `{{newT1Name}}` không hiển thị giá trị
- `{{tempT1Name}}` không hiển thị giá trị

### 2. Root Cause
1. `t1Old` load từ `agent.current_t1_id` — sai khi agent đã bị cập nhật T1 trong DB (có thể thành tempT1 hoặc newT1).
2. `tempT1` load từ `request.temp_t1_id` — sai khi M1 Transition chứa `temp_t1_id` riêng trong `m1_transition_tasks`, request có thể không có hoặc khác.
3. `newT1` query `t1_requests` với `.not('status', 'in', "('completed','cancelled')")` — nên không tìm thấy request khi đã hoàn tất.

### 3. SQL Verify
```sql
-- Kiểm tra M1 transition task có temp_t1_id và departed_agent_id
SELECT id, m1_agent_id, temp_t1_id, departed_agent_id, parent_request_id
FROM m1_transition_tasks
WHERE status IN ('pending', 'expired')
LIMIT 5;
```

### 4. Solution
Refactor `loadData()` thành 2 nhánh:
- **Có `m1TaskId`:** load trực tiếp từ `m1_transition_tasks`:
  - `t1Old` ← `task.departed_agent_id`
  - `tempT1` ← `task.temp_t1_id`
  - `newT1` ← `task.parent_request_id → proposed_new_t1_id`
- **Không có `m1TaskId`:** load từ `t1_requests` active:
  - `t1Old` ← `request.old_t1_id` (sửa từ `agent.current_t1_id`)
  - `newT1` ← `request.proposed_new_t1_id`
  - `tempT1` ← `request.temp_t1_id`

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Refactor `loadData()` thành 2 nhánh: M1 task vs request active |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở Dashboard M1 Transition, bấm gửi email cho 1 task.
2. Verify: T1 cũ, T1 tạm, T1 mới hiển thị đúng tên trong template.
3. Verify: Email liên quan hiển thị đúng email của 3 ngườii.
4. Mở từ AgentsPage, verify vẫn hoạt động đúng.
5. Build pass. 56/56 tests pass.

### 8. Notes
- Rollback: Revert `ComposeTemplateModal.tsx`.

---

---

## BUG-030: ComposeTemplateModal tự đóng khi chọn loại mẫu do AgentsPage dựa vào selection

- **Phát hiện**: 2026-06-12
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Sau khi thay native `<select>` bằng custom `Select` (BUG-028), lỗi modal tự đóng khi chọn loại mẫu vẫn còn.

### 2. Root Cause
Vấn đề nằm ở `AgentsPage.tsx`, không phải trong `ComposeTemplateModal`:
1. `useTableSelection` lắng nghe click outside table để clear selection.
2. Khi modal mở, bất kỳ click nào trong modal (dropdown option, copy button, v.v.) đều nằm ngoài `tableRef` → selection bị clear.
3. `useEffect` ở dòng 94-98 thấy `selected.length !== 1` → gọi `setShowCompose(false)` → modal đóng.
4. Modal render condition `{showCompose && selected.length === 1 && (...)}` cũng phụ thuộc vào selection.

### 3. SQL Verify
Không cần.

### 4. Solution
Tách trạng thái modal khỏi selection:
1. Thêm state `composeAgentId: string | null`.
2. Tạo `openCompose(agentId)` lưu agentId và mở modal.
3. Tạo `closeCompose()` đóng modal và reset agentId.
4. Sửa 2 nút "Soạn mẫu" (header + BulkActionsBar) gọi `openCompose(selected[0])`.
5. Render modal: `{showCompose && composeAgentId && <ComposeTemplateModal agentId={composeAgentId} onClose={closeCompose} />}`.
6. Bỏ `useEffect` tự động đóng modal.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/AgentsPage.tsx` | Thêm `composeAgentId`, `openCompose`, `closeCompose`, bỏ useEffect, sửa render condition và 2 nút "Soạn mẫu" |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Vào Agents → chọn 1 agent → bấm "Soạn mẫu".
2. Modal mở → bấm dropdown "Chọn loại mẫu" → chọn option.
3. Verify modal không tự đóng, nội dung cập nhật đúng.
4. Bấm "Copy nội dung" / "Copy email" → modal vẫn không đóng.
5. Bấm X hoặc backdrop → modal đóng.
6. Chọn 2 agents → verify nút "Soạn mẫu" bị disable.

### 8. Notes
- **Ưu điểm:** Modal hoạt động độc lập với selection, không bị ảnh hưởng bởi click-outside của table.
- **Nhược điểm:** Cần thêm 1 state, nhưng logic rõ ràng hơn.
- **Rủi ro:** Nếu có chỗ khác cũng dùng `showCompose` thì cần cập nhật. Mitigation: chỉ sửa trong `AgentsPage`.

---

---

## BUG-028: ComposeTemplateModal dropdown chọn loại mẫu tự đóng modal

- **Phát hiện**: 2026-06-12
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Trong trang **Agents**, chọn 1 agent → bấm **"Soạn mẫu"** → modal **"Soạn mẫu thông báo"** mở. Khi bấm vào dropdown **"Chọn loại mẫu"** để chọn loại mẫu khác, dropdown mở ra nhưng không chọn được option, đồng thờii modal tự động đóng lại.

### 2. Root Cause
- `ComposeTemplateModal` đang dùng native HTML `<select>` (dòng 307-310).
- Native `<select>` dropdown được vẽ bởi browser ở layer riêng, nhưng khi click option trong một modal portal với backdrop `onClick={onClose}`, sự kiện click có thể bị nhận diện thành click ra ngoài modal panel → backdrop trigger `onClose`.
- Ngoài ra native select dễ bị clip bởi `overflow-y-auto` của modal content (`max-h-[92vh] overflow-y-auto`).

### 3. SQL Verify
Không cần.

### 4. Solution
Thay native `<select>` bằng custom `Select` component (`src/ui/input/Select.tsx`) đã có trong project:
- Custom Select render dropdown bằng DOM element nằm trong cùng modal tree, click option không bị nhầm thành click backdrop.
- Truyền `options` là mảng `{ value: t.key, label: t.name }` từ `templates` state.
- Giữ `value={selectedKey}` và `onChange={(e) => setSelectedKey(e.target.value)}`.
- Có thể cần wrapper `div` với `className="relative z-10"` để dropdown không bị clip (tùy test).

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Thay `<select>` native bằng `<Select>` từ `src/ui/input/Select.tsx` |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Vào Agents → chọn 1 agent → bấm "Soạn mẫu".
2. Bấm dropdown "Chọn loại mẫu" → dropdown mở, modal không tự tắt.
3. Chọn 1 option khác → dropdown đóng, nội dung đã soạn cập nhật theo mẫu mới.
4. Bấm ra ngoài dropdown (trên backdrop) → modal mới đóng.
5. Test trên Chrome/Firefox/Edge.

### 8. Notes
- **Ưu điểm:** Giải quyết triệt để vấn đề click-outside của native select trong portal modal; UI đồng nhất với design system.
- **Nhược điểm:** Cần import thêm component, style có thể khác native select một chút.
- **Rủi ro:** Custom Select dropdown vẫn có thể bị clip nếu modal ancestor có `overflow-hidden`. Mitigation: dùng `z-50` (đã có sẵn trong Select) hoặc điều chỉnh modal content nếu cần.

---

---

## BUG-029: ComposeTemplateModal không hiển thị mẫu email mới / vẫn hiển thị mẫu đã xóa

- **Phát hiện**: 2026-06-12
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
- User xóa mẫu email cũ trong trang **Quản lý mẫu email**.
- Sau đó tạo mẫu email mới với `template_key` khác (ví dụ `c_a_t1`).
- Quay lại modal **"Soạn mẫu thông báo"** trong Agents, dropdown "Chọn loại mẫu" vẫn hiển thị các mẫu default cũ, không có mẫu mới.

### 2. Root Cause
Hàm `loadTemplates()` trong `ComposeTemplateModal.tsx` (dòng 75-88) có logic sai:
```ts
setTemplates((prev) =>
  prev.map((pt) => {
    const db = dbMap.get(pt.key)
    if (db) return { ...pt, subject: db.subject, body: db.body }
    return pt
  })
)
```
- `prev` là `defaultTemplates` (3 mẫu hardcode).
- Code chỉ override subject/body nếu DB có template với cùng `template_key`.
- Mẫu mới có key khác không bao giờ được thêm vào danh sách.
- Mẫu default đã xóa vẫn còn trong UI vì `prev.map` không remove.

### 3. SQL Verify
```sql
-- Kiểm tra templates hiện có trong DB
SELECT id, template_key, name, subject FROM public.email_templates;
```

### 4. Solution
Viết lại `loadTemplates` để ưu tiên dữ liệu DB:
```ts
async function loadTemplates() {
  const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true })
  if (error) {
    console.error('Lỗi load templates:', error)
    return
  }
  if (data && data.length > 0) {
    setTemplates(
      (data as EmailTemplate[]).map((t) => ({
        key: t.template_key,
        name: t.name,
        subject: t.subject,
        body: t.body,
      }))
    )
  } else {
    setTemplates(defaultTemplates)
  }
}
```
- Nếu DB có templates → dùng DB.
- Nếu DB rỗng → fallback về `defaultTemplates`.
- Không còn hardcode merge.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Sửa `loadTemplates()` ưu tiên DB, fallback default |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Xóa hết templates trong DB → mở ComposeTemplateModal → dropdown hiển thị 3 default templates.
2. Tạo mẫu mới `c_a_t1` → mở ComposeTemplateModal → dropdown hiển thị mẫu mới.
3. Xóa 1 trong 3 default templates → mở ComposeTemplateModal → template đã xóa không còn trong dropdown.
4. Chọn mẫu mới → nội dung đã soạn render đúng subject/body từ DB.

### 8. Notes
- **Ưu điểm:** Dữ liệu trong modal luôn đồng bộ với DB; user tự quản lý templates qua EmailTemplatesPage.
- **Nhược điểm:** Nếu DB rỗng, vẫn cần giữ 3 default templates để app không bị trống.
- **Rủi ro:** Nếu có code khác phụ thuộc vào 3 key default (`transfer_complete`, `30_days_notice`, `temp_t1_assigned`) thì vẫn an toàn vì DB có thể chứa các key này hoặc fallback. Mitigation: đảm bảo default templates vẫn được insert khi migration chạy (đã có trong `001_initial_schema.sql`).

---

## BUG-026: ComposeTemplateModal query `t1_requests` bị 400 Bad Request do cú pháp `.not('status', 'in', ...)` sai

- **Phát hiện**: 2026-06-11
- **Status**: `fixed`
- **Severity**: `critical`

### 1. Mô tả bug
Khi mở `ComposeTemplateModal` từ B2 list, tất cả email T1 mới / T1 cũ / T1 tạm đều hiển thị "—". Console log hiển thị lỗi `400 Bad Request` từ Supabase REST API.

### 2. Root Cause
Cú pháp filter status trong Supabase JS client sai:
```ts
.not('status', 'in', "('completed','cancelled')")  // ❌ Sai
```
Supabase REST API yêu cầu dấu nháy kép bên trong:
```ts
.not('status', 'in', '("completed","cancelled")')  // ✅ Đúng
```

### 3. SQL Verify
Không cần.

### 4. Solution
Sửa 1 dòng trong `ComposeTemplateModal.tsx` dòng 149.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Sửa cú pháp `.not('status', 'in', ...)` |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở B2 list, bấm "Tạo email mẫu".
2. Verify: Console không còn lỗi 400.
3. Verify: T1 cũ, T1 mới hiển thị đúng email.
4. Build pass. 56/56 tests pass.

### 8. Notes
- Rollback: Revert 1 dòng.

---

## BUG-027: ComposeTemplateModal lấy nhầm request khi agent có nhiều request

- **Phát hiện**: 2026-06-11
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Khi mở `ComposeTemplateModal` từ B2 list, T1 cũ và T1 mới đều hiển thị "—". Root cause: agent có nhiều request, `ComposeTemplateModal` query theo `agent_id` + `limit(1)` lấy nhầm request mới nhất (chưa có `old_t1_id` / `proposed_new_t1_id`) thay vì request đang ở B2.

### 2. Root Cause
Modal chỉ nhận `agentId`, tự đoán request bằng cách lấy request active mới nhất. Không đảm bảo lấy đúng request mà user đang xem trong B2 list.

### 3. SQL Verify
```sql
-- Kiểm tra agent có nhiều request
SELECT agent_id, status, created_at, old_t1_id, proposed_new_t1_id
FROM t1_requests
WHERE agent_id = '<agent-id>'
ORDER BY created_at DESC;
```

### 4. Solution
Truyền `requestId` từ caller xuống modal:
1. `ComposeTemplateModal`: thêm prop `requestId`, load request trực tiếp bằng `eq('id', requestId)`
2. `B2EligibleList`: sửa `onEmail` truyền thêm `requestId`
3. `DashboardPage`: lưu `requestId` trong state, truyền xuống modal

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Thêm prop `requestId`, sửa `loadData()` |
| `src/components/dashboard/B2EligibleList.tsx` | Sửa `onEmail` signature, truyền `requestId` |
| `src/pages/DashboardPage.tsx` | Lưu `requestId` trong state, truyền xuống modal |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Tạo agent có 2 request: 1 pending (chưa có T1) + 1 step2 (có T1 cũ/mới).
2. Mở B2 list, bấm "Tạo email mẫu".
3. Verify: T1 cũ và T1 mới hiển thị đúng từ request step2.
4. Build pass. 56/56 tests pass.

### 8. Notes
- Rollback: Revert 3 file.
