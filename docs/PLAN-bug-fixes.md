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

## Hướng dẫn thêm bug mới

Khi phát hiện bug mới:
1. Copy template ở đầu file.
2. Điền thông tin, đặt `status: investigating`.
3. Chạy SQL verify để xác nhận root cause.
4. Cập nhật `status: planned` khi có solution rõ ràng.
5. **Chỉ code sau khi plan được review/approve.**
6. Sau khi fix xong: `status: fixed`, ghi `CHANGELOG.md`, cập nhật `Ngày fix` trong Bug Registry.
