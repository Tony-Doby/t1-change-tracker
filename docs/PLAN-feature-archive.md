# Feature Archive — T1 Change Tracker

> File này lưu trữ các feature plan đã hoàn thành (`done`) hoặc bị hủy (`cancelled`).
> File chính: `PLAN-feature-dev.md` chỉ chứa các feature đang active.
> **ĐỪNG SỬA** file này — chỉ để tham khảo lịch sử.

---

## FEAT-001: Tích hợp gửi email thật (Resend + HTML editor)

- **Đề xuất**: 2026-05-28
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-05-29

### Current Status (as of 2026-05-29)

**Đã làm:**
- `supabase/migrations/014_email_logs.sql` — Bảng `email_logs` + `cc_emails` (jsonb) + indexes + RLS.
- `supabase/functions/send-email/index.ts` — Edge Function gọi Resend API, lưu log, xử lý CORS.
- `src/types/index.ts` — Thêm interface `EmailLog` với `cc_emails`.
- `src/components/HtmlEditor.tsx` — **Mới** — Editor 3 tabs: Visual (contentEditable + toolbar), Code (HTML raw), Preview (rendered with dynamic values). Hỗ trợ bold, italic, underline, link, text color, align, undo, chèn placeholder dropdown. Tự động convert plain text → HTML (\n\n → `<p>`, \n → `<br>`).
- `src/components/SendEmailModal.tsx` — **Mới** — Popup gửi email: To (editable), CC (dynamic list thêm/xóa), Subject (readonly rendered), Body (HtmlEditor preview mode), nút Gửi gọi Edge Function.
- `src/components/ComposeTemplateModal.tsx` — Thêm nút [Gửi email] mở `SendEmailModal`. Giữ nguyên Copy nội dung + Copy email.
- `src/pages/EmailTemplatesPage.tsx` — Thay textarea plain text bằng `HtmlEditor`, preview modal render HTML thay vì `whitespace-pre-wrap`.

**Chưa làm / Chờ IT:**
- Verify domain `myera.com.vn` với Resend (cần IT thêm DNS records SPF/DKIM/DMARC).
- Trong lúc chờ: dùng `onboarding@resend.dev` để test, sau đó đổi `from` thành `opt@myera.com.vn`.
- Cần chạy migration `014_email_logs.sql` trên DB production.
- Cần deploy Edge Function lên Supabase.

### 1. Mô tả feature
Gửi email trực tiếp từ app qua Resend, sử dụng mẫu email HTML có sẵn với dynamic values (`{{agentName}}`, `{{staffId}}`, v.v.). Ngườii dùng có thể soạn email HTML trong `EmailTemplatesPage` (3 chế độ: Visual, Code, Preview) và gửi từ `ComposeTemplateModal` với khả năng thêm CC.

### 2. Motivation / Why
- Giảm thao tác thủ công (không cần copy ra Gmail/Outlook).
- Email gửi từ `opt@myera.com.vn` — chuyên nghiệp, đồng bộ thương hiệu.
- Lưu lịch sử gửi email để audit.
- Hỗ trợ HTML: format đẹp, link clickable, màu sắc.

### 3. Scope

**In scope:**
- Resend qua Supabase Edge Function.
- From: `opt@myera.com.vn` (sau khi verify domain) hoặc `onboarding@resend.dev` (test).
- HTML editor 3 tabs trong `EmailTemplatesPage`.
- SendEmailModal với To, CC nhiều ngườii, Subject rendered, Body preview.
- Lưu log vào `email_logs` (bao gồm `cc_emails`).

**Out of scope:**
- Gửi hàng loạt / bulk email (backlog sau).
- Queue/retry mechanism.
- Attachment gửi kèm.
- Email scheduling.

### 4. Technical Design
**Supabase Edge Function:**
- Nhận payload: `to`, `cc[]`, `from`, `subject`, `html`, `template_key`, `agent_id`.
- Gọi `https://api.resend.com/emails` bằng `fetch`.
- Sau khi gửi: insert log vào `email_logs` qua `service_role` key.
- Lấy `sent_by` từ JWT token trong request header.

**HtmlEditor:**
- Visual mode: `contentEditable` div + `document.execCommand` cho formatting.
- Code mode: `<textarea>` hiển thị HTML raw.
- Preview mode: `dangerouslySetInnerHTML` với placeholders replaced.
- Auto-convert plain text → HTML khi load để backward-compatible với templates cũ.

### 5. UI/UX
- `EmailTemplatesPage`: Soạn mẫu bằng HtmlEditor, placeholder dropdown trong toolbar, preview render HTML.
- `ComposeTemplateModal`: [Copy nội dung] [Copy email] [Gửi email]. Nút Gửi disabled nếu agent không có email.
- `SendEmailModal`: To (default = agent.email), CC (thêm/xóa từng dòng), Subject auto-rendered, Body preview HTML, [Gửi] có loading spinner.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/functions/send-email/index.ts` | **Mới** — Edge Function gọi Resend + lưu log |
| `supabase/migrations/014_email_logs.sql` | **Mới** — Bảng `email_logs` với `cc_emails` jsonb |
| `src/types/index.ts` | Thêm `EmailLog` interface |
| `src/components/HtmlEditor.tsx` | **Mới** — 3-tabs HTML editor |
| `src/components/SendEmailModal.tsx` | **Mới** — Popup gửi email với CC |
| `src/components/ComposeTemplateModal.tsx` | Thêm nút [Gửi email], import SendEmailModal |
| `src/pages/EmailTemplatesPage.tsx` | Thay textarea → HtmlEditor, preview render HTML |

### 7. Schema / SQL changes
```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  recipient_email text NOT NULL,
  cc_emails jsonb DEFAULT '[]',
  recipient_agent_id uuid REFERENCES agents(id),
  template_key text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message text
);

CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_agent_id, sent_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated to read email_logs"
  ON public.email_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated to insert email_logs"
  ON public.email_logs FOR INSERT TO authenticated WITH CHECK (true);
```

### 8. API / Integration changes
- Edge Function: `POST /functions/v1/send-email`
- Secret: `RESEND_API_KEY` trong Supabase Dashboard → Edge Functions → Secrets
- Secret: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (cho insert log)

### 9. Test Plan
1. Chạy migration `014_email_logs.sql` trên Supabase SQL Editor.
2. Deploy Edge Function: `supabase functions deploy send-email`.
3. Thêm `RESEND_API_KEY` vào Supabase Secrets.
4. Mở EmailTemplatesPage → soạn mẫu HTML → Lưu.
5. Mở ComposeTemplateModal → bấm [Gửi email].
6. Điền To + CC → bấm Gửi.
7. Verify email đến hộp thư (check spam nếu dùng `onboarding@resend.dev`).
8. Verify `email_logs` có row mới với `status = 'sent'` và `cc_emails` đúng.
9. Test lỗi: sai API key → `status = 'failed'`, có `error_message`.

### 10. Rollout Plan
1. Chạy migration SQL trên Supabase.
2. Deploy Edge Function.
3. Config `RESEND_API_KEY` trong Secrets.
4. Test với `onboarding@resend.dev`.
5. Khi IT verify domain `myera.com.vn` xong: đổi `from` trong `SendEmailModal` thành `opt@myera.com.vn`.
6. Build + deploy frontend.

### 11. Notes
- **Domain verify:** `opt@myera.com.vn` cần verify DNS trước khi dùng production. Dùng `onboarding@resend.dev` để dev/test.
- **Rate limit:** Resend free = 3.000 emails/tháng.
- **Plain text → HTML:** Templates cũ (plain text) sẽ tự động convert khi load vào HtmlEditor lần đầu. Sau khi lưu lại sẽ thành HTML.
- **CC format:** `cc_emails` lưu dạng JSON array trong DB, hiển thị là string array trong TypeScript.
- **2026-05-29**: Thêm placeholder `{{oldT1StaffId}}` và `{{tempT1StaffId}}` vào `ComposeTemplateModal` (replace bằng `t1Old?.staff_id`).

---

---

## FEAT-020: Excel Generator Enhancements — Inline Field Reference + Uppercase + Chọn ngày generate

- **Đề xuất**: 2026-06-03
- **Status**: `done`
- **Priority**: `high`
- **Hoàn thành**: 2026-06-04

### 1. Mô tả feature
Nâng cấp Excel Generator (FEAT-019) để hỗ trợ:
1. **Inline Field Reference**: Syntax `{{Tên Field}}` trong cell template để kết hợp data động + expression `(R.num)`, `(dd/mm/yyyy)` + text cố định trong cùng 1 cell.
2. **Uppercase Toggle**: Checkbox "VIẾT HOA" cho từng field mapping. Nếu tick → giá trị được `.toUpperCase()` trước khi chèn vào cell.
3. **Chọn ngày generate**: Input date picker trong tab Generate. User chọn ngày cụ thể → expression parser `(dd)`, `(mm)`, `(yy)`... sẽ dùng ngày này thay vì `new Date()`.

### 2. Motivation / Why
- User cần viết cell dạng: `{{Họ và tên}} - (ddmmyy)(R.num)` → `Trần Lê Toàn Hữu - 03062607`
- User cần viết hoa toàn bộ 1 trường (ví dụ: tên công ty, chức danh)
- User cần generate file với ngày cụ thể (ví dụ: backdate hợp đồng ngày 15/03/2026)

### 3. Scope

**In scope:**
- Regex `{{([^}]+)}}` để detect inline field reference
- Hàm `replaceFieldReferences()` trong `excel-generator.ts`
- Luồng xử lý cell mới: (1) Evaluate expression → (2) Replace `{{Field}}` → (3) Uppercase nếu có
- Thêm `uppercase?: boolean` vào `FieldMappingValue` interface
- Checkbox VIẾT HOA trong TemplateUploadModal và GeneratePanel mapping panel
- Input `type="date"` trong GeneratePanel để chọn ngày generate
- Truyền `baseDate` param từ GeneratePanel xuống `buildPreview()` và `generateWorkbook()`

**Out of scope:**
- Thay đổi schema DB (không cần thêm cột, `column_mapping` JSONB đã đủ)
- Thay đổi cách detect field từ export template

### 4. Technical Design

**Inline Field Reference:**
```typescript
const FIELD_REF_REGEX = /{{([^}]+)}}/g

function replaceFieldReferences(
  cellValue: string,
  dataRow: Record<string, string>,
  mapping: ColumnMapping
): string {
  return cellValue.replace(FIELD_REF_REGEX, (_match, fieldName) => {
    const mapped = mapping[fieldName.trim()]
    if (!mapped) return _match
    if (mapped.type === 'column') {
      return dataRow[mapped.value] !== undefined ? dataRow[mapped.value] : _match
    }
    return mapped.value
  })
}
```

**Luồng xử lý 1 cell trong `generateWorkbook`:**
```
Cell template: "{{Họ và tên}} - (ddmmyy)(R.num)"
↓
1. replaceExpressionsInCell → "{{Họ và tên}} - 03062607"
2. replaceFieldReferences  → "Trần Lê Toàn Hữu - 03062607"
3. uppercase nếu mapped.uppercase === true
```

**Uppercase:**
- UI: Thêm `<input type="checkbox">` VIẾT HOA trong mỗi row mapping
- Data: `{ type: 'column', value: 'Họ và tên', uppercase: true }`
- Logic: `if (mapped?.uppercase && value) value = value.toUpperCase()`

**Chọn ngày generate:**
- State `generateDate: Date` trong GeneratePanel (default = new Date())
- Input date picker hiển thị format `dd/mm/yyyy`
- Truyền `generateDate` vào `generateWorkbook(..., baseDate = generateDate)` và `buildPreview(..., baseDate = generateDate)`

### 5. UI/UX

**Template cell example:**
| Cell trong export template | Ý nghĩa |
|---|---|
| `(R.num)` | Số thứ tự |
| `{{Họ và tên}}` | Lấy data theo mapping |
| `{{Họ và tên}} - (ddmmyy)(R.num)` | Kết hợp data + expression |
| `HỢP ĐỒNG NGUYÊN TẮC` | Text cố định (không đổi) |

**Generate Panel thêm:**
- Input "Ngày áp dụng cho expression:" (date picker)

**Mapping Panel thêm:**
- Mỗi row có thêm checkbox `[ ] VIẾT HOA` bên phải giá trị map

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/types/index.ts` | Thêm `uppercase?: boolean` vào `FieldMappingValue` |
| `src/lib/excel-generator.ts` | Thêm `FIELD_REF_REGEX`, `replaceFieldReferences`, cập nhật `generateWorkbook` + `buildPreview` (inline ref + uppercase + baseDate param) |
| `src/components/excel-generator/TemplateUploadModal.tsx` | Thêm checkbox VIẾT HOA trong mapping panel |
| `src/components/excel-generator/GeneratePanel.tsx` | Thêm input date picker cho ngày generate; thêm checkbox VIẾT HOA trong mapping panel; truyền ngày vào preview/generate |

### 7. Schema / SQL changes
Không cần. `column_mapping` là JSONB, đã hỗ trợ thêm key `uppercase`.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Template cell: `{{Họ và tên}} - (ddmmyy)(R.num)` → verify output đúng format
2. Template cell: `{{Công ty}}` với uppercase ticked → verify viết hoa toàn bộ
3. Chọn ngày generate = `15/03/2026` → verify `(dd/mm/yyyy)` ra `15/03/2026`
4. Template cell không có `{{...}}` và không có `( ... )` → giữ nguyên text cố định
5. Template cell chỉ có `(R.num)` → không bị ảnh hưởng bởi mapping

### 10. Rollout Plan
1. Cập nhật `types/index.ts`
2. Sửa `excel-generator.ts`
3. Sửa UI components
4. Test với template hợp đồng nguyên tắc của user

### 11. Notes
- Backward compatible: template cũ không có `{{...}}` vẫn hoạt động bình thường
- Nếu `{{Field Name}}` không tìm thấy trong mapping → giữ nguyên `{{Field Name}}` để user dễ debug

---

---

## FEAT-021: Excel Generator — Edit Template đã lưu

- **Đề xuất**: 2026-06-03
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-04

### 1. Mô tả feature
Cho phép admin mở lại modal upload để chỉnh sửa template đã lưu: đổi tên, mô tả, thay đổi mapping, thay file template (export/import), sửa số dòng header.

### 2. Motivation / Why
- Hiện tại chỉ có thể xóa và tạo lại template nếu muốn sửa mapping hoặc tên
- User cần điều chỉnh template thường xuyên (thêm field, sửa mapping, đổi tên)

### 3. Scope

**In scope:**
- Nút "Sửa" trong Template Manager table
- Modal upload chuyển sang chế độ edit khi có `editTemplate` prop
- Pre-fill tất cả dữ liệu cũ: name, description, template_header_row, import_header_row, fields, import_headers, column_mapping
- Giữ file cũ nếu user không upload file mới
- Nếu upload file mới → xóa file cũ trong Storage + upload file mới
- Update DB row thay vì insert

**Out of scope:**
- Version history cho template
- Diff/preview thay đổi trước khi save

### 4. Technical Design

**Component `TemplateUploadModal`:**
- Thêm prop `editTemplate?: ExcelTemplate`
- Nếu `editTemplate` tồn tại:
  - Pre-fill state từ `editTemplate`
  - Hiển thị tên file cũ thay vì dropzone rỗng
  - Nút "Thay file mới" để mở dropzone nếu muốn đổi file
  - On save: gọi `.update()` thay vì `.insert()`

**File Storage handling:**
```typescript
// Khi edit và upload file mới
if (newExportFile && editTemplate?.storage_path) {
  await supabase.storage.from('excel-templates').remove([editTemplate.storage_path])
}
```

### 5. UI/UX
- Template Manager table: thêm icon `Pencil` bên cạnh icon Download và Trash
- Modal title đổi từ "Thêm template Excel" → "Sửa template Excel" khi edit
- Dropzone hiển thị: "File hiện tại: [tên file]" + nút "Thay file mới"

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/components/excel-generator/TemplateUploadModal.tsx` | Thêm prop `editTemplate`, chế độ edit, pre-fill, update DB, handle file replacement |
| `src/components/excel-generator/TemplateManager.tsx` | Thêm nút Edit (Pencil), mở modal với `editTemplate` |

### 7. Schema / SQL changes
Không cần.

### 8. API / Integration changes
Không cần.

### 9. Test Plan
1. Click "Sửa" template → modal mở với đúng dữ liệu cũ
2. Đổi tên template → save → verify tên mới trong DB
3. Đổi mapping 1 field → save → verify mapping mới trong DB
4. Thay file export template mới → save → verify file cũ bị xóa trong Storage, file mới tồn tại
5. Không thay file → save → verify file cũ vẫn giữ nguyên

### 10. Rollout Plan
1. Sửa `TemplateUploadModal` để hỗ trợ edit mode
2. Sửa `TemplateManager` thêm nút Edit
3. Test edit với template có sẵn

### 11. Notes
- Cần đảm bảo `onUploaded` callback vẫn được gọi để refresh danh sách template
- Nếu xóa file cũ trong Storage fail (ví dụ đã bị xóa trước đó) → bỏ qua lỗi, vẫn tiếp tục upload file mới

---

---

## FEAT-003: In-app Notifications (badge, dropdown)

- **Đề xuất**: 2026-05-28
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-05-29

### Current Status (as of 2026-05-29)

**Đã làm:**
- `supabase/migrations/013_notifications.sql` — Bảng `notifications` + RLS + indexes.
- `src/types/index.ts` — Type `Notification`.
- `src/lib/notifications.ts` — Helpers: `createNotification`, `createNotificationsForAdmins`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `getUnreadNotificationCount`.
- `src/components/NotificationDropdown.tsx` — Query từ `notifications` table, badge đếm unread từ DB, mark read trong DB, poll 30s, icon theo type.
- Tích hợp tạo notification tự động trong:
  - `CreateRequestModal` → `request_new`
  - `RequestDetailPage` (hủy) → `request_cancelled`
  - `RequestDetailPage` (comment) → `comment_new`
  - `request-actions.ts` (hoàn tất) → `request_completed`
  - `agent-actions.ts` (deactivate/restore) → `agent_deactivated` / `agent_restored`
- Đã tích hợp vào `Layout.tsx` (header).

**Chưa làm:**
- Realtime update (cần FEAT-002).

### 1. Mô tả feature
Xây dựng hệ thống thông báo trong app: badge trên chuông header hiển thị số noti chưa đọc, dropdown liệt kê các thông báo (request mới, comment mới, B2 alert, M1 transition expired).

### 2. Motivation / Why
- Hiện tại badge chuông là UI tĩnh, không có chức năng.
- Ngườii dùng cần được thông báo khi có sự kiện quan trọng mà không cần refresh.

### 3. Scope

**In scope:**
- Bảng `notifications` mới trong DB.
- Dropdown panel hiển thị danh sách noti.
- Badge đếm số noti chưa đọc.
- Nút "Đánh dấu đã đọc" / "Đánh dấu tất cả đã đọc".
- Tạo notification khi: request mới được tạo, comment mới, B2 quá hạn, M1 transition expired.

**Out of scope:**
- Push notification (browser push).
- Email notification (làm ở FEAT-001).
- Notification preferences/settings.

### 4. Technical Design
- Bảng `notifications` lưu: `id`, `user_id` (recipient), `type`, `title`, `message`, `link`, `read`, `created_at`.
- Trigger PostgreSQL hoặc application-level insert khi có event.
- Header component query `notifications` với `read = false` để hiển thị badge.
- Dropdown dùng `Popover` hoặc tự implement.
- Kết hợp với FEAT-002 (Realtime) để noti mới đến ngay lập tức.

### 5. UI/UX
- Chuông header có badge số màu đỏ khi có noti chưa đọc.
- Click chuông mở dropdown panel, hiển thị ~10 noti gần nhất.
- Mỗi noti hiển thị: icon theo type, title, thời gian tương đối ("2 phút trước").
- Click noti → navigate đến link liên quan, đánh dấu đã đọc.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/migrations/006_add_notifications.sql` | Bảng `notifications` |
| `src/types/index.ts` | Thêm type `Notification` |
| `src/components/NotificationBell.tsx` | Component mới: badge + dropdown |
| `src/components/Layout.tsx` | Tích hợp NotificationBell vào header |
| `src/lib/notifications.ts` | Helper tạo notification (dùng trong các action) |
| `src/pages/RequestDetailPage.tsx` | Tạo noti khi có comment mới |
| `src/pages/DashboardPage.tsx` | Tạo noti khi có B2/M1 alert |

### 7. Schema / SQL changes
```sql
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('request_new','comment_new','b2_alert','m1_expired','request_completed')),
  title text NOT NULL,
  message text,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow insert notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
```

### 8. API / Integration changes
- Có thể cần RPC hoặc Edge Function để bulk mark-as-read.

### 9. Test Plan
1. Tạo request mới → verify recipient nhận noti trong dropdown.
2. Thêm comment → verify ngườii liên quan nhận noti.
3. Badge cập nhật đúng số chưa đọc.
4. Click "Đánh dấu đã đọc" → badge giảm, noti đổi style.
5. Click noti → navigate đúng trang.

### 10. Rollout Plan
1. Tạo bảng + RLS policies.
2. Deploy UI components.
3. Thêm logic tạo noti vào các flow hiện có (tạo request, comment, v.v.).

### 11. Notes
- Cần xác định rõ `user_id` nhận noti: ví dụ comment thì ai nhận? (owner request? admin?)
- Cân nhắc cleanup noti cũ (>90 ngày) để bảng không phình to.
- Nên làm sau FEAT-002 (Realtime) để noti đến realtime.

---

---

## FEAT-006: Schema v2 — Align agents table with eravnTrans

- **Đề xuất**: 2026-05-28
- **Status**: `done`
- **Priority**: `high`
- **Hoàn thành**: 2026-05-29

### Current Status (as of 2026-05-29)

**Đã làm:**
- `supabase/migrations/008_schema_v2_agents.sql` (414 dòng) — Đã có đầy đủ:
  - 6 bảng mới: `divisions`, `division_head_history`, `rank_profiles`, `ranks`, `agent_referrer_log`, `agent_info_history_log`, `agent_timeline_events`
  - ALTER `agents`: thêm ~25 cột mới (`agent_code`, `referrer_id`, `rank_id`, `register_date`, `end_date`, `deactivation_reason`, `bank_name`, `id_card_number`, v.v.)
  - Trigger sync `referrer_id` ↔ `current_t1_id`
  - Trigger `recompute_division_on_referrer_change`
  - Update RPC `check_eligibility` + `get_t1_capacity` hỗ trợ schema mới
  - RLS policies + indexes
- `src/types/index.ts` — `Agent` interface đã cập nhật đầy đủ cột mới.
- `AgentDetailPage` — Đã hiển thị đầy đủ 3 section: Thông tin cá nhân, Ngân hàng & Thuế, Nghề nghiệp.
- `UploadPage` — Đã có OPTIONAL_HEADERS cho ~25 cột schema v2.
- `AgentsPage`/`DashboardPage` — Đã dùng pattern `referrer_id ?? current_t1_id` và `rank_name ?? rankNamesMap[rank_id]`.
- `RanksPage`/`DivisionsPage` — Đã có UI quản lý đầy đủ.
- Seed data `ranks` tự động từ `rank_name` hiện có trong DB.
- Migration chạy thủ công trên Supabase SQL Editor (do user xác nhận đã chạy).
- `AgentDetailPage` — Đã thêm section "Thông tin cá nhân" (CCCD, ngày sinh, giới tính, ngày cấp, nơi cấp, nguyên quán, địa chỉ), "Ngân hàng & Thuế" (ngân hàng, số TK, chi nhánh, mã số thuế), "Nghề nghiệp" (khu vực, kinh nghiệm BĐS, chứng chỉ MG, hết hạn, seminar).
- `UploadPage` — Đã có đầy đủ OPTIONAL_HEADERS cho ~25 cột mới của schema v2.
- `AgentsPage`/`DashboardPage` — Đã dùng pattern `referrer_id ?? current_t1_id` và `rank_name ?? rankNamesMap[rank_id]`.

### 1. Mô tả feature
Nâng cấp schema bảng `agents` và các bảng phụ trợ để **chuẩn hóa theo eravnTrans**. Mục tiêu: lưu trữ nhiều thông tin hơn, dùng tên field giống eravnTrans, tách các entity liên quan (`ranks`, `divisions`) thành bảng riêng với FK chặt chẽ.

### 2. Motivation / Why
- `rank_name` hiện tại là text tự do → dễ sai chính tả, không chuẩn hóa.
- `division_id` là number đơn thuần → không có danh sách division chuẩn.
- Thiếu thông tin cá nhân, nghề nghiệp, ngân hàng, lịch sử thay đổi.
- eravnTrans đã có schema mature với audit log (`agent_timeline_events`), history log (`agent_info_history_log`), referrer log (`agent_referrer_log`) → replicate patterns đã validated.

### 3. Scope

**In scope:**
- ALTER TABLE `agents`: đổi tên + thêm cột giống eravnTrans.
- Tạo bảng `ranks`, `rank_profiles` **giống y hệt eravnTrans** (schema độc lập, seed data từ eravnTrans).
- Tạo bảng `divisions` **dựa trên eravnTrans + thêm fields riêng** phục vụ logic T1 Tracker.
- Tạo bảng `agent_referrer_log`, `agent_info_history_log`, `agent_timeline_events`.
- Migration data từ schema cũ sang schema mới (không mất data).
- Update `types/index.ts`, queries, UI.

**Out of scope:**
- Không đổi bảng `t1_requests`, `t1_changes`, `m1_transition_tasks` (làm ở FEAT khác nếu cần).
- Không replicate toàn bộ eravnTrans (chỉ lấy phần liên quan agents).
- Không đụng đến finance/commission/ledger.

### 4. Technical Design

#### 4.1 Mapping bảng `agents` hiện tại → eravnTrans

| T1 Tracker hiện tại | eravnTrans | Hành động | Ghi chú |
|---------------------|------------|-----------|---------|
| `id` | `id` | Giữ nguyên | UUID PK |
| `staff_id` | `agent_code` | **Đổi tên?** | Xem phương án dưới |
| `full_name` | `full_name` | Giữ nguyên | |
| `email` | `email` | Giữ nguyên | |
| `phone` | `phone` | Giữ nguyên | |
| `rank_name` (text) | `rank_id` (FK → ranks) | **Tách bảng** | Cần seed data ranks |
| `contract_signing_date` | `contract_signing_date` | Giữ nguyên | NOT NULL |
| `current_t1_id` | `referrer_id` | **Đổi tên** | Self-referencing FK |
| `introducing_agent_id` | `introducing_agent_id` | Giữ nguyên | Self-referencing FK |
| `division_id` (number) | `division_id` (FK → divisions) | **Thêm FK** | Cần seed data divisions |
| `cumulative_personal_revenue` | `cumulative_personal_revenue` | Giữ nguyên | |
| `my_era_points` | — | **Cần quyết định** | eravnTrans không có field này trong `agents`. Có thể bỏ hoặc giữ |
| `status` | `status`? | Giữ nguyên | eravnTrans dùng `deactivation_reason` + `end_date` thay vì enum |
| `deleted_at` | — | Giữ nguyên | Soft delete của T1 Tracker, eravnTrans không có |
| — | `register_date` | **Thêm** | Ngày đăng ký |
| — | `agent_start_date` | **Thêm** | Ngày bắt đầu làm agent |
| — | `end_date` | **Thêm** | Ngày kết thúc HĐ |
| — | `deactivation_reason` | **Thêm** | Lý do nghỉ |
| — | `business_email` | **Thêm** | Email công việc |
| — | `id_card_number` | **Thêm** | CCCD/CMND |
| — | `date_of_birth` | **Thêm** | |
| — | `id_card_issue_date` | **Thêm** | |
| — | `id_card_issue_place` | **Thêm** | |
| — | `permanent_address` | **Thêm** | |
| — | `place_of_origin` | **Thêm** | |
| — | `gender` | **Thêm** | |
| — | `tax_code` | **Thêm** | Mã số thuế |
| — | `bank_name` | **Thêm** | |
| — | `bank_account_number` | **Thêm** | |
| — | `bank_branch_name` | **Thêm** | |
| — | `active_area` | **Thêm** | Khu vực hoạt động |
| — | `real_estate_experience` | **Thêm** | Kinh nghiệm BĐS |
| — | `broker_licence_number` | **Thêm** | Số chứng chỉ môi giới |
| — | `broker_licence_expiry_date` | **Thêm** | |
| — | `success_seminar_date` | **Thêm** | Ngày seminar thành công |
| — | `source` | **Thêm** | Nguồn agent đến từ đâu |
| — | `special_bonus_profile_id` | **Thêm** | FK → special_bonus_profiles (nếu cần) |
| `created_at` | `created_at` | Giữ nguyên | |
| `updated_at` | `updated_at` | Giữ nguyên | Thêm nếu chưa có |

#### 4.2 Phương án quyết định tên field `staff_id`

| Phương án | Mô tả | Ưu điểm | Nhược điểm |
|-----------|-------|---------|------------|
| **A (Khuyến nghị)** | Giữ `staff_id`, **thêm** `agent_code` (có thể = `staff_id` hoặc khác) | Không break data hiện tại, có thể có 2 mã khác nhau (nội bộ vs đối ngoại) | Có 2 trường mã |
| **B** | Đổi `staff_id` → `agent_code` | Giống eravnTrans 100% | Break toàn bộ code hiện tại, cần migration + refactor lớn |
| **C** | Giữ `staff_id`, không thêm `agent_code` | Đơn giản | Không giống eravnTrans |

**Tôi khuyến nghị Phương án A** — giữ `staff_id` làm business key hiện tại, thêm `agent_code` để sau này có thể map với eravnTrans nếu cần sync.

#### 4.3 Bảng mới cần tạo (giống eravnTrans + custom)

```sql
-- divisions (eravnTrans + custom fields cho T1 Tracker)
CREATE TABLE divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,              -- Division Name
  head_agent_id uuid REFERENCES agents(id), -- Division Head
  is_official boolean DEFAULT false,       -- Official Division
  is_default boolean DEFAULT false,        -- true = Division "Khác" (fallback)
  established_at date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- division_head_history (track lịch sử head division)
CREATE TABLE division_head_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid REFERENCES divisions(id) ON DELETE CASCADE,
  head_agent_id uuid REFERENCES agents(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- rank_profiles (giống eravnTrans)
CREATE TABLE rank_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ranks (giống y hệt eravnTrans — đầy đủ cột)
CREATE TABLE ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_profile_id uuid REFERENCES rank_profiles(id) ON DELETE RESTRICT,
  name text NOT NULL,
  rank_type varchar(20), -- e.g. 'agent', 'consultant', 'specialist'
  revenue_threshold numeric(18,0),
  commission_tier integer,
  t0_rate numeric(10,4),
  t1_rate numeric(10,4),
  t2_rate numeric(10,4),
  t3_rate numeric(10,4),
  t4_rate numeric(10,4),
  t1_unlock numeric(18,0),
  t2_unlock numeric(18,0),
  t3_unlock numeric(18,0),
  t4_unlock numeric(18,0),
  head_rate numeric(10,4),
  division_rate numeric(10,4),
  group_division_rate numeric(10,4),
  profit_sharing_pool_rate numeric(10,4),
  sort_order integer,
  non_upgradable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- agent_referrer_log (lịch sử T1/upline)
CREATE TABLE agent_referrer_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  referrer_id uuid REFERENCES agents(id),
  effective_date date,
  end_date date,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- agent_info_history_log (lịch sử thay đổi field)
CREATE TABLE agent_info_history_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  changed_field text NOT NULL,
  old_value text,
  new_value text,
  changed_by_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now()
);

-- agent_timeline_events (audit log đầy đủ)
CREATE TABLE agent_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind varchar(20) NOT NULL,
  status varchar(30),
  action text,
  message text,
  message_ref uuid,
  created_at timestamptz DEFAULT now()
);
```

#### 4.4 Division Logic (Business Rules)

**Quy tắc tính Division của Agent X:**
```
1. X là head_agent_id của Division D?
     → YES: X thuộc D
2. X có referrer_id (T1)?
     → YES: Đi lên T1 tree → gặp head_agent_id đầu tiên → X thuộc Division đó
     → (T1 tree override explicit division_id)
3. X có division_id explicit (được gán thủ công / cũ)?
     → YES: X thuộc division_id đó
4. Fallback → Division "Khác" (divisions.is_default = true)
```

**Head Transfer Flow (A → B):**
1. Admin chọn Division → chọn head mới (B)
2. Hệ thống preview affected agents + boundary detection
3. CountdownConfirmModal 10s
4. **A chọn "Ở lại"** → Giữ nguyên `A.division_id` (explicit). A không bị recompute.
5. **A chọn "Rời"** → Set `A.division_id = NULL`. A rơi vào Division "Khác" (vì A không có T1).
6. Recompute `division_id` cho downline của B (recursive, skip sub-heads).

**Safety Net (3 lớp):**
- **Lớp 1:** Trigger PostgreSQL → auto-recompute `division_id` khi `referrer_id` thay đổi
- **Lớp 2:** App function `getAgentDivision(agentId)` → toàn bộ app dùng hàm này, không đọc `division_id` trực tiếp
- **Lớp 3:** Admin "Recompute Division" button → force recalculate toàn bộ

#### 4.5 Migration strategy (không mất data)

**Bước 1:** Tạo bảng mới (`divisions` với Division "Khác", `rank_profiles`, `ranks`, `division_head_history`).
**Bước 2:** Seed data `ranks` từ các giá trị `rank_name` duy nhất hiện có trong DB.
**Bước 3:** Seed Division "Khác": `INSERT INTO divisions (name, is_default) VALUES ('Khác', true)`.
**Bước 4:** ALTER TABLE `agents`:
- Thêm cột `rank_id` → update từ `rank_name`
- Thêm cột `agent_code` → copy từ `staff_id`
- Thêm các cột mới (register_date, id_card_number, ...)
- Đổi tên `current_t1_id` → `referrer_id`
- Xóa cột `rank_name` (sau khi đã migrate xong)
**Bước 5:** Tạo bảng `agent_referrer_log`, seed từ `t1_changes` (lịch sử đổi T1).
**Bước 6:** Enable RLS + policies cho các bảng mới.
**Bước 7:** Tạo trigger `recompute_division_on_referrer_change`.

### 5. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `supabase/migrations/008_schema_v2_agents.sql` | Migration: tạo bảng mới + ALTER agents |
| `src/types/index.ts` | Update `Agent` interface, thêm interfaces mới |
| `src/pages/AgentsPage.tsx` | Query thêm fields, hiển thị thêm cột |
| `src/pages/AgentDetailPage.tsx` | Thêm tab/info card: cá nhân, ngân hàng, nghề nghiệp |
| `src/pages/UploadPage.tsx` | Validate + map thêm headers mới |
| `src/components/CreateRequestModal.tsx` | Query agent với fields mới nếu cần |
| `src/lib/eligibility.ts` | Nếu `rank_name` đổi thành `rank_id` → update logic check |
| `docs/CHANGELOG.md` | Ghi nhận |
| `docs/KNOWLEDGE.md` | Cập nhật schema mới |

### 6. Schema / SQL changes

Migration file `008_schema_v2_agents.sql` sẽ chứa toàn bộ ALTER TABLE + CREATE TABLE. Cần chạy thủ công trên Supabase SQL Editor theo từng bước.

### 7. Test Plan

1. **Migration test:** Chạy SQL trên dev DB → verify không mất data agents hiện tại.
2. **Rank migration:** Verify mỗi agent có `rank_id` đúng mapping từ `rank_name` cũ.
3. **Referrer log:** Verify `agent_referrer_log` có ít nhất bằng số record `t1_changes`.
4. **Upload test:** Import file Excel với headers mới → upsert đúng.
5. **UI test:** AgentDetail hiển thị đầy đủ tab/info mới.
6. **Eligibility test:** Rank check vẫn hoạt động đúng sau khi đổi sang `rank_id`.

### 8. Rollout Plan

1. Backup DB production trước khi chạy migration.
2. Chạy migration trên dev/test DB trước.
3. Deploy code frontend (có thể backward-compatible tạm thờivì thêm cột nullable).
4. Chạy migration trên production.
5. Verify data integrity.

### 9. Notes

- **Quyết định đã xác nhận:**
  1. ✅ Giữ `staff_id`, thêm `agent_code` (nullable, default copy từ `staff_id`)
  2. ✅ Bỏ `my_era_points`
  3. ✅ Giữ `rank_profiles` (track quá trình lên cấp)
  4. ✅ Bỏ `special_bonus_profiles`
  5. ✅ Bảng `ranks` độc lập, schema giống eravnTrans, seed data từ eravnTrans
  6. ✅ Bảng `divisions` thêm `head_agent_id` (Division Head) và `is_official` (Official Division)
  7. ✅ Division "Khác" là division mặc định (fallback) cho agent không có T1 và không phải head
  8. ✅ Head Transfer có CountdownConfirmModal 10s + preview affected agents
  9. ✅ Có bảng `division_head_history` track lịch sử head division
- **Backward compatibility:** Các cột mới đều nullable → không break code cũ ngay lập tức.
- **Performance:** Bảng `agent_timeline_events` có thể lớn nhanh → cần index `(agent_id, created_at)`.
- **Division safety:** Phương án A (Explicit + 3 lớp an toàn) đã được chọn. Explicit `division_id` chỉ có hiệu lực khi `referrer_id IS NULL`. Khi `referrer_id` thay đổi → trigger auto-recompute.

---

---

## FEAT-007: Agent Deactivation với Restore Point & Downline Transition

- **Đề xuất**: 2026-05-28
- **Status**: `done`
- **Priority**: `high`
- **Hoàn thành**: 2026-05-29

### Current Status (as of 2026-05-29)

**Đã làm:**
- `supabase/migrations/009_agent_deactivation.sql` — Đã có:
  - Bảng `agent_deactivation_snapshots`
  - Function `create_deactivation_snapshot()`
  - RLS policies
  - Seed `agent_referrer_log` từ `t1_changes`
- `src/components/DeactivateAgentModal.tsx` — UI đầy đủ: date picker, dropdown lý do, preview M1, CountdownConfirmModal 10s.
- `src/components/RestoreAgentModal.tsx` — UI đầy đủ: 2 mode (full/light), preview affected M1s, CountdownConfirmModal.
- `src/lib/agent-actions.ts` — `deactivateAgent()` + `restoreAgent()` đầy đủ logic (snapshot, timeline, transition tasks, cancel/restore downline).
- `src/pages/AgentsPage.tsx` — Admin đã thấy nút PowerOff (deactivate) / Power (restore) trên mỗi row.
- `src/pages/AgentDetailPage.tsx` — Đã có tab "Lịch sử chấm dứt" (hiển thị khi agent có lịch sử deactivate).
- `src/components/Layout.tsx` — Đã có menu "Ranks" và "Divisions" trong sidebar.

**Chưa làm:**
- Chưa chạy migration `009_agent_deactivation.sql` trên DB production — **bắt buộc chạy thủ công trong Supabase SQL Editor**.
- `Layout.tsx` chưa có menu mới "Quản lý Ranks/Divisions" (dù Ranks/Divisions pages đã có trong nav admin).

### 1. Mô tả feature
Cho phép admin chấm dứt hoạt động (deactivate) agent. Agent không bị xóa mà được lưu toàn bộ thông tin lúc chấm dứt. Có thể restore (kích hoạt lại). Toàn bộ downline của agent bị chấm dứt sẽ được xử lý tương tự như khi T1 chuyển đi (M1 Transition).

### 2. Motivation / Why
- Hiện tại chỉ có soft delete (`deleted_at`) nhưng không track lý do, ngày chấm dứt.
- Khi agent nghỉ, các M1 dưới line cần được xử lý (chọn T1 mới trong 30 ngày).
- Cần khả năng restore nếu deactivate nhầm hoặc agent quay lại.

### 3. Scope

**In scope:**
- Deactivate agent: date picker + lý do + countdown confirm + restore point.
- Restore agent: khôi phục agent về active (có countdown confirm).
- Auto-create M1 transition tasks cho downline của agent bị deactivate.
- Admin quyền edit: `agents`, `ranks`, `divisions` (cập nhật RLS + UI).

**Out of scope:**
- Không xóa vĩnh viễn agent (hard delete).
- Không tích hợp với hệ thống lương/thưởng.

### 4. Technical Design

#### 4.1 Deactivation Flow

```
Admin chọn agent → Bấm "Chấm dứt hoạt động"
  → Modal hiện:
      - Date picker: Ngày chấm dứt (default = today)
      - Dropdown/Textarea: Lý do chấm dứt
      - Preview: Danh sách M1 sẽ bị ảnh hưởng
  → CountdownConfirmModal 10s
  → Confirm:
      1. Set agent.status = 'inactive'
      2. Set agent.end_date = selected_date
      3. Set agent.deactivation_reason = reason
      4. Insert agent_info_history_log (action = 'deactivated')
      5. Create restore_point record
      6. Query all M1s of agent → create m1_transition_tasks
         - parent_request_id = null (không phải từ t1_request)
         - departed_agent_id = agent.id
         - m1_agent_id = each M1
         - deadline_date = end_date + 30 days
         - status = 'pending'
      7. Send notification/toast
```

#### 4.2 Restore Flow

```
Admin chọn agent inactive → Bấm "Kích hoạt lại"
  → Modal:
      - Warning về downline
      - Radio options:
          ⭕ "Khôi phục toàn bộ" — Kéo tất cả M1 cũ về (override cả M1 đã chọn T1 mới)
          ⭕ "Khôi phục nhẹ" — Chỉ khôi phục agent. M1 đã chọn T1 mới thì giữ nguyên.
      - Preview danh sách M1 sẽ bị ảnh hưởng theo option đã chọn
  → CountdownConfirmModal 10s
  → Confirm:
      1. Set agent.status = 'active'
      2. Set agent.end_date = null
      3. Set agent.deactivation_reason = null
      4. Insert agent_info_history_log (action = 'restored')
      5. Cancel pending m1_transition_tasks của agent này
      6. Nếu chọn "toàn bộ": Update M1s → current_t1_id = restored_agent_id
      7. Nếu chọn "nhẹ": Chỉ update M1s chưa chọn T1 mới → current_t1_id = restored_agent_id
```

#### 4.3 Restore Point

Restore point = snapshot trạng thái agent trước khi deactivate:

```sql
CREATE TABLE agent_deactivation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  deactivated_at timestamptz DEFAULT now(),
  deactivated_by uuid REFERENCES auth.users(id),
  end_date date,
  deactivation_reason text,
  referrer_id uuid,           -- T1 lúc chấm dứt
  division_id uuid,           -- Division lúc chấm dứt
  rank_id uuid,               -- Rank lúc chấm dứt
  cumulative_personal_revenue numeric, -- Doanh số lúc chấm dứt
  snapshot_data jsonb,        -- Toàn bộ agent record dạng JSON (backup)
  restored_at timestamptz,
  restored_by uuid REFERENCES auth.users(id)
);
```

#### 4.4 Admin Edit Permissions (RLS + UI)

| Bảng | Admin | Operator | Viewer |
|------|-------|----------|--------|
| `agents` | Full CRUD + deactivate/restore | Edit 1 số field (email, phone, address...) | Chỉ xem |
| `ranks` | Full CRUD | Chỉ xem | Chỉ xem |
| `divisions` | Full CRUD + transfer head | Chỉ xem | Chỉ xem |
| `rank_profiles` | Full CRUD | Chỉ xem | Chỉ xem |

**UI Changes:**
- `AgentsPage`: Admin thấy nút "Chấm dứt" / "Kích hoạt lại". Operator thấy nút "Sửa".
- `AgentDetailPage`: Tab "Lịch sử chấm dứt" (nếu agent từng bị deactivate).
- Admin menu mới: "Quản lý Ranks", "Quản lý Divisions".

#### 4.5 Downline Transition khi Deactivate

Tương tự M1 Transition khi T1 chuyển đi:
- Mỗi M1 của agent bị deactivate được tạo 1 `m1_transition_task`
- Deadline = `end_date` + 30 ngày (business days?)
- Temp T1 = `referrer_id` của agent bị deactivate (nếu có) hoặc null
- Sau 30 ngày: admin bấm "Áp dụng T2 làm T1" hoặc M1 chọn T1 mới

**Khác biệt với T1 Change:**
- Không có `t1_request` nguồn (`parent_request_id = null`)
- `departed_agent_id` = agent bị deactivate
- Agent bị deactivate không còn active → không thể làm T1 của ai

### 5. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `supabase/migrations/009_agent_deactivation.sql` | Bảng `agent_deactivation_snapshots`, trigger, RLS policies |
| `src/types/index.ts` | Thêm interfaces: `AgentDeactivationSnapshot`, update `Agent` |
| `src/pages/AgentsPage.tsx` | Thêm nút deactivate/restore (admin only) |
| `src/pages/AgentDetailPage.tsx` | Thêm tab lịch sử chấm dứt, info card ngày chấm dứt |
| `src/components/DeactivateAgentModal.tsx` | Modal mới: date picker + reason + preview M1 + countdown |
| `src/components/RestoreAgentModal.tsx` | Modal mới: confirm restore + warning + countdown |
| `src/lib/agent-actions.ts` | Hàm `deactivateAgent()`, `restoreAgent()` reusable |
| `src/pages/RanksPage.tsx` | Trang quản lý ranks (admin only) |
| `src/pages/DivisionsPage.tsx` | Trang quản lý divisions (admin only) |
| `src/components/Layout.tsx` | Thêm menu admin: Ranks, Divisions |

### 6. Schema / SQL changes

```sql
-- Agent deactivation snapshot
CREATE TABLE agent_deactivation_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  deactivated_at timestamptz DEFAULT now(),
  deactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  end_date date NOT NULL,
  deactivation_reason text NOT NULL,
  referrer_id uuid,
  division_id uuid,
  rank_id uuid,
  cumulative_personal_revenue numeric,
  snapshot_data jsonb NOT NULL,
  restored_at timestamptz,
  restored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index để tìm snapshot nhanh
CREATE INDEX idx_deactivation_snapshots_agent ON agent_deactivation_snapshots(agent_id, deactivated_at DESC);
```

### 7. Test Plan

1. **Deactivate test:**
   - Chọn agent có 3 M1 → deactivate → verify 3 `m1_transition_tasks` được tạo
   - Verify `agent_deactivation_snapshots` có 1 record với `snapshot_data` đầy đủ
   - Verify agent.status = 'inactive', end_date đúng

2. **Restore test:**
   - Restore agent vừa deactivate → verify agent.status = 'active'
   - Verify `restored_at` được ghi
   - Verify pending `m1_transition_tasks` bị cancel

3. **RLS test:**
   - Admin: thấy đủ nút deactivate, edit ranks, edit divisions
   - Operator: chỉ thấy nút edit agent (không deactivate), không thấy menu ranks/divisions
   - Viewer: không thấy nút edit gì cả

4. **Edge case:**
   - Deactivate agent không có M1 → không tạo transition task
   - Restore agent sau khi M1s đã chọn T1 mới → M1s giữ nguyên T1 mới, agent phải tự rebuild downline

### 8. Rollout Plan

1. Deploy schema migration.
2. Deploy code frontend (nút deactivate/restore ẩn/hiện theo role).
3. Test trên dev với sample agent có M1.

### 9. Notes

- **Lý do chấm dứt:** Dropdown preset (`'nghỉ việc'`, `'vi phạm'`, `'chuyển công ty'`, `'khác'`) + textarea nếu chọn `'khác'`.
- **Restore và downline:** Khi restore, agent được khôi phục toàn bộ từ snapshot. Các M1 transition tasks bị cancel. M1s tự động gán lại cho agent (rebuild downline). Nếu M1 đã chọn T1 mới trong thờigian deactivate → ưu tiên giữ T1 mới, không gán lại.
- **Date picker:** Ngày chấm dứt có thể là ngày trong quá khứ (nếu admin nhập trễ) hoặc tương lai (nếi báo trước).

---

## Hướng dẫn thêm feature mới

Khi muốn phát triển feature mới:
1. Copy template ở đầu file.
2. Điền thông tin, đặt `status: backlog`.
3. Xác định scope rõ ràng (in scope / out of scope).
4. Cập nhật `status: planned` khi có technical design rõ ràng.
5. **Chỉ code sau khi plan được review/approve.**
6. Sau khi hoàn thành: `status: done`, ghi `CHANGELOG.md`, cập nhật `Hoàn thành` trong Feature Registry.

---

---

## FEAT-014: Quản lý mẫu email dạng danh sách (list view + modal edit)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-05-29

### 1. Mô tả feature
Chuyển trang `EmailTemplatesPage` từ dạng **card mở sẵn editor** sang dạng **danh sách gọn**, click vào row để mở modal chỉnh sửa.

### 2. Motivation
- Hiện tại mỗi template render thành 1 card lớn, editor luôn mở → page dài, khó quan sát nhiều mẫu.
- User cần overview nhanh trước khi chọn mẫu để sửa.

### 3. Scope
**In scope:**
- Table/list hiển thị: STT, Tên mẫu, Template key, Tiêu đề, Nút "Chỉnh sửa" + "Xem trước".
- Click row hoặc nút "Chỉnh sửa" → mở modal soạn thảo (re-use `HtmlEditor` + `Modal` component).
- Giữ nút "Xem trước" trong modal (mở preview modal riêng).
- Giữ nút "Lưu mẫu" trong modal.

**Out of scope:**
- Không đổi schema DB.
- Không đổi cách `ComposeTemplateModal` dùng template.

### 4. UI/UX
- Bảng đơn giản: `# | Tên mẫu | Template key | Tiêu đề | Hành động`.
- Modal chỉnh sửa: Tên mẫu, Template key (disabled), Tiêu đề, Nội dung (HtmlEditor đầy đủ), Preview, Lưu.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/EmailTemplatesPage.tsx` | Refactor UI: list table + modal editor thay vì card mở sẵn |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Load trang → hiển thị danh sách gọn, không có editor mở sẵn.
2. Click "Chỉnh sửa" → modal mở với đúng nội dung mẫu.
3. Sửa subject/body → bấm Lưu → toast success, list cập nhật.
4. Bấm Xem trước trong list → modal preview hiển thị đúng rendered HTML.

### 8. Notes
- Dùng component `Modal.tsx` chung để đảm bảo consistency (portal, focus trap, Escape).
- **2026-05-29**: Thêm placeholder `{{oldT1StaffId}}` và `{{tempT1StaffId}}` vào `defaultPlaceholders` + `previewData` (cập nhật sau khi FEAT-014/015 hoàn thành).

---

---

## FEAT-015: Thêm mẫu email mới (popup trình soạn thảo)

- **Đề xuất**: 2026-05-29
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-05-29

### 1. Mô tả feature
Thêm chức năng tạo mẫu email mới từ trang Quản lý mẫu email. Hiện tại chỉ có sửa mẫu đã có, chưa có tạo mới.

### 2. Scope
**In scope:**
- Nút **"Thêm mẫu"** trên `EmailTemplatesPage`.
- Modal form: Tên mẫu, Template key (auto-slug từ tên, có thể sửa tay), Tiêu đề, Nội dung (HtmlEditor).
- Insert vào bảng `email_templates` (Supabase).
- Validate: `template_key` unique, không để trống tên/tiêu đề.

**Out of scope:**
- Không cho phép xóa template.
- Không hỗ trợ đổi `template_key` sau khi tạo.

### 3. UI/UX
- Nút "Thêm mẫu" màu primary, góc trên phải trang.
- Modal giống modal sửa, thêm field **Tên mẫu** và **Template key**.
- Template key tự động sinh từ tên (slug: lowercase, dấu `-`, bỏ dấu tiếng Việt). User có thể sửa lại.

### 4. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/EmailTemplatesPage.tsx` | Thêm nút "Thêm mẫu", modal create với form + HtmlEditor, insert Supabase |

### 5. Schema / SQL changes
Không cần. Dùng bảng `email_templates` sẵn có.

### 6. Test Plan
1. Bấm "Thêm mẫu" → modal mở.
2. Nhập Tên mẫu = `Thông báo test` → verify Template key auto-fill = `thong-bao-test`.
3. Sửa Template key = `custom_key`.
4. Nhập tiêu đề, soạn body bằng HtmlEditor.
5. Bấm Tạo mẫu → toast success, mẫu xuất hiện trong list.
6. Refresh trang → verify mẫu vẫn còn (đã lưu DB).
7. Thử tạo `template_key` trùng → toast lỗi unique constraint.

### 7. Notes
- Template key sau khi tạo không cho sửa để tránh break `ComposeTemplateModal` đang query theo `template_key`.
- `version` mặc định = 1 khi insert.

---

---

## FEAT-019: Mail Merge Generator (template + data → file Excel)

- **Đề xuất**: 2026-06-02
- **Status**: `done`
- **Priority**: `medium`
- **Hoàn thành**: 2026-06-03

### 1. Mô tả feature
Tính năng riêng biệt cho phép ngườii dùng:
1. **Template gồm 2 file** (chỉ admin quản lý):
   - **File export template**: File Excel mẫu sẽ xuất ra. User chỉ định **row header** — các ô trong row đó là tên các trường. Các ô trong template có thể chứa **expression động** như `(ddmmyy)`, `(R.num)`, `([dd-1]mmyy)`.
   - **File import mẫu**: File Excel chứa các cột dữ liệu thô tương ứng. Cũng có row header để xác định tên cột.
2. **Mapping khi tạo template** — sau khi upload cả 2 file, app hiển thị UI cho phép admin map từng **trường trong export template** vào **cột trong file import mẫu** hoặc nhập **giá trị cố định**. Mapping được **lưu vào DB**.
3. **Expression parser** — hỗ trợ các biểu thức động trong cell của export template:
   - `(ddmmyy)` → ngày hiện tại dạng `291225`
   - `([dd-1]mmyy)` → ngày - 1 dạng `281225`
   - `(R.num)` → số thứ tự dòng (2 chữ số): `01`, `02`, ...
   - `([R.num-1])`, `([R.num+1])` → row ± 1
   - Kết hợp: `(ddmmyy)(R.num)` → `29122503`
4. **Generate** — user chọn template, upload file data. Nếu cột trong file data khớp với file import mẫu → **auto-apply mapping đã lưu**. Nếu không khớp → hiện mapping panel để adjust.
5. **Preview trước** — hiển thị bảng preview ~10 dòng đầu tiên sau khi đã evaluate expression + apply mapping.
6. **Lưu lịch sử** — file data gốc và file generate đều được lưu vào Storage + DB. Tên file generate: `{template_name}_{YY}{MM}{DD}_{HH}{MM}.xlsx`.
7. **Download file import mẫu** — user có thể tải file import mẫu về để biết cấu trúc cột cần chuẩn bị.
8. **Download** file kết quả về máy từ lịch sử hoặc ngay sau generate.

### 2. Motivation / Why
- Giảm thao tác thủ công: thay vì copy-paste từng dòng vào mẫu Excel, app sẽ tự động fill.
- Dùng cho các báo cáo định kỳ, giấy tờ, hợp đồng có cấu trúc cố định nhưng data thay đổi.
- Expression parser giúp tự động điền ngày tháng, số thứ tự dòng mà không cần có trong file data.
- Tách biệt hoàn toàn với flow import agents — không ảnh hưởng đến DB agents.

### 3. Scope

**In scope:**
- Quản lý template Excel (admin): upload **2 file** (export template + import mẫu), chỉ định row header cho mỗi file, mapping trường → cột data hoặc giá trị cố định, đặt tên, xóa.
- Expression parser trong export template: `dd`, `mm`, `yy`, `yyyy`, `R.num` với phép tính `+n`/`-n`.
- Trang generate (tất cả authenticated user): chọn template, tải file import mẫu, upload file data, nhập row header, auto-apply/adjust mapping, preview, generate, download.
- Output: 1 file Excel với header row được replicate theo số dòng data, các row khác giữ nguyên.
- Lưu lịch sử generate: file data gốc + file generate vào Storage, metadata vào DB.
- Tên file generate: `{template_name}_{YY}{MM}{DD}_{HH}{MM}.xlsx`.

**Out of scope:**
- Không hỗ trợ expression trong tên sheet, header/footer, hay công thức Excel.
- Không hỗ trợ nhiều sheet template (chỉ sheet đầu tiên).
- Không integrate với agents DB hay gửi email.
- Không chỉnh sửa file đã generate sau khi lưu (chỉ download lại).

### 4. Technical Design

#### 4.1 Storage
- **Supabase Storage bucket `excel-templates`** để lưu cả 2 file template (export + import mẫu).
- **Supabase Storage bucket `excel-generations`** để lưu file data gốc và file generate `.xlsx`.
- **Bảng `excel_templates`** lưu metadata template:
  - `id`, `name`, `description`, `storage_path` (export template), `import_template_path` (import mẫu), `template_header_row` (integer, 0-based), `import_header_row` (integer, 0-based), `fields` (JSONB — tên trường từ export template), `import_headers` (JSONB — headers từ import mẫu), `column_mapping` (JSONB: `{fieldName -> {type, value}}`), `created_by`, `created_at`, `updated_at`.
- **Bảng `excel_generation_logs`** lưu lịch sử generate:
  - `id`, `template_id` (FK → excel_templates, nullable), `original_file_name`, `original_storage_path`, `generated_file_name`, `generated_storage_path`, `row_count`, `matched_placeholders` (JSONB), `created_by`, `created_at`.
- Khi upload template mới:
  1. Upload **export template** lên Storage.
  2. Upload **import mẫu** lên Storage.
  3. Đọc export template, lấy tên trường từ row header.
  4. Đọc import mẫu, lấy headers từ row header.
  5. Admin chọn mapping trong UI (cột data hoặc giá trị cố định).
  6. Lưu metadata + fields + import_headers + column_mapping vào DB.
- Khi generate:
  1. Upload file data lên Storage bucket `excel-generations/originals/{uuid}.xlsx`.
  2. Sau khi generate xong, upload file kết quả lên Storage bucket `excel-generations/generated/{uuid}.xlsx`.
  3. Insert row vào `excel_generation_logs` với metadata đầy đủ.

#### 4.2 Generate Flow
```
User chọn template (đã có column_mapping lưu sẵn)
  → Hiển thị: fields, mapping đã lưu, link "Tải file import mẫu"
  → User upload file data (.xlsx/.csv)
  → User nhập row header cho file data
  → App đọc data file (SheetJS → headers[] + rows[])
  → So sánh headers với import_headers đã lưu:
     - Nếu khớp → auto-apply saved mapping → build preview luôn
     - Nếu không khớp → hiện Mapping Panel để user adjust
  → Hiển thị bảng preview + match status
  → User xem preview đúng → bấm Generate
  → Với toàn bộ row data (row i từ 1..N):
      - Clone header row từ template
      - Với mỗi cell trong header row:
          1. Evaluate expression trong cell (dd/mm/yy/R.num...)
          2. Apply mapping: nếu trường đã map → thay bằng giá trị data hoặc text cố định
      - Insert vào workbook
  → Các row khác trong template (trước/sau header row) giữ nguyên
  → Tên file: {template_name}_{YY}{MM}{DD}_{HH}{MM}.xlsx
  → Ghi workbook mới → upload lên Storage bucket excel-generations/generated
  → Insert log vào excel_generation_logs
  → Auto-download file kết quả
```

#### 4.3 Expression Rules
- **Cú pháp:** Bọc trong dấu ngoặc đơn `( ... )`.
- **Token date:** `dd` (ngày 01-31), `mm` (tháng 01-12), `yy` (năm 2 số), `yyyy` (năm 4 số).
- **Token row:** `R.num` (số thứ tự dòng, 1-based, zero-padded 2 chữ số).
- **Phép tính:** Có thể bọc trong `[]` với `+n` hoặc `-n`. Ví dụ: `[dd-1]`, `[R.num+1]`.
- **Kết hợp:** Các token có thể viết liền nhau hoặc xen kẽ literal. Ví dụ: `(ddmmyy)`, `(dd/mm/yyyy)`, `(ddmmyy)(R.num)`.
- **Xử lý ngày:** `dd±n` tự động xử lý chuyển tháng/năm (JavaScript Date).
- **Evaluate order:** Tất cả date offsets trong cùng 1 expression được apply vào 1 working date trước, sau đó format từng token.

#### 4.4 Mapping Rules
- **Saved mapping:** Định nghĩa 1 lần khi admin tạo template, lưu trong `excel_templates.column_mapping`.
- **Mapping value:** Mỗi trường có 2 loại:
  - `type: 'column'` → `value` là tên cột trong file data.
  - `type: 'fixed'` → `value` là text cố định, gán cho tất cả dòng.
- **Auto-apply:** Khi user upload file data, nếu headers khớp với `import_headers` đã lưu → tự động áp dụng mapping.
- **Manual adjust:** Nếu file data có cột khác với mẫu → hiện Mapping Panel cho user chọn lại hoặc nhập text cố định.
- **Unmapped:** Trường không được map → giữ nguyên giá trị trong template sau khi evaluate expression.
- Hiển thị match status: danh sách trường + mapping đã chọn (✅) / chưa map (⚠️).

#### 4.5 Preview Table
- Sau khi user xác nhận mapping, app build preview từ ~10 dòng data đầu tiên.
- Hiển thị dạng bảng HTML với các trường từ template header row sau khi evaluate expression + apply mapping.
- Nút "Generate" chỉ active sau khi preview đã render.
- Trong preview table có link "Chỉnh sửa mapping" để quay lại mapping panel.

#### 4.6 Tên file generate
- Format: `{template_name}_{YY}{MM}{DD}_{HH}{MM}.xlsx`
- Ví dụ: Template tên `bao_cao` → `bao_cao_260602_1453.xlsx`
- `template_name`: sanitize (bỏ dấu, space → `_`, lowercase) từ `excel_templates.name`.
- Thờigian lấy theo giờ hiện tại của client (GMT+7 / `Asia/Ho_Chi_Minh`).

#### 4.7 Libraries
- `xlsx` (SheetJS) — đã có trong project.
- Không cần thêm dependency mới.

### 5. UI/UX

#### 5.1 Trang mới: `/excel-generator`
- **Tab 1 — Generate:**
  - Dropdown chọn template (load từ DB).
  - Khi chọn template → hiển thị: tên, mô tả, fields, mapping đã lưu, link **"Tải file import mẫu"**.
  - Dropzone upload file data (chỉ nhận .xlsx, .csv).
  - Input nhập **row header** cho file data (tính từ 1).
  - Sau upload:
    - Nếu headers khớp mẫu → **auto-apply mapping** → hiện preview luôn.
    - Nếu headers khác → **Mapping Panel:** dropdown chọn cột hoặc input text cố định cho từng trường. Nút **"Xác nhận mapping"**.
  - Preview gồm:
    - **Match status:** trường + mapping đã chọn (✅) / chưa map (⚠️).
    - **Preview table:** ~10 dòng đầu sau evaluate + mapping. Có link **"Chỉnh sửa mapping"**.
  - Nút **"Generate"** (disabled nếu chưa có preview).
  - Sau generate → toast + auto-download.
- **Tab 2 — Lịch sử Generate:**
  - Bảng danh sách: Template, File gốc, File generate, Số dòng, Ngày tạo, Ngườii tạo, Hành động.
  - Nút **"Download"** cho từng dòng lịch sử.
  - Pagination nếu nhiều hơn 20 dòng.
- **Tab 3 — Quản lý Template (chỉ admin):**
  - Bảng danh sách template: Tên, Mô tả, Fields, Mapping status (x/x đã map), Ngày tạo, Hành động.
  - Nút **"Thêm template"** → modal upload **2 file** + nhập row header + detect fields/headers + mapping panel + đặt tên + mô tả.
  - Nút **"Tải file import mẫu"** → download file import mẫu.
  - Nút **"Xóa"** → confirm xóa (xóa cả DB + cả 2 file trong Storage).

#### 5.2 Navigation
- Thêm menu item **"Excel Generator"** trong sidebar (dưới Upload, trên Emails).

### 6. Files cần sửa / tạo

| File | Thay đổi |
|------|----------|
| `webapp/supabase/migrations/017_excel_templates.sql` | **Mới** — Bảng `excel_templates` (có `import_template_path`, `template_header_row`, `import_header_row`, `fields`, `import_headers`, `column_mapping`) + `excel_generation_logs` (`template_id` nullable) + RLS policies |
| `webapp/src/types/index.ts` | Thêm `ExcelTemplate` interface (có `import_template_path`, `template_header_row`, `import_header_row`, `fields`, `import_headers`, `column_mapping`) |
| `webapp/src/pages/ExcelGeneratorPage.tsx` | **Mới** — Trang chính, parse các trường JSONB mới từ Supabase |
| `webapp/src/components/excel-generator/GeneratePanel.tsx` | **Mới** — Tab generate: auto-apply saved mapping, adjust mapping, evaluate expression, download import mẫu |
| `webapp/src/components/excel-generator/GenerationHistory.tsx` | **Mới** — Tab lịch sử generate |
| `webapp/src/components/excel-generator/TemplateManager.tsx` | **Mới** — Tab quản lý: hiển thị mapping status, download import mẫu, xóa cả 2 files |
| `webapp/src/components/excel-generator/TemplateUploadModal.tsx` | **Mới** — Modal upload **2 file** + row header + detect fields/headers + mapping panel |
| `webapp/src/lib/excel-generator.ts` | **Mới** — Expression parser, `detectFields()`, `readDataFile()`, `generateWorkbook()`, `buildPreview()`, file name utils |
| `webapp/src/components/Layout.tsx` | Thêm menu item "Excel Generator" trong sidebar |

### 7. Schema / SQL changes

```sql
-- Bảng metadata template
CREATE TABLE IF NOT EXISTS public.excel_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  storage_path text NOT NULL,                 -- file export template
  import_template_path text,                  -- file import mẫu
  template_header_row integer NOT NULL DEFAULT 0, -- row chứa tên trường trong export template (0-based)
  import_header_row integer NOT NULL DEFAULT 0,   -- row chứa tên trường trong import mẫu (0-based)
  fields jsonb DEFAULT '[]',                  -- tên trường từ export template header row
  import_headers jsonb DEFAULT '[]',          -- headers đã detect từ file import mẫu
  column_mapping jsonb DEFAULT '{}',          -- mapping: { fieldName -> {type, value} }
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_excel_templates_created_by ON public.excel_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_excel_templates_name ON public.excel_templates(name);

ALTER TABLE public.excel_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated to read excel_templates" ON public.excel_templates;
CREATE POLICY "Allow all authenticated to read excel_templates"
  ON public.excel_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin to insert excel_templates" ON public.excel_templates;
CREATE POLICY "Allow admin to insert excel_templates"
  ON public.excel_templates FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow admin to delete excel_templates" ON public.excel_templates;
CREATE POLICY "Allow admin to delete excel_templates"
  ON public.excel_templates FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Bảng lịch sử generate
CREATE TABLE IF NOT EXISTS public.excel_generation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.excel_templates(id) ON DELETE SET NULL,
  original_file_name text NOT NULL,
  original_storage_path text NOT NULL,
  generated_file_name text NOT NULL,
  generated_storage_path text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  matched_placeholders jsonb DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_excel_generation_logs_created_by ON public.excel_generation_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_excel_generation_logs_template ON public.excel_generation_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_excel_generation_logs_created_at ON public.excel_generation_logs(created_at DESC);

ALTER TABLE public.excel_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated to read own excel_generation_logs" ON public.excel_generation_logs;
CREATE POLICY "Allow all authenticated to read own excel_generation_logs"
  ON public.excel_generation_logs FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Allow all authenticated to insert excel_generation_logs" ON public.excel_generation_logs;
CREATE POLICY "Allow all authenticated to insert excel_generation_logs"
  ON public.excel_generation_logs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Allow admin to delete excel_generation_logs" ON public.excel_generation_logs;
CREATE POLICY "Allow admin to delete excel_generation_logs"
  ON public.excel_generation_logs FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Supabase Storage:**
- Tạo bucket `excel-templates` — lưu file template.
- Tạo bucket `excel-generations` — lưu file data gốc và file generate.
- Policies bucket tương tự như trước.

### 8. API / Integration changes
- Không cần API mới ngoài Supabase Storage + DB.
- Frontend đọc template trực tiếp từ Storage qua `supabase.storage.from('excel-templates').download(path)`.

### 9. Test Plan
1. **Upload template (admin):**
   - Upload export template có row 3 chứa: `A`, `B`, `C`, `D`, `E`, `F`.
   - Upload import mẫu có row 1 chứa: `1`, `2`, `3`.
   - Mapping: A→1, B→2, C→3, D→2, E→1, F→"Công ty ERA".
   - Verify DB lưu đúng metadata + fields + mapping.
2. **Expression test:**
   - Export template có cell chứa `(ddmmyy)(R.num)` ở row 3.
   - Generate với 3 dòng data, ngày 29/12/2025.
   - Verify kết quả: `29122501`, `29122502`, `29122503`.
3. **Preview (user):**
   - Chọn template, upload file data khớp headers.
   - Verify auto-apply mapping, preview hiển thị đúng.
4. **Missing column / adjust mapping:**
   - Upload file data thiếu cột.
   - Verify hiện Mapping Panel, user có thể chọn lại hoặc nhập text cố định.
5. **Generate + Download:**
   - Bấm Generate → verify toast + auto download.
   - Verify tên file đúng format.
   - Verify file generate có đúng số dòng data + expression evaluated đúng.
6. **Xóa template:**
   - Admin bấm xóa → verify row DB bị xóa + cả 2 file Storage bị xóa.

### 10. Rollout Plan
1. Chạy migration `017_excel_templates.sql` trên Supabase SQL Editor.
2. Tạo bucket `excel-templates` trong Supabase Dashboard → Storage.
3. Tạo bucket `excel-generations` trong Supabase Dashboard → Storage.
4. Set Storage policies cho cả 2 bucket.
5. Deploy code frontend.
6. Test với template mẫu + data mẫu.

### 11. Notes
- **SheetJS (`xlsx`) đã có sẵn** trong project.
- **File template nên đơn giản:** 1 sheet, expression trong cell values (không trong công thức).
- **Performance:** File data < 5000 dòng nên xử lý ngay trong browser.
- **Encoding:** Hỗ trợ UTF-8 để tiếng Việt không bị lỗi font.
- **Expression và mapping:** Mapping có ưu tiên cao hơn expression. Nếu cell vừa có expression vừa nằm ở trường đã map → giá trị mapping sẽ ghi đè.


---

---

## FEAT-023: Tra cứu upline theo rank trong Excel Generator

- **Đề xuất**: 2026-06-10
- **Status**: `done`
- **Priority**: `high`
- **Hoàn thành**: 2026-06-10

### 1. Mô tả feature
Thêm chức năng **tra cứu upline theo cấp bậc** vào trang Excel Generator. User upload file CSV/Excel chỉ chứa cột `staff_id`, hệ thống tra cứu và trả về:
- `T1` (current_t1_id)
- `T2` (T1 của T1)
- `T3` (T1 của T2)
- `Ngườii giới thiệu` (referrer_id)
- 6 cột rank: `DD`, `SDD`, `GDD`, `SGDD`, `RGDD`, `EGDD` — chứa Staff ID của agent trong upline (T1→T2→T3→Referrer) có rank tương ứng. Nếu nhiều ngườii cùng rank thì ghi tất cả, phân cách bằng dấu phẩy.

Kết quả hiển thị preview trên UI và cho phép tải xuống file Excel.

### 2. Motivation / Why
- User cần tra cứu nhanh chuỗi upline và lọc theo cấp bậc (DD, SDD...) của hàng trăm agent cùng lúc.
- Không cần mở từng Agent Detail để kiểm tra T1, T2, T3.
- Export ra Excel để lưu trữ hoặc báo cáo.

### 3. Scope

**In scope:**
- Upload file CSV/Excel (.csv, .xlsx) với header `staff_id`.
- Parse file (dùng logic CSV parse đã có để giữ nguyên text).
- Gọi PostgreSQL RPC `get_agent_upline_ranks` với mảng staff_ids.
- Hiển thị preview table trên UI.
- Nút "Tải xuống Excel" để xuất kết quả.
- Tab mới `upline` trong `ExcelGeneratorPage`.

**Out of scope:**
- Không lưu lịch sử tra cứu vào DB (không cần bảng mới).
- Không hỗ trợ template/mapping như Mail Merge.
- Không xử lý ngườii giới thiệu khác T1 (dùng `referrer_id` theo yêu cầu user, dù DB trigger đang sync `referrer_id` ↔ `current_t1_id`).

### 4. Technical Design

#### 4.1 Backend — PostgreSQL RPC
Tạo function `get_agent_upline_ranks(p_staff_ids TEXT[])`:

```sql
CREATE OR REPLACE FUNCTION public.get_agent_upline_ranks(p_staff_ids TEXT[])
RETURNS TABLE (
  staff_id TEXT,
  t1_staff_id TEXT,
  t2_staff_id TEXT,
  t3_staff_id TEXT,
  referrer_staff_id TEXT,
  dd_agents TEXT,
  sdd_agents TEXT,
  gdd_agents TEXT,
  sgdd_agents TEXT,
  rgdd_agents TEXT,
  egdd_agents TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      a.staff_id AS input_staff_id,
      t1.staff_id AS s1,
      t2.staff_id AS s2,
      t3.staff_id AS s3,
      ref.staff_id AS sr,
      t1.rank_name AS r1,
      t2.rank_name AS r2,
      t3.rank_name AS r3,
      ref.rank_name AS rr
    FROM public.agents a
    LEFT JOIN public.agents t1 ON t1.id = a.current_t1_id AND t1.deleted_at IS NULL
    LEFT JOIN public.agents t2 ON t2.id = t1.current_t1_id AND t2.deleted_at IS NULL
    LEFT JOIN public.agents t3 ON t3.id = t2.current_t1_id AND t3.deleted_at IS NULL
    LEFT JOIN public.agents ref ON ref.id = a.referrer_id AND ref.deleted_at IS NULL
    WHERE a.staff_id = ANY(p_staff_ids)
      AND a.deleted_at IS NULL
  ),
  unpivoted AS (
    SELECT input_staff_id, s1 AS staff_id, r1 AS rank_name, 1 AS ord FROM base WHERE s1 IS NOT NULL
    UNION ALL
    SELECT input_staff_id, s2, r2, 2 FROM base WHERE s2 IS NOT NULL
    UNION ALL
    SELECT input_staff_id, s3, r3, 3 FROM base WHERE s3 IS NOT NULL
    UNION ALL
    SELECT input_staff_id, sr, rr, 4 FROM base WHERE sr IS NOT NULL
  )
  SELECT 
    b.input_staff_id,
    b.s1 AS t1_staff_id,
    b.s2 AS t2_staff_id,
    b.s3 AS t3_staff_id,
    b.sr AS referrer_staff_id,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'DD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS dd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'SDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS sdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'GDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS gdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'SGDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS sgdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'RGDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS rgdd_agents,
    STRING_AGG(CASE WHEN u.rank_name ILIKE 'EGDD' THEN u.staff_id END, ', ' ORDER BY u.ord) AS egdd_agents
  FROM base b
  LEFT JOIN unpivoted u ON u.input_staff_id = b.input_staff_id
  GROUP BY b.input_staff_id, b.s1, b.s2, b.s3, b.sr
  ORDER BY b.input_staff_id;
END;
$$;
```

**Giải thích:**
- `base`: Self-join `agents` 3 lần để lấy T1, T2, T3 + referrer.
- `unpivoted`: Chuyển 4 cột ngang thành dọc để aggregate dễ hơn.
- `STRING_AGG` + `CASE`: Mỗi cột rank chỉ gom các `staff_id` có rank tương ứng. `NULL` bị bỏ qua tự động.

#### 4.2 Frontend
- **Tab mới** `upline` trong `ExcelGeneratorPage` (thứ 4, cạnh `generate`, `history`, `templates`).
- **Component** `UplineLookupPanel`:
  1. **Upload zone**: Dropzone hoặc input file, hỗ trợ `.csv`, `.xlsx`. Max 10,000 rows / 10MB.
  2. **Parse**: 
     - CSV → dùng `parseCsvText()` hoặc `readCsvFile()` từ `excel-generator.ts` (giữ nguyên text, tránh auto-convert số).
     - XLSX → dùng `XLSX.read` + `sheet_to_json` với `header: 1` để lấy raw text.
  3. **Validate**: Kiểm tra có cột `staff_id` (không phân biệt hoa thường, trim space).
  4. **Query**: Gọi `supabase.rpc('get_agent_upline_ranks', { p_staff_ids: staffIds })`.
  5. **Preview**: Table hiển thị 11 cột (Staff ID, T1, T2, T3, Referrer, DD, SDD, GDD, SGDD, RGDD, EGDD).
  6. **Download**: Dùng `XLSX.utils.aoa_to_sheet` + `XLSX.writeFile` để tạo Excel từ dữ liệu preview.

### 5. UI/UX
- Tab label: **"Tra cứu upline"** (icon: `Search` hoặc `Users` từ Lucide).
- Upload zone: giống style dropzone hiện tại trong `UploadPage` / `GeneratePanel`.
- Preview table: scroll ngang nếu cần, max-height ~500px.
- Nút "Tải xuống Excel" disabled nếu chưa có kết quả.
- Loading state khi đang query Supabase.
- Empty state: "Chưa có dữ liệu" hoặc "Không tìm thấy agent nào".

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/migrations/016_agent_upline_ranks.sql` | **Mới** — RPC `get_agent_upline_ranks` |
| `src/types/index.ts` | Thêm interface `AgentUplineRankResult` |
| `src/components/excel-generator/UplineLookupPanel.tsx` | **Mới** — UI upload, preview, download |
| `src/pages/ExcelGeneratorPage.tsx` | Thêm tab `upline` vào tab list |

### 7. Schema / SQL changes
```sql
-- File: supabase/migrations/015_agent_upline_ranks.sql
-- (xem chi tiết ở Technical Design 4.1)
```
- Không cần bảng mới, không cần RLS (function là `SECURITY DEFINER`, trả về public data).

### 8. API / Integration changes
- RPC mới: `get_agent_upline_ranks(p_staff_ids TEXT[])`.
- Không cần Edge Function, không cần third-party API.

### 9. Test Plan
1. Chuẩn bị file CSV 3 dòng: `staff_id` = agent có T1, T2, T3 và referrer khác null.
2. Upload → verify preview hiển thị đúng T1, T2, T3, Referrer.
3. Nếu T2 có rank `DD` và Referrer cũng có rank `DD` → cột DD hiển thị `staff_id_T2, staff_id_Referrer`.
4. Nếu agent không có T1 → T1, T2, T3, Referrer để trống.
5. Nếu staff_id không tồn tại trong DB → không xuất hiện trong kết quả.
6. Download Excel → mở file verify đúng 11 cột, đúng số dòng.
7. Test file `.xlsx` thay vì `.csv` → kết quả tương tự.
8. Test với 1,000+ rows → verify không timeout, Supabase RPC xử lý nhanh.

### 10. Rollout Plan
1. Viết migration `015_agent_upline_ranks.sql`, chạy thử trên Supabase SQL Editor.
2. Test RPC với vài `staff_id` sample: `SELECT * FROM get_agent_upline_ranks(ARRAY['E001', 'E002']);`
3. Code frontend: `UplineLookupPanel.tsx` + cập nhật `ExcelGeneratorPage.tsx`.
4. Test end-to-end local: upload CSV → preview → download.
5. Build: `npm run build`.
6. Deploy frontend khi user xác nhận.

### 11. Notes
- **Referrer vs T1**: `referrer_id` trong DB được trigger đồng bộ với `current_t1_id`, nên cột "Ngườii giới thiệu" sẽ luôn bằng T1. Nếu sau này business yêu cầu khác (ngườii giới thiệu = `introducing_agent_id`), cần điều chỉnh RPC và component. Hiện tại làm theo xác nhận của user (dùng `referrer_id`).
- **Case-insensitive rank**: Dùng `ILIKE` trong SQL để khớp rank không phân biệt hoa thường.
- **Performance**: Self-join 3 lần + aggregate. Với ~10,000 input rows và DB có ~3,000 agents, query vẫn nhanh vì chỉ join trên index `agents(id)` và `agents(staff_id)`.
- **CSV Parse**: Tuyệt đối dùng raw text parser cho CSV để tránh SheetJS auto-convert số/date (xem KNOWLEDGE.md section 4.6, 4.7).
