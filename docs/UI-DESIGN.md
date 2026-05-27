# T1 Change Tracker - UI Design Specification

> File này dùng để mô tả chi tiết toàn bộ giao diện app trước khi code.  
> Có thể import vào AI design tool để preview trực quan.

---

## 1. Design System

### Màu sắc chính
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#1e40af` | Primary buttons, active states, links, sidebar selected |
| `--primary-hover` | `#1e3a8a` | Button hover |
| `--primary-light` | `#dbeafe` | Badge backgrounds, light accents |
| `--danger` | `#dc2626` | Error, delete, reject, cancelled |
| `--danger-light` | `#fee2e2` | Error backgrounds |
| `--success` | `#16a34a` | Success, approved, completed |
| `--success-light` | `#dcfce7` | Success backgrounds |
| `--warning` | `#ca8a04` | Warning, pending, deadline approaching |
| `--warning-light` | `#fef9c3` | Warning backgrounds |
| `--neutral-900` | `#0f172a` | Main text, headings |
| `--neutral-700` | `#334155` | Secondary text |
| `--neutral-500` | `#64748b` | Placeholder, disabled text |
| `--neutral-300` | `#cbd5e1` | Borders, dividers |
| `--neutral-100` | `#f1f5f9` | Page backgrounds, hover rows |
| `--neutral-50` | `#f8fafc` | Card backgrounds, sidebar bg |
| `--white` | `#ffffff` | Cards, modals, input backgrounds |

### Typography
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 24px | 700 | Page titles (Agents, Dashboard...) |
| H2 | 20px | 600 | Section headings, modal titles |
| H3 | 16px | 600 | Card titles, table headers |
| Body | 14px | 400 | Regular text, table content |
| Small | 12px | 400 | Captions, timestamps, badges |
| Label | 12px | 500 | Form labels, uppercase tracking-wide |

### Spacing Scale
Base unit: 4px
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Border Radius
- Buttons, inputs, badges: 6px
- Cards: 8px
- Modals: 12px
- Avatars: 50%

### Shadows
- Card: `0 1px 3px rgba(0,0,0,0.1)`
- Dropdown/Popover: `0 4px 6px -1px rgba(0,0,0,0.1)`
- Modal: `0 20px 25px -5px rgba(0,0,0,0.1)`

---

## 2. Layout chung (App Shell)

```
┌─────────────────────────────────────────────────────────────┐
│  Header (height: 56px, white, border-bottom neutral-300)    │
│  [Logo]  [App Title: "T1 Tracker"]        [User ▼] [Bell]   │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │  Main Content Area (bg: neutral-100)             │
│ (w: 240px│  padding: 24px                                   │
│  bg:     │                                                  │
│ neutral- │                                                  │
│ 50)      │                                                  │
│          │                                                  │
│ [Nav     │                                                  │
│  Items]  │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### 2.1 Header
- **Height:** 56px
- **Background:** White
- **Border-bottom:** 1px solid neutral-300
- **Left:** Logo icon (24x24) + App title "T1 Change Tracker" (font: H1, color: primary)
- **Right:**
  - Notification bell icon (20px, color: neutral-500, with red dot badge if unread)
  - User avatar circle (32px) + dropdown chevron
  - Dropdown menu: "Profile" | "Đổi mật khẩu" | "Vai trò: [Admin/Operator/Viewer]" | Divider | "Đăng xuất"

### 2.2 Sidebar Navigation
- **Width:** 240px (collapsible to 64px on mobile)
- **Background:** neutral-50
- **Border-right:** 1px solid neutral-300
- **Padding:** 16px 12px
- **Gap between items:** 4px

**Nav Items (vertical stack):**
1. 📊 Dashboard (icon: LayoutDashboard) — route: `/` — tất cả role
2. 👤 Agents (icon: Users) — route: `/agents` — tất cả role
3. 📋 Requests (icon: ClipboardList) — route: `/requests` — tất cả role — **Badge:** số request đang pending (step1→step5)
4. 📈 Activity Log (icon: Activity) — route: `/activity` — tất cả role
5. 📧 Email Templates (icon: Mail) — route: `/templates` — **chỉ admin**
6. 📤 Upload Data (icon: Upload) — route: `/upload` — admin + operator
7. 🗑️ Trash (icon: Trash2) — route: `/trash` — **chỉ admin** — **Badge:** số item trong thùng rác
8. 📅 Holidays (icon: Calendar) — route: `/holidays` — **chỉ admin**

> **RBAC Sidebar:** Item 5 chỉ hiển thị khi role = admin. Item 6 hiển thị khi role = admin hoặc operator. Badge tự động cập nhật khi app load.

**Badge style:**
- Height: 18px, padding 2px 6px, border-radius 999px
- Background: danger (đỏ) nếu >0, neutral-300 nếu =0
- Text: white, Small, font-weight 600
- Position: bên phải text nav item, căn giữa theo chiều dọc

**Item style:**
- Default: padding 8px 12px, border-radius 6px, color: neutral-700
- Hover: bg: neutral-100
- Active/Selected: bg: primary-light, color: primary, font-weight: 500
- Icon: 20px, margin-right 12px

### 2.3 Main Content Area
- **Background:** neutral-100
- **Padding:** 24px (xl)
- **Max-width:** 100%
- Overflow: auto

---

## 3. Màn hình chi tiết

---

### 3.1 Login Page (Full screen, no sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│  bg: gradient from primary to primary-hover                 │
│                                                             │
│                    ┌─────────────────────┐                  │
│                    │   [Logo]            │                  │
│                    │   T1 Change Tracker │                  │
│                    │                     │                  │
│                    │   Email             │                  │
│                    │   ┌───────────────┐ │                  │
│                    │   │               │ │                  │
│                    │   └───────────────┘ │                  │
│                    │                     │                  │
│                    │   Mật khẩu          │                  │
│                    │   ┌───────────────┐ │                  │
│                    │   │ ••••••••      │ │                  │
│                    │   └───────────────┘ │                  │
│                    │                     │                  │
│                    │   [  Đăng nhập  ]   │                  │
│                    │                     │                  │
│                    └─────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Layout:**
- Full viewport height, centered content
- Background: linear gradient from `#1e40af` to `#1e3a8a`
- Card: white, width 400px, padding 32px, border-radius 12px, shadow modal

**Elements:**
- Logo: 48x48 centered at top of card
- Title: "T1 Change Tracker" — H1, centered, neutral-900
- Form fields:
  - Label: "Email" / "Mật khẩu" — Label style
  - Input: height 40px, border 1px neutral-300, border-radius 6px, padding 0 12px
  - Focus: border-color primary, ring 2px primary-light
- Button "Đăng nhập": width 100%, height 40px, bg primary, white text, border-radius 6px
  - Hover: bg primary-hover
  - Loading state: spinner icon + "Đang đăng nhập..."
- **Link "Quên mật khẩu?"**: below button, text primary, font-size Small, centered. Click → gọi `supabase.auth.resetPasswordForEmail(email)` → hiện toast "Vui lòng kiểm tra email để đặt lại mật khẩu".
- Error message: below link, color danger, bg danger-light, padding 12px, border-radius 6px

---

### 3.2 Change Password Page (First login)

Same layout as Login, but:
- Title: "Đổi mật khẩu lần đầu"
- Subtitle: "Vui lòng đổi mật khẩu để bảo mật tài khoản" — body, neutral-500
- Fields: "Mật khẩu mới", "Xác nhận mật khẩu"
- Button: "Xác nhận"
- Validation: password must be >= 6 chars, match confirm

---

### 3.3 Dashboard Page

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                     [Refresh 🔄] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Agents  │ │ Requests │ │ Pending  │ │Completed │      │
│  │   245    │ │   12     │ │    8     │ │    4     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐  ┌─────────────────────────┐   │
│  │ ⚠️ Deadline sắp tới    │  │ 📊 Biểu đồ trạng thái   │   │
│  │                        │  │                         │   │
│  │ • Agent A - còn 2 ngày │  │  [Pie chart]            │   │
│  │ • Agent B - còn 5 ngày │  │  Step1: 3 | Step2: 2... │   │
│  │ • Request #5 quá hạn   │  │                         │   │
│  └────────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**3.3.1 Stats Cards Row**
- 4 cards in a row (grid-cols-4), gap 16px
- Each card:
  - Background: white, border-radius 8px, padding 20px, shadow card
  - Top: icon (24px, color: primary) + label (Small, neutral-500)
  - Bottom: big number (H1, 32px, neutral-900)
  - Example: "Tổng Agent" / 245

**3.3.2 Alert / Deadline Section (Left, width 60%)**
- Card title: "⚠️ Cảnh báo deadline" — H2
- List of alert items:
  - Each item: icon + text + timestamp + action button (nếu cần)
  - Red text if overdue, orange if < 3 days, yellow if < 7 days
  - Example: "🔴 Agent Nguyễn Văn A sắp hết 30 ngày suy nghĩ (còn 2 ngày) [Áp dụng T2 làm T1]"
  - Nút "Áp dụng T2 làm T1 chính thức" chỉ hiện khi M1 hết 30 ngày và chưa chọn T1 mới
  - Bấm nút → cập nhật `agents.current_t1_id = T2_id` + insert `activity_logs`
- Max height: 300px, scrollable

**3.3.3 Widget "Agent đang theo dõi" (Right, width 40%)**
- Card title: "⭐ Agent đang theo dõi" — H2
- Hiển thị tối đa 5 agent đã bookmark (từ `user_bookmarks`).
- Each item: agent name + code + T1 hiện tại + badge trạng thái.
- Click item → navigate to Agent Detail.
- Nếu chưa bookmark agent nào: hiển thị Empty State "Chưa có agent nào được đánh dấu".
- Nút "Xem tất cả" → navigate to Agents List (có thể filter bookmarked).

**3.3.4 Status Chart (Below alert + widget, full width)**
- Card title: "📊 Trạng thái đề xuất" — H2
- Donut/Pie chart showing:
  - Step 1 (primary-light)
  - Step 2 (primary)
  - Step 3 (warning)
  - Step 4 (neutral-500)
  - Step 5 (success)
  - Completed (success-light)
  - Cancelled (danger-light)
- Legend below chart

---

### 3.4 Agents List Page (CRM Table)

```
┌─────────────────────────────────────────────────────────────┐
│  Agents                                                      │
│  [🔍 Search...] [Filter ▼] [📤 Export] [✉️ Soạn mẫu (disabled)]│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ☑ │Mã NV│ Họ tên │ Cấp bậc │ Ngày ký HĐ │ T1 hiện tại ││
│  ├───┼─────┼────────┼─────────┼────────────┼─────────────┤│
│  │ ☐ │NV001│ Ng Văn │   CS    │ 01/01/2026 │  Trần Văn B ││
│  │ ☐ │NV002│ Lê Thị │  Agent  │ 15/03/2026 │  Nguyễn Văn ││
│  └───┴─────┴─────────┴────────┴─────────┴────────────┴─────────────┘│
│                                      [1] [2] [3] ... [10]   │
└─────────────────────────────────────────────────────────────┘
```

**3.4.1 Toolbar (sticky top)**
- Left:
  - Search input: width 280px, placeholder "Tìm theo mã, tên...", icon Search left
  - **Quick Filter Presets:** Dropdown "Bộ lọc nhanh ▼" với các preset:
    - 🟢 Sắp đủ 91 ngày (contract_signing_date cách hiện tại 80-90 ngày)
    - 🔵 Sắp đủ 180 ngày (lần đổi gần nhất cách hiện tại 170-180 ngày)
    - 🔴 Đã hết quota (is_counted_for_quota count >= 3)
    - 🟡 Đang trong transition (có m1_transition_tasks pending)
    - ⚪ Chưa có T1 (current_t1_id IS NULL)
    - ⭐ Đang theo dõi (có bookmark)
  - Filter dropdown: "Cấp bậc ▼", "Trạng thái ▼"
- Right:
  - "📤 Export Excel" button: outline style (border primary, text primary)
    - Chỉ admin và operator được Export
    - Khi click: hiện modal chọn "Export toàn bộ" hoặc "Export theo bộ lọc hiện tại"
  - "🗑️ Thùng rác" button: outline style (border neutral-300, text neutral-500)
    - Chỉ admin thấy. Navigate đến màn Thùng rác.
  - "✉️ Soạn mẫu" button: bg primary, white text
    - Disabled state: opacity 50%, cursor not-allowed (khi chưa chọn row)
    - Enabled state: khi đã check ít nhất 1 checkbox
    - Ẩn hoàn toàn nếu role = viewer

**3.4.2 Data Table**
- Table container: white bg, border-radius 8px, shadow card
- Header row: bg neutral-50, text Label style (uppercase), border-bottom neutral-300
  - Checkbox (select all) | Mã NV | Họ tên | Cấp bậc | Ngày ký HĐ | T1 hiện tại | Trạng thái
- Body rows:
  - Height: 52px
  - Border-bottom: 1px solid neutral-100
  - Hover: bg neutral-50
  - Checkbox: round, border neutral-300
  - **Bookmark star (⭐):** ở đầu row, bên phải checkbox. Click để toggle bookmark. Màu warning khi active, neutral-300 khi inactive.
  - Trạng thái badge:
    - "Active": bg success-light, text success, padding 4px 8px, border-radius 999px
    - "Inactive": bg neutral-100, text neutral-500
    - "T1 tạm thờii": bg warning-light, text warning — hiển thị nếu agent đang trong m1_transition_tasks pending
  - Click vào row → navigate to Agent Detail
- Pagination: bottom-right, "Hiển thị 1-10 / 245", prev/next arrows

**3.4.3 Row Selection Behavior**
- Click checkbox đầu row → chọn row đó
- Click checkbox header → chọn tất cả
- Khi >= 1 row được chọn:
  - "Soạn mẫu" button **enable** (nếu chỉ chọn 1 row)
  - "Soạn mẫu" button **disable** + tooltip "Chỉ chọn 1 agent để soạn mẫu" (nếu chọn >1 row)
  - Hiện "Đã chọn N agent" bên cạnh

---

### 3.5 Agent Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│  ← Quay lại     Agent: Nguyễn Văn A (A001)    [Tạo đề xuất] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ THÔNG TIN           │  │ T1 HIỆN TẠI                 │ │
│  │ Mã: A001            │  │ Trần Văn B (B002)           │ │
│  │ Cấp: CS             │  │ Email: tb@era.com           │ │
│  │ Ngày ký: 01/01/2026 │  │ [Xem profile]               │ │
│  │ Trạng thái: Active  │  └──────────────────────────────┘ │
│  │                     │  ┌──────────────────────────────┐ │
│  │ [Sửa]               │  │ NGƯỜI GIỚI THIỆU            │ │
│  └──────────────────────┘  │ Phạm Văn C (C003)           │ │
│                            └──────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ LỊCH SỬ T1                                             ││
│  │ • 01/01/2026 — Tạo tài khoản, T1: Trần Văn B           ││
│  │ • 15/03/2026 — Đổi T1 sang Lê Thị D (Request #3)       ││
│  │ • 20/05/2026 — Đổi T1 sang Trần Văn B (Request #7)      ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ DANH SÁCH M1 (Tuyến dưới trực tiếp)                    ││
│  │ ┌────┬────────┬─────────┬────────────┐                 ││
│  │ │Mã  │Họ tên  │ Cấp bậc │ Ngày ký HĐ │                 ││
│  │ ├────┼────────┼─────────┼────────────┤                 ││
│  │ │M101│Lê A    │ Agent   │ 10/02/2026 │                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**3.5.1 Header**
- Left: back arrow button + "Quay lại danh sách"
- Center: "Agent: [Full Name] ([Agent Code])" — H1
- Right:
  - ⭐ Bookmark toggle (icon Star, outline/filled)
  - "Tạo đề xuất đổi T1" button (bg primary)

**3.5.2 Info Cards (2-column grid)**
- Left card: "Thông tin Agent"
  - Rows: Mã NV, Cấp bậc, Ngày ký HĐ, Trạng thái, Ngày tham gia
  - Each row: label (neutral-500, small) + value (neutral-900, body)
  - "Sửa" button: outline, small (chỉ admin/operator)
- Right column: 2 stacked cards
  - "T1 Hiện tại": Name, Code, Email, Phone. Clickable link "Xem profile"
  - "Ngưởi giới thiệu": Same format

**3.5.3 History Timeline**
- Card title: "Lịch sử T1" — H2
- Vertical timeline with dots:
  - Dot: 10px circle, bg primary
  - Line: 2px vertical, bg neutral-300
  - Content: date (small, neutral-500) + description (body)
  - Items: account creation, each t1_change record

**3.5.4 M1 Table**
- Card title: "Danh sách M1 (tuyến dưới trực tiếp)" — H2
- Small table: Mã | Họ tên | Cấp bậc | Ngày ký HĐ
- Click row → navigate to that agent

**3.5.5 Tab "Lịch sử làm T1" (T1 History)**
- Chỉ hiển thị nếu agent này từng là T1 của ai đó.
- Query `t1_changes` WHERE `old_t1_id` = this_agent OR `new_t1_id` = this_agent.
- Timeline dạng card:
  - Date | Agent từng là M1 | Thờigian làm T1 (tính từ change_date)
  - Click agent → navigate to Agent Detail của M1 đó.

---

### 3.6 Tạo đề xuất đổi T1 (Modal / Page)

```
┌─────────────────────────────────────────────────────────────┐
│  Tạo đề xuất đổi T1                              [✕]        │
├─────────────────────────────────────────────────────────────┤
│  Agent: Nguyễn Văn A (A001)                                  │
│  T1 hiện tại: Trần Văn B (B002)                              │
│                                                              │
│  Chọn T1 mới *                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔍 Tìm theo mã hoặc tên...                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ⚠️ Kiểm tra điều kiện                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✅ Tham gia 120 ngày (>91 ngày)                        │ │
│  │ ✅ Cấp bậc: CS (đạt yêu cầu)                           │ │
│  │ ✅ Đã 200 ngày từ lần đổi T1 trước (>180 ngày)         │ │
│  │ ❌ Đã đổi T1 3 lần (hết quota)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [  Hủy  ]          [  Tạo đề xuất  ] (disabled)            │
└─────────────────────────────────────────────────────────────┘
```

**Modal:**
- Width: 560px, centered
- Title: "Tạo đề xuất đổi T1" — H2

**Form:**
- Read-only info: Agent name + T1 hiện tại
- "Chọn T1 mới": Searchable dropdown
  - Input with search icon
  - Dropdown list: agent cards (avatar + name + code)
  - Excludes current T1 and self
  - **T1 Capacity Indicator:** Khi chọn T1 mới, hiển thị panel bên dưới:
    - "Số agent đang dưới trướng: 12"
    - "Số lần nhận agent trong 30 ngày qua: 3"
    - ⚠️ Warning badge nếu >10 agent hoặc >3 lần nhận trong 30 ngày
- Eligibility Check Panel:
  - Gọi RPC `check_eligibility()` từ hệ thống khi T1 mới được chọn
  - Each rule as a row with icon:
    - ✅ Green: đạt
    - ❌ Red: không đạt
    - ⏳ Gray: đang kiểm tra
  - Rules shown:
    - Số ngày tham gia (so với 91 ngày)
    - Cấp bậc >= CS
    - Khoảng cách từ lần đổi trước (so với 180 ngày)
    - Số lần đã đổi (so với 3 lần)
- Submit button: disabled nếu có bất kỳ ❌ nào
- On submit: insert `t1_requests`, show success toast, navigate to Requests page

---

### 3.7 Requests List Page

```
┌─────────────────────────────────────────────────────────────┐
│  Đề xuất đổi T1                                              │
│  [🔍 Search] [Filter ▼] [+ Tạo đề xuất]                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ Step 1  │ │ Step 2  │ │ Step 3  │ │ Step 4  ││ Step 5 │ │
│  │   3     │ │   2     │ │   4     │ │   1     ││   2    │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑ │ Mã │ Agent │ T1 cũ → T1 mới │ Bước │ Ngày tạo │   ││
│  ├───┼────┼───────┼────────────────┼──────┼──────────┤   ││
│  │ ☐ │R001│ Ng A  │ Trần B → Lê C  │ B3   │20/05/2026│   ││
│  │ ☐ │R002│ Lê B  │ Phạm C → Ng D  │ B1   │22/05/2026│   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**3.7.1 Status Cards (Kanban summary)**
- 5 cards horizontally, each represents a status:
  - B1: bg primary-light, text primary
  - B2: bg primary/10, text primary
  - B3: bg warning-light, text warning
  - Completed: bg success-light/50, text success — click → filter completed
  - Cancelled: bg danger-light/50, text danger — click → filter cancelled
- Click card → filter table to that status

**3.7.2 Table**
- Columns: Checkbox | Mã đề xuất | Agent | T1 cũ → T1 mới | Bước hiện tại | Ngày tạo | Hành động
- "T1 cũ → T1 mới" column: arrow icon between two names
- "Bước hiện tại": badge style (same color as kanban cards)
- "Hành động": 3-dot menu with "Xem chi tiết" | "Chuyển bước" | "Hủy"
- Row click → Request Detail

---

### 3.8 Request Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│  ← Quay lại    Đề xuất #R001     [Hủy] [🔒Đồng ý (2 ngày)] │
├─────────────────────────────────────────────────────────────┤
│  Agent: Nguyễn Văn A (A001)                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ T1 CŨ: Trần Văn B (B002)  →  T1 MỚI: Lê Thị D (D004)  ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ┌────────┐    ┌────────┐    ┌─────────────────────────┐   │
│  │  B1    │───▶│  B2    │───▶│  B3                     │   │
│  │   ✓    │    │   ✓    │    │ [⏳ Chờ / 🔓 Quyết định]│   │
│  │01/05   │    │05/05   │    │                         │   │
│  └────────┘    └────────┘    └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  💬 Thảo luận:                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Agent đã xác nhận qua email ngày 05/05                 │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Checklist thông báo hoàn tất (hiện khi ở B3):              │
│  ☐ Agent tự đề xuất                                         │
│  ☐ Ngưởi giới thiệu                                         │
│  ☐ Tuyến trên cũ (T1, T2...)                                │
│  ☐ Tuyến trên mới (T1, T2, T3)                              │
│  ☐ Tuyến dưới cũ (M1)                                       │
└─────────────────────────────────────────────────────────────┘
```

**3.8.1 Header**
- Back button + "Đề xuất #[ID]"
- Status badge: large, showing current step (B1 / B2 / B3 / Hoàn tất / Đã hủy)
- Actions (chỉ admin/operator, viewer chỉ xem):
  - **B1 → B2:** "Chuyển sang B2" button (primary)
    - Khi click: hiển thị **Modal nhập ngày**:
      - Title: "Xác nhận chuyển sang B2"
      - Content: "Vui lòng nhập ngày T1 mới xác nhận đồng ý tiếp nhận."
      - Date picker input
      - Nút "Xác nhận" (primary) + "Hủy" (outline).
  - **B3 (Decision):**
    - "Đồng ý" button (success, **disabled** nếu chưa đủ 3 ngày làm việc từ ngày xác nhận B2)
      - Hiển thị countdown: "Đồng ý (X ngày)" khi chưa đủ ngày
      - Khi click: hiển thị **CountdownConfirmModal** 10 giây
    - "Hủy đề xuất" button (outline, danger, **luôn hiện**)
      - Khi click: hiển thị **CountdownConfirmModal** 10 giây + textarea nhập lý do

**3.8.2 Agent & T1 Info Bar**
- Full width card, bg primary-light
- Left: Agent name (clickable)
- Center: "T1 CŨ: [Name] ([Code])" → "T1 MỚI: [Name] ([Code])"
- Arrow icon between them

**3.8.3 Step Progress Bar**
- Horizontal stepper with 3 steps (B1 → B2 → B3)
- Completed steps: filled circle ✓, line solid
- Current step: outlined circle with pulse animation, label "Đang"
- B3 special states:
  - 🔒 Locked: khi chưa đủ 3 ngày làm việc (icon đồng hồ, màu xám, ring neutral)
  - 🔓 Ready: khi đã đủ 3 ngày (icon sáng, ring primary)
  - ❌ Cancelled: khi request bị hủy (icon X, màu đỏ)
- Future steps: gray circle, dashed line
- Each step shows date if completed
- Click step? Maybe show details of that step

**3.8.4 Request Comments (thay thế Notes đơn)**
- Card title: "💬 Thảo luận" — H2
- Comment thread (giống chat, mới nhất ở dưới):
  - Each comment: avatar (circle 28px) + tên user (Small, primary, bold) + thờigian (Small, neutral-500) + nội dung (Body)
  - Comment của user hiện tại: căn phải, bg primary-light
  - Comment của ngườii khác: căn trái, bg neutral-50
- Input area (sticky bottom):
  - Textarea height 60px, placeholder "Nhập ghi chú..."
  - Nút "Gửi" (primary, small) bên phải
  - Khi submit: insert `request_comments`, clear input, append to thread

**3.8.5 Step History (Mini Timeline)**
- Card title: "📝 Lịch sử chuyển bước" — H2, collapsed by default
- Vertical timeline nhỏ:
  - Each step: dot + date + "B[X] → B[X+1]" + tên user thực hiện
  - Data từ `activity_logs` WHERE action_type = 'request_step_changed'
- Click "Mở rộng" → hiện full timeline

**3.8.6 Notification Checklist (visible at B3)**
- Title: "Checklist thông báo hoàn tất"
- 5 checkboxes with labels
- When checked, insert into `request_notifications`

---

### 3.9 Upload Page

```
┌─────────────────────────────────────────────────────────────┐
│  Upload dữ liệu Agent                                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │              [📁 Icon - 48px]                           ││
│  │                                                         ││
│  │        Kéo thả file Excel/CSV vào đây                   ││
│  │        hoặc nhấp để chọn file                           ││
│  │                                                         ││
│  │        Hỗ trợ: .csv (khuyến nghị), .xlsx — tối đa 10.000 dòng / 10MB
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Template mẫu: [📥 Tải file mẫu]                            │
├─────────────────────────────────────────────────────────────┤
│  Preview (nếu có file):                                     │
│  ┌────┬────────┬─────────┬────────────┬──────────┐         │
│  │ STT│ Mã     │ Họ tên  │ Cấp bậc    │ Ngày ký  │         │
│  ├────┼────────┼─────────┼────────────┼──────────┤         │
│  │ 1  │ A001   │ Ng Văn  │ CS         │01/01/2026│         │
│  │ 2  │ A002   │ Lê Thị  │ Agent      │15/03/2026│         │
│  └────┴────────┴─────────┴────────────┴──────────┘         │
│                                                              │
│  [❌ Hủy]                            [✓ Xác nhận import]    │
└─────────────────────────────────────────────────────────────┘
```

**3.9.1 Dropzone**
- Large dashed border area (2px dashed neutral-300, border-radius 12px)
- Padding: 48px
- Center: Upload icon + text
- Hover/active: border-color primary, bg primary-light/20
- File selected: show filename + size, change icon to document
- Giới hạn: `.csv` (khuyến nghị) hoặc `.xlsx`, tối đa 10.000 dòng / 10MB
- Nếu file >10.000 dòng: hiện lỗi "Vui lòng chia nhỏ file"

**3.9.2 Progress Bar (khi đang parse)**
- Hiển thị khi file đang được Web Worker xử lý
- Progress bar: width 100%, height 8px, bg neutral-100, fill primary
- Text bên dưới: "Đang đọc file... 45%" (cập nhật real-time từ Worker)
- Có nút "Hủy" để dừng Worker nếu cần

**3.9.3 Template Download**
- Link button: "📥 Tải file CSV mẫu" + "📥 Tải file Excel mẫu"
- Triggers download of template with correct headers

**3.9.4 Preview Table**
- Only shows after file parsed
- Max 10 rows preview
- Shows validation errors inline (red text under invalid cells)
- "Xác nhận import" button: disabled if any validation errors
- On confirm: batch insert, show success toast with count

**3.9.5 Data Quality Report Modal**
- Hiển thị SAU KHI import thành công (tự động mở modal).
- Title: "📋 Báo cáo nhập liệu" — H2
- Content:
  ```
  ✅ Đã nhập: 245 agent mới
  🔄 Đã cập nhật: 120 agent
  
  ⚠️ Cảnh báo (không ngăn import):
  • 3 agent có email trùng lặp — [Xem danh sách]
  • 5 agent không có số điện thoại — [Xem danh sách]
  • 2 agent có ngày ký HĐ không hợp lệ (tương lai) — [Xem danh sách]
  • 8 agent chưa có T1 (current_t1_id = NULL) — [Xem danh sách]
  ```
- Each "Xem danh sách" link → navigate to Agents List với filter tương ứng.
- Nút "Đóng" (outline) + "Đã hiểu" (primary).
- Có thể tắt không hiện lại bằng checkbox "Không hiển thị lần sau".

---

### 3.10 Email Templates Settings Page

```
┌─────────────────────────────────────────────────────────────┐
│  Quản lý mẫu email                                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. Thông báo chuyển line (T1 thành công)               ││
│  │                                                         ││
│  │ Tiêu đề:                                               ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ [Thông báo] Agent {{agentName}} đã chuyển T1       │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │                                                         ││
│  │ Nội dung:                                              ││
│  │ ┌─────────────────────────────────────────────────────┐ ││
│  │ │ Kính gửi {{agentName}},                              │ ││
│  │ │                                                      │ ││
│  │ │ Bạn đã được chuyển sang T1 mới là {{newT1Name}}.    │ ││
│  │ │ T1 cũ của bạn: {{oldT1Name}}.                        │ ││
│  │ │                                                      │ ││
│  │ │ Trân trọng,                                          │ ││
│  │ │ Phòng Vận Hành ERA                                   │ ││
│  │ └─────────────────────────────────────────────────────┘ ││
│  │ [Xem trước] [Lưu mẫu]                                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 2. Thông báo 30 ngày suy nghĩ                          ││
│  │ ...                                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 3. Thông báo T1 tạm thờ                               ││
│  │ ...                                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 3.10.1 Export Modal (dùng chung cho Agents List & Requests List)

- Trigger: click "📤 Export Excel" trên toolbar.
- Width: 400px.
- Title: "Xuất Excel" — H2
- Options (radio buttons):
  - ⭕ Export toàn bộ (tất cả record trong bảng)
  - ⭕ Export theo bộ lọc hiện tại (chỉ record đang hiển thị sau search + filter)
- Nếu chưa áp dụng filter nào, option 2 disabled + tooltip "Chưa có bộ lọc nào được áp dụng".
- Buttons: "Hủy" (outline) + "Xuất" (primary).
- On confirm: generate Excel ở frontend (dùng `xlsx` library), tự động download.

### 3.10.2 Email Templates Settings Page

**Layout:**
- 3 cards stacked vertically, gap 24px
- Each card:
  - Title: "1. [Tên mẫu]" — H2
  - "Tiêu đề" label + input (full width)
  - "Nội dung" label + textarea (min-height 200px, font: monospace for readability)
  - Placeholder hint bar below textarea: gray box showing available placeholders
  - Buttons: "Xem trước" (outline) + "Lưu mẫu" (primary)

**Preview Modal:**
- Triggered by "Xem trước"
- Shows rendered template with sample data
- Sample data filled in automatically

---

### 3.11 Soạn mẫu Modal (Template Compose)

```
┌─────────────────────────────────────────────────────────────┐
│  Soạn mẫu thông báo                              [✕]        │
├─────────────────────────────────────────────────────────────┤
│  Agent: Nguyễn Văn A (A001)                                  │
│                                                              │
│  Chọn loại mẫu *                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ▼ Thông báo chuyển line                                │ │
│  │   Thông báo 30 ngày suy nghĩ                           │ │
│  │   Thông báo T1 tạm thờ                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Thông tin liên hệ:                                          │
│  ┌────────────────────────┬────────────────────────┐        │
│  │ Agent                  │ T1 Cũ                  │        │
│  │ nvana@era.com          │ tvb@era.com            │        │
│  └────────────────────────┴────────────────────────┘        │
│                                                              │
│  Nội dung đã soạn:                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Kính gửi Nguyễn Văn A,                                 │ │
│  │                                                        │ │
│  │ Bạn đã được chuyển sang T1 mới là Lê Thị D.           │ │
│  │ T1 cũ của bạn: Trần Văn B.                            │ │
│  │                                                        │ │
│  │ Trân trọng,                                            │ │
│  │ Phòng Vận Hành ERA                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [📋 Copy nội dung]    [📧 Copy email]                       │
└─────────────────────────────────────────────────────────────┘
```

**Modal:**
- Width: 640px
- Title: "Soạn mẫu thông báo" — H2

**Form:**
- Read-only: Agent name
- Dropdown "Chọn loại mẫu": 3 options from `email_templates`
- Contact Info Panel (2-column):
  - Left: "Agent" — email
  - Right: "T1 Cũ" — email
  - If template type has T1 Mới, show third column
- Content Preview Box:
  - Read-only textarea, bg neutral-50
  - Shows rendered template with real agent data
- Two buttons side by side:
  - "📋 Copy nội dung": copies content textarea to clipboard, shows "Đã copy!" toast
  - "📧 Copy email": copies comma-separated emails to clipboard
- On any copy action: insert `activity_logs` record

---

### 3.12 Activity Log Page

```
┌─────────────────────────────────────────────────────────────┐
│  Lịch sử hoạt động                                           │
│  [Filter: Tất cả ▼] [🔍 Tìm agent...]                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Today                                                   ││
│  │ ●────┬────────────────────────────────────────────────  ││
│  │ 09:00│ [t1_changed] Nguyễn Văn A đổi T1 từ Trần Văn B  ││
│  │      │ sang Lê Thị D (Request #R001)                    ││
│  │      │ T1 cũ: Trần Văn B (B002) → T1 mới: Lê Thị D    ││
│  │      │ (D004)                                            ││
│  ├──────┼────────────────────────────────────────────────── ││
│  │ 08:30│ [template_generated] Đã soạn mẫu "Thông báo     ││
│  │      │ chuyển line" cho Agent Nguyễn Văn A               ││
│  ├──────┼────────────────────────────────────────────────── ││
│  │ Yesterday                                               ││
│  │ ●────┬────────────────────────────────────────────────  ││
│  │ 14:00│ [m1_stayed_with_t2] M1 của Phạm Văn C (M101)    ││
│  │      │ đã ở lại với T2 Nguyễn Văn E sau 30 ngày        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Layout:**
- Filter bar: dropdown "Loại hành động ▼" + search input
- Timeline view:
  - Grouped by date (Today, Yesterday, [Date])
  - Each item:
    - Left: time (small, neutral-500)
    - Dot: 8px circle, color based on action_type:
      - t1_changed: primary
      - template_generated: warning
      - m1_chose_new_t1: success
      - m1_stayed_with_t2: neutral-500
    - Right: action label (badge) + description
    - If old_t1_id or new_t1_id exists, show "T1 cũ → T1 mới" line
    - Dot colors by action_type:
      - `t1_changed`: primary
      - `template_generated`: warning
      - `m1_chose_new_t1`: success
      - `m1_stayed_with_t2`: neutral-500
      - `request_created`: primary-light
      - `request_completed`: success
      - `request_step_changed`: neutral-700
- Click item → navigate to related Agent or Request

---

### 3.13 Thùng rác (Trash / Recycle Bin)

```
┌─────────────────────────────────────────────────────────────┐
│  Thùng rác                                                   │
│  [🔍 Tìm...] [Filter: Agents ▼ | Requests ▼]                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Loại   │ Tên / Mã         │ Ngày xóa       │ Hành động ││
│  ├────────┼──────────────────┼────────────────┼───────────┤│
│  │ Agent  │ Nguyễn Văn A     │ 25/05/2026     │ [Khôi phục]││
│  │ Request│ R001             │ 24/05/2026     │ [Khôi phục]││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Layout:**
- Chỉ **admin** được truy cập màn này.
- Bảng liệt kê các record đã bị soft delete (`deleted_at IS NOT NULL`).
- Cột: Loại (Agent/Request) | Tên/Mã | Ngày xóa | Ngưởi xóa | Hành động
- Nút "Khôi phục" (outline, primary): set `deleted_at = NULL` → record hiện lại.
- Nút "Xóa vĩnh viễn" (danger, nhỏ): **chỉ hiện khi hover**, có confirm modal. Xóa thật khỏi DB.

---

### 3.14 Quản lý Ngày lễ (Holidays)

```
┌─────────────────────────────────────────────────────────────┐
│  Quản lý ngày lễ                              [+ Thêm ngày] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Ngày       │ Tên ngày lễ              │ Năm │ Hành động││
│  ├────────────┼──────────────────────────┼─────┼──────────┤│
│  │ 01/01/2026 │ Tết Dương lịch           │2026 │ [Sửa][X] ││
│  │ 29/01/2026 │ Giao thừa (Âm lịch)      │2026 │ [Sửa][X] ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Layout:**
- Chỉ **admin** được truy cập.
- Bảng các ngày lễ đã thêm.
- Nút "+ Thêm ngày": mở modal nhập `holiday_date` (date picker) + `name` (input).
- Nút "Xóa": xóa ngày lễ khỏi bảng (xóa thật, không cần soft delete vì bảng nhỏ).
- Dùng để tính "ngày làm việc" trong quy trình 3-7 ngày.

---

## 4. Global Components

### 4.1 Toast Notification
- Position: top-right, 16px from edges
- Width: auto (max 400px)
- Border-radius: 8px
- Types:
  - Success: bg success-light, border-left 4px success, icon CheckCircle
  - Error: bg danger-light, border-left 4px danger, icon XCircle
  - Warning: bg warning-light, border-left 4px warning, icon AlertTriangle
  - Info: bg primary-light, border-left 4px primary, icon Info
- Auto-dismiss after 3 seconds
- Slide in from right animation

### 4.2 Confirmation Modal
- Width: 400px
- Title: H2
- Content: Body text
- Two buttons: "Hủy" (outline) + "Xác nhận" (primary or danger depending on action)
- Backdrop: black/50, blur-sm

### 4.3 Loading States
- Button loading: spinner icon replaces text, disabled
- Page loading: skeleton screens (shimmer effect on cards/tables)
- Table loading: 5 skeleton rows with pulsing bg

### 4.4 Empty States
- Centered icon (48px, neutral-300)
- Title: "Không có dữ liệu" — H3, neutral-500
- Subtitle: instruction — body, neutral-400
- Optional CTA button

### 4.5 Badge Component
- Height: 20px, padding 4px 10px, border-radius 999px
- Variants: primary, success, warning, danger, neutral
- Text: Small, font-weight 500

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | >= 1024px | Full sidebar (240px), all columns visible |
| Tablet | 768-1023px | Collapsed sidebar (icons only), 2-col grids become 1-col |
| Mobile | < 768px | Hidden sidebar (hamburger menu), stacked cards, horizontal scroll table |

---

## 6. Animation & Interaction

- **Page transitions:** Fade in, 200ms ease-out
- **Modal open:** Scale from 95% + fade, 150ms ease-out
- **Modal close:** Scale to 95% + fade, 100ms ease-in
- **Table row hover:** bg change 100ms
- **Button hover:** bg darken, 150ms
- **Toast:** Slide in from right, 300ms
- **Skeleton:** Pulse opacity 0.5-1, 2s infinite
