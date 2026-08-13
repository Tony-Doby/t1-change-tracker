# Smoke Test Checklist — T1 Change Tracker

> Checklist thủ công chạy sau mỗi lần sửa code/fix bug/refactor để đảm bảo các tính năng cốt lõi không bị vỡ.  
> **Thờii gian ước tính:** 10-15 phút cho toàn bộ checklist.

---

## Pre-check

- [ ] `npm run verify` pass (type check + build + lint không lỗi)
- [ ] `npm run test` pass (tất cả unit test pass)

---

## 1. Authentication

### 1.1 Login
- [ ] Truy cập `/login` → hiển thị form đăng nhập
- [ ] Đăng nhập với email/password hợp lệ → redirect về Dashboard
- [ ] Đăng nhập sai → hiển thị lỗi, không redirect

### 1.2 Phân quyền
- [ ] Viewer (role viewer) chỉ xem được, không thấy nút "Tạo đề xuất", "Duyệt", "Từ chối"
- [ ] Operator thấy nút tạo request, không thấy admin settings
- [ ] Admin thấy toàn bộ chức năng

### 1.3 Change Password
- [ ] Truy cập `/change-password` → form hiển thị
- [ ] Đổi mật khẩu thành công → toast thông báo

---

## 2. Dashboard

- [ ] Stat cards hiển thị số liệu đúng (Agents, Requests, M1 Transition, v.v.)
- [ ] Click stat card → navigate đúng trang (Agents / Requests / Filter)
- [ ] B2 Eligible list hiển thị danh sách agent đủ điều kiện
- [ ] M1 Transition list hiển thị tasks pending
- [ ] Status chart / donut hiển thị đúng tỷ lệ

---

## 3. Agents (Danh sách Agent)

- [ ] Danh sách agent load đúng, có pagination
- [ ] Search theo tên / staff_id hoạt động
- [ ] Filter theo rank, division, status hoạt động
- [ ] Bookmark (star) → toggle on/off, persist sau refresh
- [ ] Bulk selection → checkbox đầu dòng, shift-click range chọn nhiều dòng
- [ ] Bulk actions bar hiển thị khi có chọn, nút "Xuất Excel", "Đổi T1" click được
- [ ] T1 hiện tại hiển thị Tên - Staff ID (không phải UUID)
- [ ] Pagination: chuyển trang, chọn số dòng/trang hoạt động

---

## 4. Agent Detail

- [ ] Thông tin agent hiển thị đúng (name, staff_id, rank, division, T1 hiện tại)
- [ ] Tab "M1 của agent" → hiển thị danh sách M1
- [ ] Tab "Lịch sử T1" → timeline hiển thị đúng thứ tự
- [ ] Tab "Lịch sử Deactivation" → hiển thị nếu có
- [ ] Nút "Deactivate" → mở modal confirm, sau deactivate agent chuyển sang trạng thái inactive
- [ ] Nút "Restore" (nếu agent đã deactivate) → restore thành công

---

## 5. Requests (Danh sách đề xuất)

- [ ] Danh sách request load đúng, có pagination
- [ ] Status kanban summary (Pending, Approved, Rejected, Completed, Cancelled) hiển thị đúng số lượng
- [ ] Multi-choice status filter → toggle on/off từng status, table cập nhật
- [ ] Search theo agent name / staff_id hoạt động
- [ ] Sort theo cột hoạt động

---

## 6. Request Detail

- [ ] Thông tin request hiển thị đúng (agent, T1 cũ, T1 mới, status, lý do)
- [ ] Step progress bar hiển thị đúng trạng thái các bước
- [ ] Comments thread → gửi comment mới, hiển thị đúng avatar + timestamp
- [ ] Admin/Operator thấy nút "Duyệt" / "Từ chối"
- [ ] Duyệt request → status chuyển Approved, M1 transition tasks tạo đúng
- [ ] Hoàn tất request (B3) → status Completed, M1 chuyển sang T1 mới
- [ ] Notification checklist → đánh dấu đã gửi email / thông báo

---

## 7. Upload (Import Agent)

- [ ] Dropzone hiển thị, kéo thả file CSV/XLSX được
- [ ] Preview table hiển thị max 10 dòng đầu
- [ ] Validate data → báo lỗi nếu thiếu cột bắt buộc (staff_id, full_name)
- [ ] Import thành công → toast thông báo, agent xuất hiện trong danh sách
- [ ] Upsert theo `staff_id` → agent cũ được cập nhật, agent mới được thêm

---

## 8. Email Templates

- [ ] Danh sách mẫu email hiển thị dạng table
- [ ] Click "Sửa" → mở modal soạn thảo HTML, lưu thành công
- [ ] Click "Preview" → modal hiển thị render đẹp (không raw HTML tags)
- [ ] Click "Copy" → copy nội dung vào clipboard
- [ ] Compose Template Modal → hiển thị 4 email sections, copy từng email riêng

---

## 9. Activity Log

- [ ] Timeline hiển thị đúng thứ tự thờii gian
- [ ] Filter theo action type hoạt động
- [ ] Group by date nếu có nhiều entries

---

## 10. Trash

- [ ] Danh sách agent đã xóa hiển thị
- [ ] Nút "Khôi phục" → agent quay lại danh sách chính
- [ ] Nút "Xóa vĩnh viễn" → confirm trước khi xóa

---

## 11. Holidays

- [ ] Danh sách ngày nghỉ hiển thị
- [ ] Thêm ngày nghỉ mới → lưu thành công
- [ ] Xóa ngày nghỉ → confirm, xóa thành công

---

## 12. Ranks

- [ ] Danh sách cấp bậc hiển thị
- [ ] Modal Thêm/Sửa cấp bậc → lưu thành công
- [ ] Không còn form footer inline (đã chuyển sang modal)

---

## 13. Divisions

- [ ] Danh sách division hiển thị
- [ ] Modal Thêm/Sửa division → lưu thành công
- [ ] Head Agent input chấp nhận tên hiển thị (không yêu cầu UUID)
- [ ] Bảng scroll được nếu nhiều dòng

---

## 14. Excel Generator

- [ ] Tab "Templates" → danh sách template hiển thị
- [ ] Tab "Generate" → chọn template, upload data file, preview đúng expression evaluated
- [ ] Chọn “Ngày áp dụng cho expression” khác hôm nay → preview cập nhật theo ngày chọn; generate file và mở Excel xác nhận expression dùng đúng cùng ngày (BUG-044)
- [ ] Tab "History" → lịch sử generate hiển thị
- [ ] Tab "Tra cứu upline" → upload CSV/XLSX chứa `staff_id`, preview trả về T1/T2/T3/Referrer + ranks
- [ ] Download Excel từ preview → file tải về đúng nội dung
- [ ] Edit template đã lưu → cập nhật thành công, không báo lỗi "Không tìm thấy template"

---

## 15. Notifications

- [ ] Badge số notification hiển thị đúng
- [ ] Click dropdown → hiển thị danh sách notification
- [ ] Đánh dấu đã đọc → badge cập nhật

---

## 16. Drive Manager (FEAT-030–037, BUG-038–043)

> Trang `/admin/google-drive` (chỉ role `admin`). Yêu cầu đã cấu hình: secret `APPS_SCRIPT_WEB_APP_URL` (URL `/exec` hiện hành) + Edge Function `google-apps-script-proxy` đã deploy (có action `detectDriveTypes`) + Apps Script đã dán code `docs/FEAT-030-apps-script.gs` mới nhất (Deploy → New version).

### 16.1 Truy cập & phân quyền
- [ ] User `admin` thấy menu **Google Drive** (icon HardDrive) trong sidebar
- [ ] User `operator` / `viewer` **không** thấy menu, vào thẳng URL `/admin/google-drive` bị chặn

### 16.2 Cây Drive, template và thao tác folder
- [ ] Tab **Cây Drive** → tạo/chọn một cây Drive, drill-down vào cây và breadcrumb quay lại hoạt động.
- [ ] Tick một folder → thanh sticky nền đục hiện ở đỉnh bảng với **Cấp quyền** và **Tạo folder theo template**; tick nhiều folder thì chỉ còn action phù hợp.
- [ ] Tab **Template** → tạo/sửa/lưu template thành công; tạo folder từ template hoạt động ở My Drive và Shared Drive.
- [ ] Template/folder chỉ cho chọn tối đa **Người quản lý nội dung** (`fileOrganizer`); không cho chọn `organizer` cho folder/file con.
- [ ] Nếu một quyền trong lúc tạo từ template bị Drive từ chối, app hiển thị cảnh báo chi tiết thay vì báo thành công hoàn toàn.

### 16.3 Quét folder → Bảng kết quả tương tác (FEAT-032)
- [ ] Tab **Quét folder** → nhập link/ID folder gốc + độ sâu → bấm Quét → bảng kết quả hiển thị
- [ ] Cột **Loại Drive** hiện badge đúng: `My Drive` (neutral) hoặc `Shared Drive` (primary)
- [ ] Ô **search** lọc theo tên/đường dẫn realtime
- [ ] Chips **Loại Drive** (Tất cả / My Drive / Shared Drive) lọc đúng
- [ ] Chips **Cấp** (theo độ sâu) toggle nhiều cấp được, đếm `(x/y folder)` cập nhật
- [ ] Tick checkbox dòng + **select-all** ở header hoạt động (chỉ chọn các dòng đang lọc)
- [ ] Khi có ≥1 dòng chọn → thanh **sticky "N đã chọn · Cấp quyền · Bỏ chọn"** dính ở **đỉnh khung bảng** (không phải floating đáy viewport, không đè Lịch sử)
- [ ] Cuộn bảng dài → thanh sticky + header cột vẫn luôn hiển thị; search + filter chips vẫn thấy (nằm ngoài vùng cuộn)
- [ ] Bấm **Cấp quyền** trên thanh sticky → mở **Modal "Cấp quyền hàng loạt"**, hiện "Đã chọn N item" + badge loại Drive tổng hợp
- [ ] Bấm **Bỏ chọn** → thanh sticky biến mất, header cột trở về đỉnh khung
- [ ] Cột **Link** "Mở" → mở folder trên Drive ở tab mới

### 16.4 Cấp quyền linh hoạt (FEAT-031)
- [ ] Từ Cây Drive hoặc kết quả Quét folder, chọn item(s) → mở form **Cấp quyền** và app hiện loại Drive đã phát hiện.
- [ ] (Nếu lỗi `Action "detectDriveTypes" is not allowed` → Edge Function chưa deploy bản mới.)
- [ ] Dropdown **Quyền** không còn typo "Ngườii" (đúng "Người xem / Người nhận xét / Người chỉnh sửa").
- [ ] Item **toàn bộ Shared Drive** → có thêm **Người quản lý nội dung** (`fileOrganizer`), writer hiện là "Người đóng góp"; **không có `organizer`** cho folder/file con.
- [ ] Item **toàn bộ My Drive** → chỉ 3 role chung.
- [ ] Item **lẫn My + Shared** → banner cảnh báo màu vàng + chỉ còn 3 role chung; chọn role chỉ-Shared bị chặn.
- [ ] Select **Đối tượng = "Người dùng cụ thể"** → hiện ô email (bắt buộc); để trống email → báo lỗi
- [ ] Select **Đối tượng = "Bất kỳ ai có link"** → ô email **ẩn**, hiện ghi chú quyền anyone
- [ ] Submit hợp lệ (scope user, ≥1 email) → toast thành công, kết quả trả về từng item `success: true`
- [ ] Submit scope anyone → folder thực sự thành "ai có link cũng [role]" (kiểm tra trên Drive: Share → General access)

### 16.5 Cấp quyền hàng loạt từ bảng quét (FEAT-031 + 032)
- [ ] Trong Modal (mở từ 16.2) → chọn Đối tượng + role + (email nếu user) → **Cấp quyền** → toast thành công, Modal đóng
- [ ] Item preset đã biết loại Drive sẵn → **không** gọi lại `detectDriveTypes` (không thấy spinner phát hiện)
- [ ] Nếu các item chọn lẫn 2 loại Drive → Modal hiện banner + giới hạn 3 role chung

### 16.6 Audit log
- [ ] Mọi thao tác (kể cả `detectDriveTypes`) xuất hiện trong **"Lịch sử thao tác"** với trạng thái Thành công/Thất bại
- [ ] Thao tác lỗi → cột **Lỗi** hiện message (hover xem full)
- [ ] Bấm **Làm mới** → bảng log cập nhật

---

## Business Logic Regression (5 luồng cốt lõi)

### BL-1: Tạo request đổi T1
- [ ] Agent đủ điều kiện → cho phép tạo request
- [ ] Agent không đủ điều kiện (ASC, <180 ngày, >3 lần) → báo lý do cụ thể
- [ ] Chọn T1 mới trùng T1 cũ → báo lỗi

### BL-2: Hoàn tất request + M1 Transition
- [ ] Approve request → M1 transition tasks tạo cho tất cả M1 của T1 cũ
- [ ] Complete request (B3) → M1 chuyển sang T1 mới, tasks chuyển resolved
- [ ] Agent có `old_t1_id = null` → vẫn chuyển M1 đúng

### BL-3: Upload agent
- [ ] File hợp lệ → upsert theo `staff_id`, không tạo duplicate
- [ ] Agent cũ → cập nhật thông tin mới
- [ ] Division mapping đúng

### BL-4: Export Excel
- [ ] Export danh sách agent → file tải về đúng cột, đúng số dòng
- [ ] Export requests → đúng filter đang áp dụng

### BL-5: Mail Merge Generate
- [ ] Expression `(ddmmyy)` evaluate đúng ngày
- [ ] Đổi ngày áp dụng sau khi preview đã hiện → preview và file export cùng đổi sang ngày mới
- [ ] Expression `([dd-1]mmyy)` evaluate ngày trừ 1 đúng
- [ ] Expression `(R.num)` đánh số dòng đúng
- [ ] Inline refs `{{FieldName}}` thay thế đúng
- [ ] Uppercase transform hoạt động khi mapping
- [ ] Ngày không bị giảm 1 ngày khi export (timezone Asia/Ho_Chi_Minh)

---

## Kết luận

- [ ] Tất cả mục trên pass → **OK để deploy**
- [ ] Có mục fail → Ghi lại, fix, chạy lại checklist
