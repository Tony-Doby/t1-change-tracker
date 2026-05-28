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
| 001 | M1 không được chuyển khi `old_t1_id = null` | fixed | 2026-05-27 | 2026-05-27 |
| 002 | Agent không tìm thấy do Supabase `max-rows` limit | fixed | 2026-05-27 | 2026-05-28 |
| 003 | Soạn mẫu email không lấy nội dung từ DB | fixed | 2026-05-28 | 2026-05-28 |
| 004 | Modal soạn mẫu bị đẩy lên trên, mất nút X | fixed | 2026-05-28 | 2026-05-28 |
| 005 | Hardcoded T1 mới trong email, thiếu newT1StaffId | fixed | 2026-05-28 | 2026-05-28 |
| 006 | Modal bị cắt trong container do PageTransition transform | fixed | 2026-05-28 | 2026-05-28 |
| 007 | M1 Transition UI cải tiến: T1 tạm, quick actions, link agent | fixed | 2026-05-28 | 2026-05-28 |
| 008 | DivisionsPage: Head Agent input yêu cầu UUID, bảng không scroll | fixed | 2026-05-29 | 2026-05-29 |
| 009 | AgentsPage không hiển thị Division — Schema gap division_id INTEGER vs UUID | fixed | 2026-05-29 | 2026-05-29 |

---

## BUG-001: M1 không được chuyển khi `old_t1_id = null`

- **Phát hiện**: 2026-05-27
- **Status**: `fixed`
- **Severity**: `critical`

### 1. Mô tả bug
Request #f7e77204 — Trần Vĩnh Phi Long (LT36739) có 191 M1, chuyển sang T1 mới. Sau khi hoàn tất request, 191 M1 vẫn còn dưới line cũ. Dashboard M1 Transition không cập nhật thêm task nào.

### 2. Root Cause
`completeRequestAction` wrap toàn bộ logic M1 trong `if (request.old_t1_id)`. Khi `old_t1_id = null`, block bị skip hoàn toàn → không query M1s, không tạo transition tasks, không update `current_t1_id` cho M1s.

### 3. SQL Verify
```sql
SELECT id, agent_id, old_t1_id, status
FROM t1_requests
WHERE id::text LIKE 'f7e77204%';
-- old_t1_id = null

SELECT COUNT(*) FROM agents
WHERE current_t1_id = (SELECT id FROM agents WHERE staff_id = 'LT36739')
AND deleted_at IS NULL;
-- 191 M1 vẫn còn

SELECT COUNT(*) FROM m1_transition_tasks
WHERE parent_request_id IN (
  SELECT id FROM t1_requests WHERE id::text LIKE 'f7e77204%'
);
-- 0 task
```

### 4. Solution
- Tách logic query M1 + tạo tasks + update M1s ra khỏi `if (old_t1_id)`.
- Cho phép `m1_transition_tasks.temp_t1_id` nullable.
- Khi `old_t1_id = null`, task được tạo với `temp_t1_id = null`, M1s được set `current_t1_id = null`.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `supabase/migrations/004_fix_m1_null_temp_t1.sql` | `ALTER TABLE ... DROP NOT NULL` cho `temp_t1_id` |
| `src/types/index.ts` | `temp_t1_id: string \| null` |
| `src/lib/request-actions.ts` | Tách M1 logic khỏi `if (old_t1_id)` |
| `src/pages/DashboardPage.tsx` | UI hiển thị "Không có T1 tạm" khi `temp_t1_id = null` |
| `docs/CHANGELOG.md` | Ghi nhận fix |

### 6. Schema / SQL changes
```sql
ALTER TABLE public.m1_transition_tasks
ALTER COLUMN temp_t1_id DROP NOT NULL;
```
> ⚠️ Chạy thủ công trên Supabase SQL Editor.

### 7. Test Plan
1. Tạo agent A không có T1 (`current_t1_id = null`), gán 2-3 M1.
2. Tạo request → hoàn tất.
3. Verify:
   - Agent A có T1 mới ✅
   - M1s có `current_t1_id = null` ✅
   - `m1_transition_tasks` tạo với `temp_t1_id = null` ✅
   - Dashboard hiển thị "Không có T1 tạm" ✅

### 8. Notes
- **Business rule đã xác nhận**: Agent không có T1 → M1 không có T2 tạm, vẫn được xử lý 30 ngày + eligibility.
- **Rollback**: `ALTER TABLE ... ALTER COLUMN temp_t1_id SET NOT NULL;` (nhưng sẽ break data mới).

---

## BUG-002: Agent không tìm thấy do Supabase `max-rows` limit

- **Phát hiện**: 2026-05-27
- **Status**: `fixed`
- **Severity**: `high`

### 1. Mô tả bug
Agent Lê Vạn Lý - LL60640 có trong DB (`deleted_at = null`, `status = active`), nhưng không tìm thấy khi search trong AgentsPage. Agent này được tạo ngày 2026-04-12 (cũ), trong khi top agents hiển thị bắt đầu từ 2026-05-13.

### 2. Root Cause
- `AgentsPage` query toàn bộ agents không có `.limit()`.
- Supabase REST API có setting `max-rows` mặc định (1000).
- DB có 2549 agents → API chỉ trả về ~1000 agents mới nhất.
- Search là client-side trên subset đã load → agents cũ hơn bị "mất" khỏi search.

### 3. SQL Verify
```sql
-- Tổng số agents
SELECT COUNT(*) FROM agents WHERE deleted_at IS NULL;
-- Result: 2549

-- Agent bị miss
SELECT staff_id, full_name, created_at
FROM agents
WHERE staff_id = 'LL60640';
-- Result: created_at = 2026-04-12

-- Top 50 mới nhất (để so sánh)
SELECT staff_id, created_at
FROM agents
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;
-- Result: toàn bộ từ 2026-05-13 trở đi
```

### 4. Solution
Chuyển search + pagination sang **server-side**:
- Search dùng `.or('full_name.ilike...staff_id.ilike...')` gọi trực tiếp Supabase.
- Pagination dùng `.range(from, to)` server-side.
- Count dùng `.select('*', { count: 'exact', head: true })`.

**Phân bổ từng bước:**
1. **Bước 1 (MVP)**: Chỉ chuyển search + pagination cơ bản. Giữ quick filter presets đơn giản (`all`, `no_t1`, `bookmarked`).
2. **Bước 2 (Nâng cao)**: Viết RPC PostgreSQL `search_agents(p_search, p_filter, p_page)` nếu presets phức tạp (`near_91d`, `quota_exceeded`) cần tính eligibility server-side.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/AgentsPage.tsx` | Refactor load/search/filter/pagination sang server-side |
| `src/components/ExportModal.tsx` | Export cần query riêng không bị giới hạn pagination |

### 6. Schema / SQL changes
Không cần schema change. Có thể tùy chọn tăng `max-rows` trong Supabase Dashboard (hướng A) nhưng không khuyến nghị vì không giải quyết root cause scalability.

### 7. Test Plan
1. Search `LL60640` → phải tìm thấy ngay
2. Search tên tiếng Việt có dấu (`Lê Vạn Lý`) → phải tìm thấy
3. Phân trang: chuyển trang 2, 3... → data load đúng
4. Filter `no_t1` + search kết hợp → hoạt động đúng
5. Export toàn bộ vẫn lấy đủ 2549 agents

### 8. Notes
- **Trade-off**: Quick filter presets `near_91d`, `near_180d`, `quota_exceeded` cần eligibility engine. Nếu giữ client-side, vẫn cần load đủ data (vẫn gặp max-rows). Giải pháp: chuyển presets phức tạp sang RPC hoặc bỏ tạm thờii.
- **Debounce**: Search input cần debounce (ví dụ 300ms) để tránh gọi API liên tục.
- **T1 Map**: Vì chỉ load 10 rows/trang, T1 info có thể query riêng cho 10 rows hiển thị (hoặc dùng Supabase foreign key embedding `current_t1_id(...)`).
- **Performance**: Server-side search với `ilike` trên 2500 rows vẫn nhanh (Postgres index trên `full_name`, `staff_id` nếu cần).

---

---

## BUG-003: Soạn mẫu email không lấy nội dung từ DB

- **Phát hiện**: 2026-05-28
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
Khi admin sửa nội dung mẫu email trong `EmailTemplatesPage` và lưu vào DB, sau đó mở modal soạn thư (`ComposeTemplateModal`) từ AgentsPage để gửi cho agent, modal vẫn hiển thị nội dung cũ (hardcoded) thay vì nội dung mới từ DB.

### 2. Root Cause
- `EmailTemplatesPage` lưu templates vào bảng `email_templates` (Supabase DB).
- `ComposeTemplateModal.tsx` dùng mảng `templates` **hardcoded** trong file, không query từ DB.
- `rendered` useMemo chỉ thay thế placeholders trên body cứng, hoàn toàn bỏ qua dữ liệu DB.

### 3. SQL Verify
```sql
-- Kiểm tra template trong DB đã được cập nhật
SELECT template_key, name, body, updated_at
FROM email_templates
WHERE template_key IN ('transfer_complete','30_days_notice','temp_t1_assigned')
ORDER BY updated_at DESC;
```

### 4. Solution
- Trong `ComposeTemplateModal.tsx`, thêm `useEffect` để query `email_templates` từ Supabase.
- Map kết quả DB theo `template_key` để lấy `subject` và `body` động.
- Giữ mảng hardcoded làm **fallback** nếu DB chưa có row hoặc query fail.
- `rendered` useMemo vẫn giữ logic replace placeholders, nhưng dùng `body` từ DB thay vì hardcoded.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Query `email_templates` từ DB, merge với fallback hardcoded, dùng DB body/subject |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Vào Email Templates, sửa nội dung 1 template → Lưu.
2. Vào AgentsPage, chọn 1 agent, bấm "Soạn mẫu thông báo".
3. Chọn loại mẫu vừa sửa → verify nội dung hiển thị là nội dung mới từ DB.
4. Tắt modal, đổi sang agent khác, mở lại → vẫn hiển thị đúng nội dung DB.
5. (Edge case) Nếu bảng `email_templates` trống → fallback về nội dung hardcoded.

### 8. Notes
- Cần đảm bảo `template_key` trong DB khớp với `key` trong code (`transfer_complete`, `30_days_notice`, `temp_t1_assigned`).
- Không ảnh hưởng đến `EmailTemplatesPage` vì trang đó đã query đúng từ DB.

---

---

## BUG-004: Modal soạn mẫu bị đẩy lên trên, mất nút X

- **Phát hiện**: 2026-05-28
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
Modal "Soạn mẫu thông báo" (`ComposeTemplateModal`) khi mở bị đẩy lên gần header app, phần header của modal (tiêu đề + nút X đóng) bị ẩn/mất khỏi viewport. Ngườii dùng không thể đóng modal bằng nút X.

### 2. Root Cause
- Wrapper ngoài dùng `fixed inset-0 flex items-center justify-center` nhưng **thiếu `overflow-y-auto`**.
- Inner modal dùng `max-h-[90vh] overflow-y-auto` → toàn bộ modal (header + content + footer) cuộn chung trong 1 container.
- Khi nội dung dài (textarea 10 dòng + nhiều section), chiều cao modal tiến gần `90vh`. Kết hợp với `items-center` trên wrapper, phần header bị đẩy lên ngoài viewport trên (bị cắt).
- Nút X nằm trong header nên bị ẩn theo.

### 3. SQL Verify
Không cần.

### 4. Solution
Restructure modal layout theo pattern chuẩn:
- **Wrapper ngoài:** Thêm `overflow-y-auto` để toàn bộ trang có thể cuộn khi modal cao hơn viewport.
- **Inner modal:** Bỏ `max-h-[90vh] overflow-y-auto`, thay bằng `my-auto` để tự căn giữa an toàn mà không bị cắt header.
- **Alternative (nếu muốn header sticky):** Giữ `overflow-y-auto` trên body riêng, header/footer `shrink-0`.

Chọn option `my-auto` vì đơn giản, không cần tính toán chiều cao.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Sửa wrapper class: thêm `overflow-y-auto`; sửa inner class: bỏ `max-h-[90vh] overflow-y-auto`, thêm `my-auto` |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở modal soạn thư từ AgentsPage (chọn agent có nhiều info / T1 cũ).
2. Verify header modal luôn hiển thị: có tiêu đề "Soạn mẫu thông báo" + nút X.
3. Verify modal không bị đẩy sát lên trên (cách header app một khoảng hợp lý).
4. Thu nhỏ viewport chiều cao (hoặc zoom in) → wrapper cho phép cuộn, header không bị mất.
5. Nút X phải clickable và đóng modal đúng.

### 8. Notes
- Bug này có thể ảnh hưởng đến các modal khác nếu dùng chung pattern cũ (`items-center` + `max-h-[90vh] overflow-y-auto`). Nhưng fix tập trung `ComposeTemplateModal` trước.
- Nếu user muốn unify pattern cho toàn bộ modal sau này, cần audit các component: `Modal.tsx`, `ExportModal.tsx`, `CreateRequestModal.tsx`, v.v.

---

---

## BUG-005: Hardcoded T1 mới trong email, thiếu newT1StaffId

- **Phát hiện**: 2026-05-28
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
`ComposeTemplateModal` hiển thị T1 mới hardcoded là `'Lê Thị D'` / `'ltd@era.com'` cho mọi agent, dù thực tế T1 dự kiến khác (ví dụ: Lê Hoàng Hiệp → Vũ Thị Thu Trang - TV22904). Ngoài ra chưa có placeholder `{{newT1StaffId}}` để chèn mã NV của T1 dự kiến.

### 2. Root Cause
- Trong `ComposeTemplateModal.tsx`, `rendered` dùng `.replace(/{{newT1Name}}/g, 'Lê Thị D')` và `.replace(/{{newT1Email}}/g, 'ltd@era.com')` — hoàn toàn hardcoded.
- Modal chỉ nhận `agentId`, không query `t1_requests` để biết T1 mới dự kiến (`proposed_new_t1_id`) của agent.
- `EmailTemplatesPage.tsx` chưa có `{{newT1StaffId}}` trong `defaultPlaceholders`.

### 3. SQL Verify
```sql
-- Request active của agent Lê Hoàng Hiệp (HL30102)
SELECT r.id, r.agent_id, r.proposed_new_t1_id, a.full_name, a.staff_id, a.email
FROM t1_requests r
JOIN agents a ON a.id = r.proposed_new_t1_id
WHERE r.agent_id = (SELECT id FROM agents WHERE staff_id = 'HL30102')
AND r.status NOT IN ('completed', 'cancelled')
ORDER BY r.created_at DESC
LIMIT 1;
```

### 4. Solution
1. Trong `ComposeTemplateModal.tsx`:
   - Sau khi load agent, query `t1_requests` lấy request active mới nhất của agent.
   - Nếu có `proposed_new_t1_id`, query bảng `agents` lấy `full_name`, `staff_id`, `email` của T1 mới.
   - Thêm state `newT1` lưu thông tin T1 dự kiến.
   - `rendered` replace `{{newT1Name}}`, `{{newT1Email}}`, `{{newT1StaffId}}` từ `newT1`.
   - Nếu không có request active → các placeholder thay bằng `''` hoặc text mặc định.
2. Trong `EmailTemplatesPage.tsx`:
   - Thêm `{{newT1StaffId}}` vào `defaultPlaceholders`.
   - Cập nhật `getPreview` xử lý placeholder mới.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Query request active + T1 mới; thêm state `newT1`; replace placeholders động |
| `src/pages/EmailTemplatesPage.tsx` | Thêm `{{newT1StaffId}}` vào placeholders và preview |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Chọn agent **có request active** (chưa hoàn tất) với T1 mới X → modal hiển thị đúng tên + staff_id + email của X trong `{{newT1Name}}`, `{{newT1StaffId}}`, `{{newT1Email}}`.
2. Chọn agent **không có request active** → các placeholder T1 mới để trống, modal vẫn mở bình thường.
3. Chọn loại mẫu khác nhau → nội dung đúng với template DB + data agent/T1.
4. Copy nội dung → verify `newT1StaffId` xuất hiện đúng.

### 8. Notes
- Query cần xử lý case agent có nhiều request active (lấy `created_at` mới nhất).
- `t1_requests.status` cần exclude `completed` và `cancelled`.

---

---

## BUG-006: Modal bị cắt trong container do PageTransition transform

- **Phát hiện**: 2026-05-28
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
Modal `ComposeTemplateModal` (và có thể các modal khác) bị giới hạn bên trong khung content thay vì overlay toàn màn hình. Phần bên phải modal bị cắt bởi container cha.

### 2. Root Cause
- `App.tsx` bọc mọi page trong `<PageTransition>`.
- `PageTransition` áp dụng CSS animation `fade-in` có `transform: translateY(8px)`.
- `transform` trên ancestor tạo **stacking context mới**.
- Theo spec trình duyệt (WebKit/Blink), `position: fixed` bên trong stacking context có `transform` bị "trapped" — nó không còn relative to viewport mà bị giới hạn bởi container cha.
→ Modal `fixed inset-0` bị cắt bởi `Layout > main` container.

### 3. SQL Verify
Không cần.

### 4. Solution
**Option A:** Sửa `PageTransition` bỏ `transform` trong keyframes, chỉ giữ `opacity`.
- Pros: Đơn giản.
- Cons: Mất hiệu ứng trượt lên (`translateY`) khi chuyển trang, ảnh hưởng toàn app.

**Option B (Recommended):** Dùng **React Portal** trong `ComposeTemplateModal` để render modal ra `document.body`.
- Pros: Chuẩn nhất cho modal; không ảnh hưởng animation toàn app; fix triệt để mọi stacking context issue.
- Cons: Cần refactor modal dùng `createPortal`.

Chọn **Option B**.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/components/ComposeTemplateModal.tsx` | Import `createPortal` từ React; wrap return JSX trong `createPortal(..., document.body)` |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở modal soạn thư từ AgentsPage.
2. Verify modal overlay toàn màn hình, không bị cắt bởi container cha.
3. Verify header + nút X luôn hiển thị đúng vị trí.
4. Verify đóng modal bằng nút X vẫn hoạt động.
5. Verify click outside (backdrop) vẫn hoạt động nếu có.

### 8. Notes
- Nếu các modal khác cũng gặp issue tương tự (`Modal.tsx`, `ExportModal.tsx`, `CreateRequestModal.tsx`), cần áp dụng Portal cho toàn bộ sau này.

---

---

## BUG-007: M1 Transition UI cải tiến: T1 tạm, quick actions, link agent

- **Phát hiện**: 2026-05-28
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả
Dashboard M1 Transition cần cải thiện UX:
1. Text hiển thị "T2 tạm" sai → phải là **"T1 tạm"**.
2. T1 tạm chỉ hiển thị tên, thiếu Staff ID → cần format **tên (staff_id)**.
3. Thiếu quick actions cho từng M1: Tạo email mẫu, Tạo đề xuất, Ở lại với T2.
4. Tên M1 chưa clickable → cần link sang trang `/agents/:id`.

### 2. Root Cause
- `DashboardPage.tsx` hardcoded text "T2 tạm".
- `temp_t1` query chỉ lấy `full_name`, thiếu `staff_id`.
- UI chỉ có nút "Áp dụng T2" khi expired, chưa có các action khác.

### 3. Solution
**Data:**
- Query `m1_transition_tasks` thêm `m1_agent: m1_agent_id(full_name, staff_id, contract_signing_date, rank_name)` để check eligibility.
- Query toàn bộ `t1_changes` (hoặc ít nhất cho m1_agents trong list) để dùng `checkEligibility`.

**UI mỗi M1 item:**
- **Tên M1**: `<Link>` đến `/agents/${t.m1_agent_id}` với format `Họ tên (staff_id)`.
- **T1 tạm**: Text "T1 tạm: {tên} ({staff_id})".
- **Quick Buttons** (bên phải mỗi row):
  - `Tạo email mẫu`: Mở `ComposeTemplateModal` với `agentId = t.m1_agent_id`. Disabled/mờ nếu `checkEligibility` return `eligible = false`.
  - `Tạo đề xuất`: Mở `CreateRequestModal` với `agentId = t.m1_agent_id`.
  - `Ở lại với T2`: Mở `CountdownConfirmModal` 10s. Nếu confirm → gọi `applyT2(task)` như logic hiện tại.

### 4. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/DashboardPage.tsx` | Query thêm fields eligibility; thêm state modals (email, request, confirm); refactor render M1 list với Link + buttons |
| `src/components/ComposeTemplateModal.tsx` | Đảm bảo dùng `createPortal` đã có (OK) |
| `src/components/CreateRequestModal.tsx` | Không cần sửa, dùng component sẵn có |

### 5. Schema / SQL changes
Không cần.

### 6. Test Plan
1. Dashboard M1 Transition hiển thị "T1 tạm" thay vì "T2 tạm".
2. T1 tạm hiển thị đúng format `tên (staff_id)`.
3. Click tên M1 → navigate đúng `/agents/:id`.
4. Agent đủ eligibility → nút "Tạo email mẫu" enabled, click mở modal đúng agent.
5. Agent không đủ eligibility (ví dụ ASC) → nút "Tạo email mẫu" disabled/mờ.
6. "Tạo đề xuất" mở `CreateRequestModal` đúng agent.
7. "Ở lại với T2" mở countdown 10s, confirm xong → cập nhật DB + toast thành công.

### 7. Notes
- Cần import `ComposeTemplateModal`, `CreateRequestModal`, `CountdownConfirmModal` trong DashboardPage.
- Nút "Tạo email mẫu" disabled style: `opacity-50 cursor-not-allowed`.
- Nên giữ nút "Áp dụng T2" cũ cho expired tasks (hoặc thay bằng "Ở lại với T2" với countdown).

---

## Hướng dẫn thêm bug mới

Khi phát hiện bug mới:
1. Copy template ở đầu file.
2. Điền thông tin, đặt `status: investigating`.
3. Chạy SQL verify để xác nhận root cause.
4. Cập nhật `status: planned` khi có solution rõ ràng.
5. **Chỉ code sau khi plan được review/approve.**
6. Sau khi fix xong: `status: fixed`, ghi `CHANGELOG.md`, cập nhật `Ngày fix` trong Bug Registry.

---

---

## BUG-008: DivisionsPage — Head Agent input yêu cầu UUID, bảng không scroll

- **Phát hiện**: 2026-05-29
- **Status**: `fixed`
- **Severity**: `medium`

### 1. Mô tả bug
**Vấn đề A — Head Agent input không usable:**
Form "Sửa division" dùng `<input type="text">` với placeholder `"UUID của agent"` cho field `head_agent_id`. Admin không thể nhớ UUID của agent → không thể gán head division một cách thực tế.

**Vấn đề B — Bảng divisions chiếm quá nhiều chiều cao:**
Bảng hiển thị toàn bộ 29 divisions (và sẽ tăng), không giới hạn chiều cao → page dài, khó quan sát.

### 2. Root Cause
- `DivisionsPage.tsx` dùng input text thuần cho `head_agent_id` (line 141-147).
- Bảng `<table>` không có `max-height` hay `overflow-y-auto` trên `tbody`.

### 3. SQL Verify
Không cần.

### 4. Solution
**Vấn đề A — Searchable Dropdown:**
Thay `<input type="text">` bằng component tự implement:
- Input search cho phép gõ tên hoặc staff_id.
- `useEffect` debounce (300ms) gọi Supabase query: `.from('agents').select('id, full_name, staff_id').or('full_name.ilike.%term%,staff_id.ilike.%term%').limit(10)`.
- Dropdown hiển thị kết quả: `{full_name} ({staff_id})`.
- Click chọn → set `form.head_agent_id = agent.id` (UUID), hiển thị label đã chọn.
- Nút "×" để clear selection.
- Khi edit mode, pre-populate với agent đã chọn (query agent theo `editing.head_agent_id`).

**Vấn đề B — Table scroll:**
- Wrap `tbody` trong `<div className="max-h-[400px] overflow-y-auto">` hoặc dùng CSS grid/flex để giữ header cố định.
- Alternative: Giữ nguyên table structure, wrap toàn bộ table trong container có `max-height` và `overflow-y-auto`, dùng `sticky` cho `thead`.

Chọn **Alternative (sticky header)** vì đơn giản, không đổi structure table.

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `src/pages/DivisionsPage.tsx` | Thay input UUID → searchable dropdown; wrap table trong scroll container với sticky header |

### 6. Schema / SQL changes
Không cần.

### 7. Test Plan
1. Mở DivisionsPage → bảng hiển thị max ~10 dòng, có scroll nếu >10.
2. Header bảng (`Tên`, `Trưởng nhóm`, ...) sticky khi scroll.
3. Click "Sửa" division → form hiển thị tên + head agent hiện tại (nếu có).
4. Focus vào input Head Agent → gõ tên agent (ví dụ: "Lê") → dropdown hiện kết quả matching.
5. Click 1 kết quả → input hiển thị `Họ tên (staff_id)`, form lưu đúng UUID.
6. Bấm "Cập nhật" → reload bảng, cột Trưởng nhóm hiển thị đúng.
7. Clear head agent (nút ×) → bấm "Cập nhật" → division không còn head agent.

### 8. Notes
- Search dropdown chỉ query agents `deleted_at IS NULL` và `status = 'active'` để tránh chọn agent đã nghỉ.
- Không dùng thư viện UI bên ngoài (giữ lightweight, đã có pattern tương tự trong app).

---

---

## BUG-009: AgentsPage không hiển thị Division — Schema gap `agents.division_id` INTEGER vs UUID

- **Phát hiện**: 2026-05-29
- **Status**: `planned`
- **Severity**: `high`

### 1. Mô tả bug
**A. Frontend:** `AgentsPage.tsx` không có cột "Division" trong bảng. Ngườii dùng không thể nhìn thấy agent thuộc division nào.

**B. Schema:** `agents.division_id` được tạo từ migration `001` với kiểu `INTEGER`. Migration `008` tạo bảng `divisions` với `id UUID` và trigger `recompute_division_on_referrer_change` gán `UUID` vào `agents.division_id`. Điều này sẽ **gây lỗi cast kiểu dữ liệu** khi trigger chạy.

### 2. Root Cause
- Migration `001`: `division_id INTEGER` (không có FK, không có bảng divisions)
- Migration `008`: Tạo `divisions.id UUID`, trigger gán UUID → cột INTEGER
- `AgentsPage` chưa query `division_id` và chưa render cột Division vì cũng không thể join INTEGER với UUID

### 3. SQL Verify
```sql
-- Kiểm tra kiểu dữ liệu hiện tại của agents.division_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agents' AND column_name = 'division_id';
-- Expected: data_type = 'integer'

-- Kiểm tra data hiện tại (nếu có)
SELECT division_id, COUNT(*) FROM agents 
WHERE division_id IS NOT NULL AND deleted_at IS NULL 
GROUP BY division_id;

-- Kiểm tra trigger recompute có hoạt động không
-- (Tạo test: update referrer_id của 1 agent → xem có lỗi cast không)
```

### 4. Solution

**Phương án khuyến nghị: Đổi `agents.division_id` từ INTEGER → UUID**

Vì `division_id` cũ là INTEGER không có ý nghĩa business (không map được với bảng `divisions` UUID), data cũ có thể bỏ. Tất cả agents sẽ được recompute division theo business rule (T1 tree → fallback "Khác").

**Các bước thực hiện:**

**Bước 1 — Schema migration:**
```sql
-- Tạo cột UUID mới
ALTER TABLE public.agents ADD COLUMN division_uuid UUID REFERENCES public.divisions(id);

-- Compute division cho toàn bộ agents hiện tại
-- Logic: Tìm head_agent_id đầu tiên trên T1 tree → lấy division của head
-- Nếu không có → gán division "Khác" (is_default = true)
UPDATE public.agents a
SET division_uuid = COALESCE(
  (SELECT d.id FROM public.divisions d 
   WHERE d.head_agent_id = a.id AND d.is_active = true LIMIT 1),
  (SELECT d.id FROM public.divisions d 
   WHERE d.is_default = true LIMIT 1)
);

-- Xóa cột INTEGER cũ
ALTER TABLE public.agents DROP COLUMN division_id;

-- Đổi tên cột mới
ALTER TABLE public.agents RENAME COLUMN division_uuid TO division_id;

-- Tạo index
CREATE INDEX idx_agents_division_id ON public.agents(division_id);

-- Cập nhật trigger recompute: đổi `NEW.division_id` sang đọc/ghi UUID (đã đúng kiểu)
-- Trigger hiện tại dùng `v_division_id UUID` gán vào `division_id`, sau khi đổi kiểu sự hoạt động đúng.
```

**Bước 2 — Update `types/index.ts`:**
- `Agent.division_id`: đổi từ `number | null` → `string | null` (UUID)

**Bước 3 — Update `AgentsPage.tsx`:**
- Query: `.select('*, divisions:division_id(name)')` (Supabase foreign key embedding)
- Hoặc query riêng `divisions` rồi map (tương tự `t1Map`, `rankNamesMap`)
- Thêm cột "Division" vào header và body
- Export: thêm cột Division

**Bước 4 — Update các trang khác (nếu dùng `division_id`):**
- `AgentDetailPage.tsx` — hiển thị division trong info card
- `UploadPage.tsx` — nếu import/export có cột division
- `DashboardPage.tsx` — nếu filter/group theo division

### 5. Files cần sửa
| File | Thay đổi |
|------|----------|
| `supabase/migrations/011_fix_division_id_uuid.sql` | Migration: đổi cột INTEGER→UUID, recompute data, update trigger |
| `src/types/index.ts` | `Agent.division_id: string \| null` |
| `src/pages/AgentsPage.tsx` | Query division, thêm cột Division, update export |
| `src/pages/AgentDetailPage.tsx` | Hiển thị division name trong info card |
| `docs/CHANGELOG.md` | Ghi nhận |

### 6. Schema / SQL changes
```sql
-- Migration file 011_fix_division_id_uuid.sql
ALTER TABLE public.agents ADD COLUMN division_uuid UUID REFERENCES public.divisions(id);

UPDATE public.agents a
SET division_uuid = COALESCE(
  (SELECT d.id FROM public.divisions d WHERE d.head_agent_id = a.id AND d.is_active = true LIMIT 1),
  (SELECT d.id FROM public.divisions d WHERE d.is_default = true LIMIT 1)
);

ALTER TABLE public.agents DROP COLUMN division_id;
ALTER TABLE public.agents RENAME COLUMN division_uuid TO division_id;
CREATE INDEX idx_agents_division_id ON public.agents(division_id);
```
> ⚠️ Chạy thủ công trên Supabase SQL Editor. Backup DB trước.

### 7. Test Plan
1. **Schema test:** Chạy SQL trên dev DB → verify `division_id` kiểu UUID, không còn INTEGER.
2. **Data test:** `SELECT division_id, COUNT(*) FROM agents GROUP BY division_id` → verify không có NULL (hoặc ít nhất agents không có T1 được gán "Khác").
3. **Trigger test:** Update `referrer_id` của 1 agent → verify trigger recompute division đúng (không còn lỗi cast).
4. **Frontend test:** AgentsPage hiển thị cột Division đúng tên.
5. **Detail test:** AgentDetailPage hiển thị division trong info card.
6. **Export test:** Export Excel có cột Division.

### 8. Notes
- **Data cũ mất:** Cột `division_id` INTEGER cũ bị xóa. Data cũ không có ý nghĩa business vì không map được UUID.
- **Recompute:** Tất cả agents sẽ được gán division theo logic: nếu là head → division của họ; nếu không → "Khác". Sau này trigger sẽ tự recompute khi `referrer_id` thay đổi.
- **Performance:** Tạo index `idx_agents_division_id` để query/filter nhanh.
- **Rollback:** Nếu fail, restore từ backup (vì DROP COLUMN + RENAME không revert dễ dàng).
