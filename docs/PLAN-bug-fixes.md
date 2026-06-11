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
| 021 | M1 Transition task không bị resolved khi agent hoàn tất chuyển T1 | planned | 2026-06-05 | — |
| 022 | B2PendingAlert không hiển thị do addBusinessDays parse ISO datetime sai | fixed | 2026-06-11 | 2026-06-11 |
| 023 | Dropdown placeholder trong HtmlEditor bị cắt và không scroll được | fixed | 2026-06-11 | 2026-06-11 |
| 024 | Placeholder `{{tempT1Name}}` bị trùng giá trị với `{{oldT1Name}}` | fixed | 2026-06-11 | 2026-06-11 |
| 025 | ComposeTemplateModal load sai T1 cũ / Temp T1 / New T1 | fixed | 2026-06-11 | 2026-06-11 |
| 026 | ComposeTemplateModal query `t1_requests` bị 400 Bad Request do cú pháp `.not('status', 'in', ...)` sai | fixed | 2026-06-11 | 2026-06-11 |
| 027 | ComposeTemplateModal lấy nhầm request khi agent có nhiều request | fixed | 2026-06-11 | 2026-06-11 |

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
- **Status**: `planned`
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
