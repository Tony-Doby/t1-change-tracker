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

---

## BUG-021: M1 Transition task không bị resolved khi agent hoàn tất chuyển T1

- **Phát hiện**: 2026-06-05
- **Status**: `planned`
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

