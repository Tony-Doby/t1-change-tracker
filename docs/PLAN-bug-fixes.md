# Plan Bug Fixes — T1 Change Tracker

> File này dùng để lập kế hoạch chi tiết cho **các bug đang active** trước khi tiến hành fix.
> Quy tắc: **Mỗi bug phải có 1 plan rõ ràng trong file này trước khi code.**
> Sau khi fix xong, cập nhật trạng thái `status: fixed`, ghi vào `CHANGELOG.md`, và chuyển sang `PLAN-bug-archive.md`.

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
| — | *Chưa có bug active* | — | — | — |

---

*Các bug đã fix được lưu tại `PLAN-bug-archive.md`.*
