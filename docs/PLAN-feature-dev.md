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
| 001 | Tích hợp gửi email thật (Resend + HTML editor) | done | 2026-05-28 | 2026-05-29 |
| 002 | Supabase Realtime updates (comments, status) | backlog | 2026-05-28 | — |
| 003 | In-app Notifications (badge, dropdown) | done | 2026-05-28 | 2026-05-29 |
| 004 | Refactor pages sang TanStack Query | partial | 2026-05-28 | — |
| 005 | Search/Filter server-side cho presets phức tạp | backlog | 2026-05-28 | — |
| 006 | Schema v2 — Align agents table with eravnTrans | done | 2026-05-28 | 2026-05-29 |
| 007 | Agent Deactivation với Restore Point & Downline Transition | done | 2026-05-28 | 2026-05-29 |
| 008 | Division Safety Net — Force Recompute & getAgentDivision RPC | fixed | 2026-05-29 | 2026-05-29 |
| 009 | Dashboard stat cards navigation (→ Agents / Requests / Filter) | done | 2026-05-29 | 2026-05-29 |
| 010 | Requests multi-choice status filter (toggle on/off) | done | 2026-05-29 | 2026-05-29 |
| 011 | Ranks modal CRUD (popup Thêm/Sửa, bỏ footer form) | done | 2026-05-29 | 2026-05-29 |
| 012 | Divisions modal CRUD + table height (popup Thêm/Sửa, bỏ max-h) | done | 2026-05-29 | 2026-05-29 |
| 013 | M1 Transition — Search, T1 cũ + Lý do, Email Tracking | done | 2026-05-29 | 2026-05-29 |
| 014 | Quản lý mẫu email dạng danh sách (list view + modal edit) | done | 2026-05-29 | 2026-05-29 |
| 015 | Thêm mẫu email mới (popup trình soạn thảo) | done | 2026-05-29 | 2026-05-29 |
| 017 | Dashboard B2: Thêm search bar và nút "Tạo email mẫu" | done | 2026-05-29 | 2026-05-29 |
| 018 | ComposeTemplateModal: Refactor email section (1 section, 4 emails, copy từng email) | done | 2026-05-29 | 2026-05-29 |
| 019 | Mail Merge Generator (template + data → file Excel) | done | 2026-06-02 | 2026-06-03 |
| 020 | Excel Generator Enhancements — Inline Field Reference + Uppercase + Chọn ngày generate | done | 2026-06-03 | 2026-06-04 |
| 021 | Excel Generator — Edit Template đã lưu | done | 2026-06-03 | 2026-06-04 |
| REFACTOR-005 | Twenty UI/UX Full Adoption (Tailwind v4 Preserve) | done | 2026-06-04 | 2026-06-05 |

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

## FEAT-002: Supabase Realtime updates (comments, status)

- **Đề xuất**: 2026-05-28
- **Status**: `backlog`
- **Priority**: `medium`

### 1. Mô tả feature
Tích hợp Supabase Realtime để tự động cập nhật UI khi có thay đổi trong database: comments mới, status request thay đổi, activity log mới.

### 2. Motivation / Why
- Hiện tại ngườii dùng phải refresh trang để thấy dữ liệu mới.
- Realtime giúp collaborate tốt hơn khi nhiều ngườii dùng cùng xem 1 request.

### 3. Scope

**In scope:**
- Subscribe `t1_requests` table để cập nhật status/kanban realtime.
- Subscribe `request_comments` để hiển thị comment mới ngay lập tức.
- Subscribe `activity_logs` để cập nhật timeline.

**Out of scope:**
- Realtime cho toàn bộ bảng `agents` (quá nhiều data).
- Broadcast events (dùng cho typing indicator, v.v.).

### 4. Technical Design
- Dùng `supabase.channel()` để lắng nghe `postgres_changes` events.
- Tạo custom hook `useRealtimeTable(table, filter?)` để reusable.
- Trong `RequestDetailPage`: subscribe `request_comments` với filter `request_id = :id`.
- Trong `RequestsPage`: subscribe `t1_requests` để cập nhật kanban/card khi status đổi.
- Trong `ActivityLogPage`: subscribe `activity_logs` để prepend event mới.

### 5. UI/UX
- Comment mới từ ngườii khác: hiển thị ngay trong thread, có hiệu ứng nhẹ (ví dụ: border-left màu xanh trong 2 giây).
- Status đổi: card trong kanban tự động chuyển cột.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `src/hooks/useRealtime.ts` | Hook mới để subscribe Supabase Realtime |
| `src/pages/RequestDetailPage.tsx` | Subscribe comments + request changes |
| `src/pages/RequestsPage.tsx` | Subscribe request status changes |
| `src/pages/ActivityLogPage.tsx` | Subscribe activity logs |

### 7. Schema / SQL changes
- Bật Realtime cho các bảng trong Supabase Dashboard → Database → Replication:
  - `t1_requests`
  - `request_comments`
  - `activity_logs`

### 8. API / Integration changes
- Không cần API mới. Dùng Supabase Realtime client sẵn có.

### 9. Test Plan
1. Mở Request Detail trên tab A (Chrome).
2. Mở cùng request trên tab B (Firefox/Incognito).
3. Tab B thêm comment → verify tab A hiển thị comment mới trong 1-2 giây.
4. Tab B đổi status request → verify tab A cập nhật status.

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

## FEAT-004: Refactor pages sang TanStack Query

- **Đề xuất**: 2026-05-28
- **Status**: `partial`
- **Priority**: `low`

### Current Status (as of 2026-05-29)

**Đã làm:**
- `src/main.tsx` — Đã setup `QueryClientProvider` với `staleTime: 5 phút`, `retry: 1`.
- `@tanstack/react-query` đã cài trong `package.json`.

**Chưa làm:**
- Chưa tạo custom hooks (`useAgents`, `useRequests`, `useAgentDetail`, v.v.).
- Chưa refactor bất kỳ page nào sang dùng `useQuery`/`useMutation`.
- Các page vẫn dùng `useState` + `useEffect` thủ công.

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
- **Status**: `planned`
- **Priority**: `medium`

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
- **Status**: `planned`
- **Priority**: `medium`

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
- **Status**: `planned`
- **Priority**: `medium`

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
- **Status**: `planned`
- **Priority**: `medium`

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
- **Status**: `planned`
- **Priority**: `medium`

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

## FEAT-018: ComposeTemplateModal — Refactor email section (1 section, 4 emails, copy từng email)

- **Đề xuất**: 2026-05-29
- **Status**: `planned`
- **Priority**: `medium`

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

## REFACTOR-005: Twenty UI/UX Full Adoption (Tailwind v4 Preserve)

- **Đề xuất**: 2026-06-04
- **Status**: `in_progress`
- **Priority**: `high`
- **Hoàn thành**: —

### Current Status (as of 2026-06-04)

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
