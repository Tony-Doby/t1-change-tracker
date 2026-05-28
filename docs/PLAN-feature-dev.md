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
| 001 | Tích hợp gửi email thật (SendGrid/Resend) | backlog | 2026-05-28 | — |
| 002 | Supabase Realtime updates (comments, status) | backlog | 2026-05-28 | — |
| 003 | In-app Notifications (badge, dropdown) | backlog | 2026-05-28 | — |
| 004 | Refactor pages sang TanStack Query | backlog | 2026-05-28 | — |
| 005 | Search/Filter server-side cho presets phức tạp | backlog | 2026-05-28 | — |
| 006 | Schema v2 — Align agents table with eravnTrans | backlog | 2026-05-28 | — |
| 007 | Agent Deactivation với Restore Point & Downline Transition | backlog | 2026-05-28 | — |
| 008 | Division Safety Net — Force Recompute & getAgentDivision RPC | fixed | 2026-05-29 | 2026-05-29 |

---

## FEAT-001: Tích hợp gửi email thật (SendGrid/Resend)

- **Đề xuất**: 2026-05-28
- **Status**: `backlog`
- **Priority**: `medium`

### 1. Mô tả feature
Hiện tại chức năng "Soạn mẫu thông báo" chỉ copy nội dung + email ngườii nhận ra clipboard. Feature này cho phép gửi email trực tiếp từ app thông qua dịch vụ gửi email (SendGrid hoặc Resend).

### 2. Motivation / Why
- Giảm thao tác thủ công cho admin/operator.
- Đảm bảo email được gửi đúng template, đúng ngườii nhận.
- Có lịch sử gửi email để trace.

### 3. Scope

**In scope:**
- Chọn provider (Resend khuyến nghị vì dễ setup, free tier 3000 emails/tháng).
- Tạo backend endpoint (Vercel Serverless Function hoặc Supabase Edge Function) để gửi email.
- Mở rộng modal "Soạn mẫu" thêm nút "Gửi email".
- Lưu lịch sử gửi email vào bảng mới `email_logs`.

**Out of scope:**
- Queue/retry mechanism phức tạp (làm sau nếu cần).
- Attachment gửi kèm.
- Email scheduling.

### 4. Technical Design
**Option A — Supabase Edge Function (Khuyến nghị):**
- Tạo Edge Function `send-email` trong Supabase.
- Function nhận `to`, `subject`, `body`, `template_key`.
- Gọi Resend API từ Edge Function.
- Ưu điểm: Không cần backend riêng, chạy gần DB (Singapore).

**Option B — Vercel Serverless Function:**
- Tạo API route `/api/send-email` trong project.
- Cũng gọi Resend API.
- Nhược điểm: Cần config CORS giữa frontend và API.

**Chọn Option A.**

### 5. UI/UX
- Trong `ComposeTemplateModal`, thêm nút "📧 Gửi email" bên cạnh nút "Copy".
- Sau khi gửi thành công: toast "Đã gửi email đến ...".
- Nếu lỗi: toast lỗi, log chi tiết trong console.

### 6. Files cần sửa / tạo
| File | Thay đổi |
|------|----------|
| `supabase/functions/send-email/index.ts` | Edge Function mới |
| `src/components/ComposeTemplateModal.tsx` | Thêm nút "Gửi email", gọi Edge Function |
| `supabase/migrations/005_add_email_logs.sql` | Bảng `email_logs` mới |
| `src/types/index.ts` | Thêm type `EmailLog` |

### 7. Schema / SQL changes
```sql
CREATE TABLE public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES auth.users(id),
  recipient_email text NOT NULL,
  recipient_agent_id uuid REFERENCES agents(id),
  template_key text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message text
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated to read email_logs"
  ON public.email_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated to insert email_logs"
  ON public.email_logs FOR INSERT TO authenticated WITH CHECK (true);
```

### 8. API / Integration changes
- Tạo Supabase Edge Function `send-email`.
- Cần biến môi trường `RESEND_API_KEY` trong Supabase Dashboard → Edge Functions → Secrets.
- Resend SDK hoặc fetch trực tiếp `https://api.resend.com/emails`.

### 9. Test Plan
1. Setup `RESEND_API_KEY` trong Supabase Secrets.
2. Deploy Edge Function.
3. Mở modal soạn thư → bấm "Gửi email".
4. Verify email đến hộp thư ngườii nhận (dùng email test).
5. Verify row được insert vào `email_logs` với `status = 'sent'`.
6. Test case lỗi: sai API key → `status = 'failed'`, có `error_message`.

### 10. Rollout Plan
1. Tạo bảng `email_logs` trên Supabase.
2. Deploy Edge Function.
3. Cấu hình API key.
4. Test trên dev trước khi merge vào main.

### 11. Notes
- Cần xác nhận domain sender trong Resend (hoặc dùng `onboarding@resend.dev` để test).
- Rate limit Resend free: 3.000 emails/tháng. Nếu vượt cần nâng plan.
- `sent_by` lấy từ `supabase.auth.getUser()` trong Edge Function.

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
- **Status**: `backlog`
- **Priority**: `medium`

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
- **Status**: `backlog`
- **Priority**: `low`

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
- **Status**: `backlog`
- **Priority**: `high`

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
- **Status**: `backlog`
- **Priority**: `high`

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
