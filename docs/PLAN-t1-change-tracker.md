# Kế hoạch: T1 Change Tracker App

> **Nền tảng:** Supabase (miễn phí) + React 19 + Vite + Tailwind CSS  
> **Mục tiêu:** App độc lập theo dõi quy trình thay đổi T1 (Mentor) theo chính sách ERA Vietnam 16/04/2026.  
> **Ngưởi dùng:** Admin/Operation (do bạn tự tạo user & cấp pass).  
> **Cập nhật:** 2026-05-25
>
> **Trạng thái: kế hoạch lịch sử.** File này giữ bối cảnh ban đầu, không phải nguồn triển khai hiện hành. Ưu tiên `PLAN-feature-dev.md`, `PLAN-bug-fixes.md`, `CHANGELOG.md`, `KNOWLEDGE.md` và source code. Đặc biệt, workflow hiện tại là **B1 → B2 → B3** và unique key là **`staff_id`**, không phải các mô tả 5 bước/`agent_code` cũ trong phần còn lại của file.

---

## 1. Tóm tắt

Xây dựng một **app độc lập** để theo dõi quy trình thay đổi Ngưởi Mentor (T1) của ERA Vietnam theo chính sách `cs-t1-changes.md`. App cho phép upload data từ Excel/CSV và theo dõi tiến độ từng case đổi T1 qua đúng 5 bước.

**Lý do chọn Supabase:**
- Miễn phí 500MB PostgreSQL + 50,000 user auth/tháng — quá dư cho app này.
- Không cần viết backend riêng (Hono/Node.js). Logic eligibility có thể viết ở frontend hoặc PostgreSQL Function (RPC).
- Auth sẵn có: tạo user, login, session management.
- Dashboard quản lý DB trực quan, dễ export/backup.
- Frontend deploy lên Vercel/Netlify (miễn phí).

---

## 2. Phân tích Nghiệp vụ (đã lọc tài chính)

### 2.1 Các khái niệm cần quản lý
| Khái niệm | Ý nghĩa | Nguồn data |
|-----------|---------|------------|
| **Agent** | Ngưởi tham gia ERA có mã, cấp bậc, ngày ký HĐ | Upload Excel/CSV |
| **T1 (Mentor)** | Ngưởi hướng dẫn trực tiếp | Liên kết từ Agent |
| **M1 (Mentee)** | Tuyến dưới trực tiếp của Agent | Liên kết từ Agent |
| **Đề xuất đổi T1** | Một case/request agent muốn đổi T1 | Tạo thủ công trong app |
| **Lần đổi T1** | Một lần ghi nhận thay đổi thành công | Sinh ra sau khi hoàn tất đề xuất |

### 2.2 Quy tắc nghiệp vụ cần enforce
1. **Giai đoạn ưu đãi 90 ngày**: Từ ngày ký HĐ, agent được đổi T1 tối đa **1 lần**.
2. **Sau 91 ngày**: Chỉ được đổi T1 nếu cấp bậc >= CS/Cấp 1. Tối đa **3 lần** trong suốt thờigian hoạt động (không tính lần T1 tự cắt). Khoảng cách tối thiểu giữa 2 lần: **180 ngày**.
3. **Không mang theo downline**: Khi agent đổi T1, chỉ agent đó chuyển, M1/M2... ở lại.
4. **Xử lý M1 khi Agent rởi đi**:
   - M1 có **30 ngày** để chọn T1 mới.
   - Trong 30 ngày: T2 đóng vai trò T1 tạm thờ.
   - Sau 30 ngày: T2 chính thức thành T1 nếu M1 không chuyển.
   - Nếu M1 chọn T1 mới (khác T2): tính 1 lần chuyển line.

### 2.3 Quy trình 3 bước (theo chính sách)

```
B1: Tạo đề xuất trong app
    ↓
B2: T1 mới xác nhận đồng ý tiếp nhận (nhập ngày xác nhận)
    ↓
[Chờ 3 ngày làm việc — agent có quyền thay đổi ý kiến]
    ↓
B3: Điểm quyết định
    ├─ ✅ Đồng ý: Hoàn tất đổi T1 (nút khóa nếu chưa đủ 3 ngày)
    └─ ❌ Hủy: Hủy đề xuất (nút luôn hiện)
```

> **Lưu ý:** DB vẫn giữ các cột `step3_era_notified_at`, `step4_agent_confirmed_at`, `step5_completed_at` để tương thích ngược với request cũ. UI mới chỉ hiển thị 3 bước B1→B2→B3.

---

## 3. Rủi ro & Phân tích

| Rủi ro | Mức độ | Giải pháp giảm thiểu |
|--------|--------|---------------------|
| **Data upload không nhất quán** | Cao | Template Excel cố định, validate header trước khi import, báo lỗi rõ ràng. |
| **Tính sai ngày (âm lịch, năm nhuận, ngày làm việc)** | Cao | Dùng thư viện `date-fns` + tự định nghĩa ngày lễ VN. Lưu ý: "ngày làm việc" = thứ 2-6. |
| **Nhầm lẫn introducingAgent vs T1** | Cao | UI luôn hiển thị label rõ ràng. DB có 2 cột riêng biệt. |
| **Supabase project bị pause sau 7 ngày inactive** | Trung bình | Miễn phí tier có thể bị pause. Giải pháp: vào dashboard resume lại, hoặc dùng UptimeRobot ping định kỳ giữa awake. |
| **Không có multi-user thực sự** | Thấp | Scope hiện tại là single-user hoặc few-users do admin tạo. Không cần phân quyền phức tạp. |

---

## 4. Kiến trúc tổng thể

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   Supabase Client    │────▶│  Supabase Cloud │
│  (Vite + TS)    │     │  (@supabase/supabase-js)    │  (Auth + PostgreSQL)│
└─────────────────┘     └──────────────────────┘     └─────────────────┘
        │
        ▼
   Upload Excel/CSV (xlsx) → Parse ở browser → Batch insert qua Supabase
```

**Nhược điểm & Cách giải quyết:**
- **Eligibility Engine chạy trên PostgreSQL RPC**: Logic kiểm tra 91 ngày / 180 ngày / 3 lần đổi T1 được triển khai dưới dạng PostgreSQL Function. Frontend chỉ gọi `supabase.rpc('check_eligibility')` và nhận kết quả. Không thể bypass bằng DevTools.
- **Row Level Security (RLS)**: Bắt buộc bật RLS trên các bảng để đảm bảo an toàn, dù chỉ có vài user.

---

## 5. Cấu trúc thư mục đề xuất

```
t1-change-tracker/
├── src/
│   ├── components/          # UI components (Button, Modal, Table...)
│   ├── pages/               # Các màn hình chính
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AgentsPage.tsx
│   │   ├── AgentDetailPage.tsx
│   │   ├── RequestCreatePage.tsx
│   │   ├── RequestsPage.tsx
│   │   └── UploadPage.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAgents.ts
│   │   ├── useRequests.ts
│   │   └── useEligibility.ts
│   ├── lib/
│   │   ├── supabase.ts      # Khởi tạo Supabase client
│   │   ├── date-utils.ts    # Tính ngày làm việc, 180 ngày, 91 ngày
│   │   ├── excel-parser.ts  # Đọc file Excel/CSV
│   │   └── eligibility.ts   # Logic kiểm tra điều kiện đổi T1
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── main.tsx
├── supabase/
│   └── migrations/          # SQL migrations (tùy chọn, có thể tạo bảng qua UI)
├── public/
├── .env.example
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Database Schema (PostgreSQL trên Supabase)

> **Lưu ý:** Các bảng dưới đây được mô tả dạng bảng trường dữ liệu. SQL sẽ được tạo riêng trong quá trình triển khai.

### 6.1 `agents` — Danh sách Agent
| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| id | UUID / Serial | Có | Khóa chính |
| staff_id | Text | Có | **Mã nhân viên nội bộ / Mã Agent, duy nhất**, dùng để phân biệt agent trong hệ thống nhân sự |
| full_name | Text | Có | Họ tên |
| email | Text | | Email liên hệ |
| phone | Text | | SĐT |
| rank_name | Text | | Cấp bậc (VD: "Consultant Specialist") |
| contract_signing_date | Date | Có | Ngày ký HĐ — tính 91 ngày ưu đãi |
| current_t1_id | FK → agents | | T1 hiện tại |
| introducing_agent_id | FK → agents | | Ngưởi giới thiệu (khác T1) |
| division_id | Integer | | Division |
| cumulative_personal_revenue | Numeric | | Doanh số tích lũy cá nhân |
| my_era_points | Numeric | | Điểm MyERA |
| status | Text | | 'active' / 'inactive' |
| deleted_at | Timestamp | | **Soft delete** — đánh dấu xóa, không xóa vật lý |
| created_at | Timestamp | | Ngày tạo |
| updated_at | Timestamp | | Ngày cập nhật |

### 6.2 `t1_changes` — Lịch sử đổi T1 thành công
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| agent_id | Agent đổi T1 |
| old_t1_id | **T1 cũ** |
| new_t1_id | T1 mới |
| request_id | FK → t1_requests (nullable — hỗ trợ case T1 tự cắt không qua request) |
| change_date | Ngày hoàn tất |
| reason | Lý do: 'agent_request' / 't1_cut' / 'within_90d' |
| is_grace_period | Có phải trong 90 ngày đầu không |
| is_counted_for_quota | Boolean DEFAULT TRUE — FALSE nếu reason = 't1_cut' |
| deleted_at | Soft delete |
| created_at | Ngày tạo |

### 6.3 `t1_requests` — Đề xuất đổi T1 (5 bước)
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| agent_id | Agent đề xuất đổi T1 |
| proposed_new_t1_id | T1 mới đề xuất |
| old_t1_id | **T1 cũ** |
| status | step1 → step5 / completed / cancelled |
| step1_sent_at | Thờigian B1 |
| step2_confirmed_at | Thờigian B2 |
| step3_era_notified_at | Thờigian B3 |
| step4_agent_confirmed_at | Thờigian B4 |
| step5_completed_at | Thờigian B5 |
| created_by | User tạo đề xuất |
| cancelled_by | User hủy (nếu có) |
| cancelled_reason | Lý do hủy |
| deleted_at | Soft delete |
| created_at / updated_at | Timestamps |

### 6.4 `request_notifications` — Checklist thông báo hoàn tất
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| request_id | FK → t1_requests |
| recipient_type | Loại: agent / introducer / old_upline / new_upline / old_downline |
| recipient_agent_id | Agent nhận thông báo |
| notified_at | Đã thông báo lúc nào |

### 6.5 `request_comments` — Ghi chú trên từng request (thay thế notes đơn)
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| request_id | FK → t1_requests |
| content | Nội dung comment |
| created_by | FK → user_profiles |
| created_at | Timestamp |

> Lưu ý: `t1_requests.notes` đã bị xóa. Mọi ghi chú trên request chuyển sang `request_comments`. Không còn field notes đơn.

### 6.6 `user_bookmarks` — Agent đang theo dõi
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| user_id | FK → auth.users |
| agent_id | FK → agents |
| created_at | Timestamp |

> Lưu ý: Mỗi user có thể bookmark nhiều agent đang xử lý. Hiển thị ở Dashboard widget.

### 6.7 `activity_logs` — Lịch sử hoạt động
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| agent_id | Agent chính |
| related_agent_id | Agent liên quan (T1 cũ, T1 mới, M1) |
| action_type | t1_changed / template_generated / m1_chose_new_t1 / m1_stayed_with_t2 / request_created / request_completed / request_step_changed |
| old_t1_id | **T1 cũ** (nếu có) |
| new_t1_id | T1 mới (nếu có) |
| request_id | FK → t1_requests |
| description | Mô tả đọc được |
| created_by | User thực hiện |
| created_at | Ngày giờ |

> Lưu ý: `request_step_changed` dùng để audit ai chuyển request từ bước nào sang bước nào, lúc nào.

### 6.8 `email_templates` — Mẫu email
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| template_key | transfer_complete / 30_days_notice / temp_t1_assigned |
| name | Tên hiển thị |
| subject | Tiêu đề email |
| body | Nội dung (hỗ trợ placeholder) |
| version | Số phiên bản (tăng khi sửa) |
| created_at / updated_at | Timestamps |

> Lưu ý: Mỗi lần admin sửa mẫu, version tăng 1. Có thể xem lại lịch sử qua `updated_at`.

### 6.9 `user_profiles` — Mở rộng auth.users
| Trường | Mô tả |
|--------|-------|
| id | FK → auth.users |
| full_name | Tên đầy đủ |
| role | **'admin' / 'operator' / 'viewer'** — RBAC phân quyền |
| must_change_password | Bắt buộc đổi pass lần đầu |
| created_at | Ngày tạo |

### 6.10 `holidays` — Ngày lễ VN (không hard-code)
| Trường | Mô tả |
|--------|-------|
| id | Khóa chính |
| holiday_date | Ngày lễ |
| name | Tên ngày lễ |
| year | Năm áp dụng |

### 6.11 `m1_transition_tasks` — Theo dõi M1 chọn T1 sau khi T1 cũ đổi
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | UUID | Khóa chính |
| parent_request_id | FK → t1_requests | Request của agent cấp trên gây ra trigger |
| departed_agent_id | FK → agents | Agent vừa đổi T1 (gây ra transition này) |
| m1_agent_id | FK → agents | M1 bị ảnh hưởng |
| temp_t1_id | FK → agents | T2 đóng vai trò T1 tạm thờii |
| notify_date | Timestamp | Ngày M1 nhận thông báo |
| deadline_date | Date | notify_date + 30 ngày |
| status | Enum | `pending` / `t2_assigned` / `m1_changed` / `expired` |
| m1_decision | Enum | `null` / `keep_t2` / `choose_new_t1` |
| new_t1_id | FK → agents (nullable) | T1 mới nếu M1 chọn |
| new_request_id | FK → t1_requests (nullable) | Request mới nếu M1 chọn đổi T1 |
| resolved_at | Timestamp | Ngày quyết định |
| depth | Integer DEFAULT 1 | Độ sâu cascade (max 5, phòng loop vô hạn) |
| created_at | Timestamp | |

> Lưu ý: Trong 30 ngày transition, `agents.current_t1_id` của M1 **vẫn giữ T1 cũ**. UI hiển thị T2 với flag "T1 tạm thờii". Sau 30 ngày mới UPDATE `current_t1_id`.

### 6.12 Auto-update T1 khi hoàn tất
Theo logic `eravnTrans`, khi chuyển T1 được hoàn tất:
- Hệ thống **tự động cập nhật** `agents.current_t1_id` (hoặc `referrerId`) trong cùng transaction
- Đồng thời insert lịch sử vào bảng log
- **M1 (con trực tiếp) không được mang theo** — ở lại với T1 cũ (downline compression)
- **Division** không cập nhật ngay (để cron xử lý sau)

Trong app tracker: Nút "Hoàn tất" (B5) sẽ trigger cập nhật T1 mới ngay lập tức. Sau 30 ngày nếu M1 không chọn T1 mới, admin bấm nút "Áp dụng T2 làm T1 chính thức" để cập nhật thủ công.

---

## 7. Auth Flow với Supabase

```
1. Admin tạo user qua Supabase Dashboard (hoặc API):
   - Email: user1@company.com
   - Password: [random] (Supabase gửi email invite)
   
2. User đăng nhập lần đầu:
   - Sign in với email/password
   - Kiểm tra user_profiles.must_change_password
   - Nếu true → redirect đến màn "Đổi mật khẩu"
   - Gọi supabase.auth.updateUser({ password: newPass })
   - Cập nhật must_change_password = false

3. Các lần sau:
   - Sign in bình thường
   - Supabase tự quản lý session (JWT trong localStorage)
```

---

## 8. Màn hình UI chính

| Màn hình | Chức năng |
|----------|-----------|
| **Login** | Email/password. Nếu `must_change_password=true` → buộc sang màn đổi pass. |
| **Dashboard** | Tổng quan: số agent, số đề xuất đang xử lý, cảnh báo deadline. Widget "Agent đang theo dõi". |
| **Agents List** | Bảng agent, search, filter. Cột: "Ngày ký HĐ", "T1 hiện tại", "Số lần đổi T1". **Bộ lọc nhanh**: sắp đủ 91 ngày, sắp đủ 180 ngày, đã hết quota, đang transition, chưa có T1. Nút ⭐ bookmark. |
| **Agent Detail** | Thông tin agent, lịch sử đổi T1 (timeline), danh sách M1, nút "Tạo đề xuất". Tab **"Lịch sử làm T1"** (xem agent này từng là T1 của những ai). |
| **Tạo đề xuất** | Form chọn agent, chọn T1 mới. Hiển thị **eligibility check** real-time + **T1 capacity** (số agent đang dưới trướng). |
| **Requests List** | Kanban board hoặc bảng theo trạng thái (Step 1 → Step 5). Deadline countdown. Export theo bộ lọc hiện tại. |
| **Request Detail** | Chi tiết 1 đề xuất, hiển thị **T1 cũ → T1 mới**, cập nhật từng bước, **thread comment**, checklist ngưởi cần thông báo. Mini timeline **Step History** (ai chuyển bước nào lúc nào). |
| **Lịch sử hoạt động** | Timeline toàn bộ hành động của 1 agent: đổi T1, chuyển đi, ở lại, ai là T1 cũ, ai là T1 mới. Có thể lọc theo loại hành động. |
| **Thùng rác** | Danh sách agent/request đã xóa (soft delete). Admin có thể khôi phục hoặc xóa vĩnh viễn. |
| **Quản lý ngày lễ** | Admin thêm/xóa ngày lễ VN để tính ngày làm việc cho quy trình 3-7 ngày. |

---

## 9. Các bước triển khai

### Phase 1: Setup Supabase, Auth & RPC (2 ngày)
1. Tạo project Supabase mới (free tier).
2. Tạo bảng `agents`, `t1_changes`, `t1_requests`, `request_comments`, `request_notifications`, `activity_logs`, `email_templates`, `user_profiles`, `user_bookmarks`, `holidays`, `m1_transition_tasks` (qua SQL Editor hoặc migrations).
3. Bật RLS cho tất cả bảng, tạo policy theo role (xem mục 11.4).
4. Viết PostgreSQL Function `check_eligibility(agent_id, proposed_t1_id)`:
   - **Validation cơ bản:** `proposed_t1_id ≠ agent_id` (không chọn chính mình) và `proposed_t1_id ≠ current_t1_id` (không chọn T1 hiện tại).
   - Tính số ngày từ `contract_signing_date`.
   - Đếm số lần đã đổi T1 từ `t1_changes` (chỉ tính `is_counted_for_quota = TRUE`).
   - Kiểm tra 180 ngày từ lần đổi gần nhất.
   - Kiểm tra `rank_name` >= CS nếu sau 91 ngày.
   - Trả về JSON: `{ eligible: boolean, reasons: string[] }`.
5. Khởi tạo React + Vite + Tailwind + TypeScript.
6. Cài `@supabase/supabase-js`, cấu hình client.
7. Xây dựng Login + Change Password flow.
8. Tạo user đầu tiên qua Supabase Dashboard.

### Phase 2: Agent Management, Upload & Templates (2 ngày)
8. UI Agents List + Agent Detail (query từ Supabase).
9. Tính năng Upload Data (Web Worker):
   - Hỗ trợ `.csv` (khuyến nghị) và `.xlsx`.
   - Giới hạn: tối đa **10.000 dòng / 10MB** mỗi lần.
   - **Web Worker** parse file ở background thread — UI không bị đơ.
   - Hiển thị **Progress Bar** trong quá trình parse.
   - Validate template (đúng header không?).
   - Preview 50 dòng trước khi import. **Highlight:** row mới = viền xanh, row cập nhật = viền vàng.
   - **Upsert strategy:** `staff_id` làm unique key. Nếu `staff_id` đã tồn tại → UPDATE. Nếu chưa → INSERT.
   - **Batch insert** 500 dòng/lần vào Supabase để tránh timeout.
   - **Data Quality Report** sau import: modal hiển thị số agent mới/update, cảnh báo email trùng, thiếu SĐT, ngày ký HĐ không hợp lệ, agent chưa có T1.
10. Hiển thị M1 của agent (self-referencing query).
11. **Bookmark Agent:** Nút ⭐ trên Agent List và Agent Detail. Lưu vào `user_bookmarks`. Widget "Agent đang theo dõi" trên Dashboard.
11. Bảng `email_templates` + UI "Quản lý mẫu email":
    - 3 text area cho 3 loại mẫu.
    - Hỗ trợ placeholder: `{{agentName}}`, `{{agentCode}}`, `{{oldT1Name}}`, `{{oldT1Email}}`, `{{newT1Name}}`, `{{newT1Email}}`, `{{date}}`, `{{deadlineDate}}`.
    - Nút "Lưu" + "Xem trước".

### Phase 3: Eligibility Integration (1 ngày)
12. Frontend gọi RPC `check_eligibility()` khi chọn T1 mới trong form.
13. Hiển thị kết quả real-time trên UI (✅/❌ từng điều kiện).
14. **T1 Capacity Indicator:** Khi chọn T1 mới, hiển thị số agent đang dưới trướng T1 đó + số lần nhận agent trong 30 ngày qua. Cảnh báo nếu quá tải.

### Phase 4: Request Workflow (2 ngày)
15. UI tạo đề xuất: Chọn agent → chọn T1 mới → eligibility check + T1 capacity → Insert `t1_requests`.
16. UI Requests List: Bảng/Kanban theo `status`. Export theo bộ lọc hiện tại (không export toàn bộ).
17. UI Request Detail: Quy trình 3 bước (B1→B2→B3). B2 nhập ngày xác nhận. B3 là điểm quyết định (Đồng ý/Hủy), nút Đồng ý khóa trong 3 ngày làm việc. **Thread comment** thay thế notes đơn. Mini timeline **Step History** từ `activity_logs` (ai chuyển bước nào lúc nào).

### Phase 5: Completion, Activity Log & Dashboard (2 ngày)
18. Nút "Hoàn tất" (B3 — sau khi đủ 3 ngày làm việc từ B2):
    - Update `t1_requests.status = 'completed'`.
    - Update `agents.current_t1_id = proposed_new_t1_id`.
    - Insert `t1_changes`.
    - Insert `activity_logs` (action_type = 't1_changed', ghi rõ old_t1_id, new_t1_id).
    - **Tạo `m1_transition_tasks` cho từng M1:** Query `agents WHERE current_t1_id = old_t1_id` (tìm M1 của agent vừa đổi T1). Với mỗi M1, insert `m1_transition_tasks` (status = 'pending', deadline_date = NOW() + 30 ngày, temp_t1_id = old_t1_id).
    - Khi chuyển B1→B2, insert `activity_logs` (action_type = 'request_step_changed') để audit.
19. Khi Agent rởi đi / M1 quyết định:
    - **Nút "Áp dụng T2 làm T1 chính thức" (trên Dashboard):**
      - Chỉ hiện khi M1 hết 30 ngày (m1_transition_tasks.status = 'expired').
      - Khi admin bấm: UPDATE `agents.current_t1_id = temp_t1_id` (T2 thành T1 chính thức).
      - UPDATE `m1_transition_tasks.status = 't2_assigned'`, `resolved_at = NOW()`.
      - INSERT `activity_logs` (action_type = 'm1_stayed_with_t2').
    - Nếu M1 chọn T1 mới (khác T2) → Tạo `t1_requests` mới + `activity_logs` (action_type = 'm1_chose_new_t1').
20. Dashboard:
    - Các M1 đang trong 30 ngày suy nghĩ.
    - Các agent sắp đủ 180 ngày.
    - Các request quá 7 ngày chưa chuyển bước.
    - Widget "Agent đang theo dõi" từ `user_bookmarks`.
    - **Sidebar badge:** số request pending, số alert cần xử lý.
21. UI **Thùng rác**: Bảng agent/request đã soft delete, nút "Khôi phục" và "Xóa vĩnh viễn".
22. UI **Quản lý ngày lễ**: Bảng ngày lễ, modal thêm ngày lễ mới.
23. Tính năng **Soạn mẫu** trên Agents Page:
    - Toolbar có nút "Soạn mẫu" (luôn hiện, disabled nếu chưa chọn row).
    - Modal: Dropdown chọn loại mẫu → lấy từ `email_templates`.
    - Auto-fill placeholder bằng thông tin agent thật.
    - Hiển thị email: Agent, T1 cũ, T1 mới.
    - 2 nút riêng biệt: [📋 Copy nội dung] + [📧 Copy email].
    - Ghi log vào `activity_logs` (action_type = 'template_generated').
24. **Quick Filter Presets** trên Agents List: sắp đủ 91 ngày, sắp đủ 180 ngày, đã hết quota, đang transition, chưa có T1.

### Phase 6: Polish & Deploy (2 ngày)
25. Export báo cáo Excel (Agents, Requests):
    - Modal chọn: "Export toàn bộ" hoặc "Export theo bộ lọc hiện tại".
    - UI-DESIGN 3.10.1 định nghĩa chi tiết modal này.
26. UI Lịch sử hoạt động (Activity Log): hiển thị timeline từ `activity_logs`, luôn kèm tên **T1 cũ** và **T1 mới**.
27. Tab **"Lịch sử làm T1"** trên Agent Detail: xem agent này từng là T1 của những ai (query `t1_changes`).
28. Deploy frontend lên **Vercel** (free).
29. Hướng dẫn backup data (export từ Supabase dashboard).

---

## 10. Công nghệ & Dependencies chính

| Layer | Package |
|-------|---------|
| Web Framework | `react`, `react-dom`, `vite` |
| Styling | `tailwindcss`, `lucide-react` |
| Routing | `@tanstack/react-router` (hoặc `react-router-dom`) |
| Data Fetching | `@tanstack/react-query` |
| Supabase | `@supabase/supabase-js` |
| Excel / CSV | `xlsx` (SheetJS) |
| Date | `date-fns` |
| Dev | `typescript`, `@types/react`, `@types/react-dom` |

---

## 11. Lưu ý triển khai

1. **Request Comments thay thế Notes:** `t1_requests.notes` đã bị xóa. Mọi ghi chú trên request chuyển sang `request_comments`. Đảm bảo RPC chuyển bước tự động insert log vào `activity_logs` (action_type = 'request_step_changed').
2. **Đổi mật khẩu lần đầu:** Dùng `user_profiles.must_change_password`. Sau khi user đổi pass qua `supabase.auth.updateUser()`, cập nhật flag về `false`.
3. **Ngày làm việc:** "3-7 ngày làm việc" = thứ 2 đến thứ 6. Dùng `date-fns` kết hợp array ngày lễ VN để tính.
4. **Âm lịch:** "Từ đầu năm âm lịch" cần thư viện chuyển đổi dương lịch ↔ âm lịch nếu cần xét cấp DD. Có thể hard-code mapping năm.
5. **Supabase RLS Policy chi tiết:**
   | Role | SELECT | INSERT | UPDATE | DELETE |
   |------|--------|--------|--------|--------|
   | admin | ✅ | ✅ | ✅ | ✅ (soft delete) |
   | operator | ✅ | ✅ (request/agent) | ✅ (own record) | ❌ |
   | viewer | ✅ | ❌ | ❌ | ❌ |
   - Bảng `agents`: viewer có thể xem nhưng không sửa.
   - Bảng `t1_requests`: operator được tạo và cập nhật bước, không được xóa.
   - Bảng `email_templates`: chỉ admin được chỉnh sửa.
   - Bảng `request_comments`: operator được thêm comment.
   - Bảng `user_bookmarks`: mỗi user chỉ xem/sửa bookmark của mình.
6. **Cron job cho M1 Transition (Supabase free tier):** Supabase free không có cron job built-in. Giải pháp **"lazy processing"**: mỗi khi admin mở Dashboard, frontend gọi RPC `process_expired_m1_transitions()` để xử lý các task quá hạn. Không cần infra thêm, chỉ xử lý khi có ngườii dùng active. Nếu sau này cần chính xác hơn, có thể dùng **Vercel Cron Jobs** (free 1 job) hoặc **GitHub Actions** scheduled workflow.
7. **UptimeRobot:** Để tránh Supabase project bị pause sau 7 ngày không hoạt động, có thể dùng UptimeRobot (free) ping endpoint mỗi 5 phút.

---

## 12. Các điểm mở rộng (tính năng mới - chờ bạn bổ sung)

- Tích hợp gửi email tự động (SMTP/Resend) khi chuyển bước.
- Nhắc việc qua browser notification hoặc Telegram bot.
- Gantt chart/timeline visualization cho requests.
- Import trực tiếp từ API eravnTrans thay vì Excel.
- Phân quyền nhiều user (đã có admin / operator / viewer).
