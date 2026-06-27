# Changelog - T1 Change Tracker

> File này dùng để tracking toàn bộ thay đổi/fix trong project.  
> Mỗi lần sửa code phải ghi vào đây để AI/agent sau có thể đọc lại context.

---

# Changelog - T1 Change Tracker

> File này dùng để tracking toàn bộ thay đổi/fix trong project.  
> Mỗi lần sửa code phải ghi vào đây để AI/agent sau có thể đọc lại context.

---

## 2026-06-27

### 86. Feature FEAT-034: Drive Manager — Quản lý toàn bộ Drive từ webapp

**Mô tả:** Thay thế tab **Google Drive Admin** (8 action độc lập) bằng **Drive Manager** — giao diện quản lý Drive trực tiếp từ webapp. Hỗ trợ lưu nhiều cây folder, duyệt cây đa cấp, tạo folder từ template kèm phân quyền, và các context action Copy/Move/Delete.

**Files tạo:**
- `webapp/supabase/migrations/020_drive_manager.sql`: Bảng `drive_templates`, `drive_trees`, update `apps_script_logs` CHECK constraint.
- `webapp/src/hooks/queries/useDriveTrees.ts`: Query/mutation cho `drive_trees`.
- `webapp/src/hooks/queries/useDriveTemplates.ts`: Query/mutation cho `drive_templates`.
- `webapp/src/pages/DriveManagerPage.tsx`: Trang Drive Manager mới.
- `webapp/src/components/drive-manager/DriveTreeTable.tsx`: Bảng cây folder với expand/collapse, checkbox, context menu.
- `webapp/src/components/drive-manager/CreateTreeDialog.tsx`: Dialog thêm cây Drive mới.
- `webapp/src/components/drive-manager/TemplateManager.tsx`: CRUD template (JSON editor).
- `webapp/src/components/drive-manager/CreateFromTemplateModal.tsx`: Tạo folder từ template.
- `webapp/src/components/drive-manager/CopyFolderDialog.tsx`: Copy folder.
- `webapp/src/components/drive-manager/MoveItemDialog.tsx`: Di chuyển folder.

**Files sửa:**
- `webapp/docs/FEAT-030-apps-script.gs`: Thêm action `createFolderTree` (tạo cây folder đệ quy + apply override permissions theo template).
- `webapp/supabase/functions/google-apps-script-proxy/index.ts`: Thêm `createFolderTree` vào `ALLOWED_ACTIONS`.
- `webapp/src/types/index.ts`: Thêm `DriveTemplate`, `DriveTree`, `DriveTemplateFolder`, `CreateFolderTreeParams`.
- `webapp/src/App.tsx`: Route `/admin/google-drive` → `DriveManagerPage`.
- `webapp/src/components/apps-script/index.ts`: Chỉ export `ScanFoldersForm`, `SetPermissionsForm`, `ScanResultsTable`.
- `webapp/docs/PLAN-feature-dev.md`: Cập nhật FEAT-034 status = done.

**Files xóa:**
- `webapp/src/pages/AppsScriptAdminPage.tsx`
- `webapp/src/components/apps-script/CreateFolderForm.tsx`
- `webapp/src/components/apps-script/CopyFolderForm.tsx`
- `webapp/src/components/apps-script/ListItemsForm.tsx`
- `webapp/src/components/apps-script/MoveItemForm.tsx`
- `webapp/src/components/apps-script/RemovePermissionForm.tsx`
- `webapp/src/components/apps-script/DeleteItemForm.tsx`

**Files tạo (bổ sung unit test):**
- `webapp/src/components/drive-manager/drive-tree.test.ts`: Test `buildTree()`.
- `webapp/src/components/apps-script/utils.test.ts`: Test `extractDriveId()` và `parseList()`.

**Kết quả:**
- `npm run build` pass.
- `npm run test` pass (74/74 tests).

**Lưu ý deploy:**
1. Chạy migration `020_drive_manager.sql` trong Supabase SQL Editor.
2. Deploy lại Apps Script (`docs/FEAT-030-apps-script.gs`) → **Deploy → New version**.
3. Redeploy Edge Function: `supabase functions deploy google-apps-script-proxy`.

---

## 2026-06-27

### 85. Policy FEAT-033: Unit Test Policy — Bắt buộc unit test có điều kiện

**Mô tả:** Thiết lập quy tắc rõ ràng về việc khi nào phải viết unit test, khi nào không, và tiêu chí chất lượng test. Thay vì bắt buộc mọi feature đều có unit test, policy tập trung vào code có rủi ro cao: pure functions trong `src/lib/`, business rules, và bug fix regression.

**Files sửa:**
- `webapp/docs/AGENTS.md`: Thêm quy tắc Unit Test Policy vào section workflow.
- `webapp/docs/KNOWLEDGE.md`: Thêm section 5.4 hướng dẫn chi tiết + ví dụ.
- `webapp/docs/PLAN-feature-dev.md`: Thêm FEAT-033 plan.

**Kết quả:** Docs sync hoàn tất. `npm run test` pass. `npm run build` pass.

**Quy tắc tóm tắt:**
- ✅ Bắt buộc: `src/lib/` pure functions, business logic, bug fix regression.
- ❌ Không bắt buộc: UI thuần túy, config, type, constant, prototype.
- 🔄 Luồng UI/nghiệp vụ mới: cập nhật smoke test checklist hoặc E2E test.

---

## 2026-06-26

### 84. UX FEAT-032: Đổi thanh "Cấp quyền" hàng loạt từ floating sang sticky trong khung bảng

**Vấn đề:** `BulkActionsBar` dùng `position: fixed` neo ở đáy viewport → khi cuộn xuống xem bảng, thanh trôi xuống đè lên Card "Lịch sử thao tác", mất ngữ cảnh với bảng kết quả.

**Thay đổi:**
- `webapp/src/components/apps-script/ScanResultsTable.tsx`: Bỏ `BulkActionsBar` (floating). Thay bằng **thanh sticky dính đỉnh khung bảng cuộn** (`sticky top-0`), header cột dính ngay dưới (`top-11`). Search + filter chips vẫn nằm ngoài vùng cuộn nên luôn hiển thị. Thanh gồm: số đếm "N đã chọn", nút **Cấp quyền**, nút **Bỏ chọn**.
- `webapp/docs/mockup-bulk-action-placement.html` (mới): mockup so sánh 3 phương án vị trí (inline / sticky / floating-trong-card) đã dùng để chốt thiết kế.

**Lý do chọn sticky:** thanh action + header cột luôn thấy khi cuộn bảng dài, gọn trong Card, không bao giờ đè Lịch sử thao tác.

**Kết quả:** `npm run build` pass.

---

### 83. Feature FEAT-031 + FEAT-032: Cấp quyền Drive linh hoạt + Bảng kết quả Quét folder tương tác

**Mô tả:** Mở rộng tab **Cấp quyền** của Google Drive Admin (FEAT-030) thành cấp quyền linh hoạt (tự nhận diện loại Drive, đủ 5 role, đối tượng email/anyone-with-link) và nâng bảng **Kết quả** của tác vụ **Quét folder** thành bảng tương tác (search, lọc theo cấp & loại Drive, chọn nhiều, cấp quyền hàng loạt). Gộp fix BUG-037 (typo "Ngườii" → "Người").

**Files tạo:**
- `webapp/src/components/apps-script/ScanResultsTable.tsx` (FEAT-032): Bảng tương tác — tìm kiếm theo tên/đường dẫn, lọc theo cấp độ sâu (chips) và loại Drive (Tất cả/My/Shared), chọn nhiều dòng + select-all, `BulkActionsBar` với hành động "Cấp quyền".

**Files sửa:**
- `webapp/src/types/index.ts`: Thêm `DriveRole` (5 role), `DriveScope` (user/anyone), `ScanFolderResult` (+ `driveId?`, `isSharedDrive`), `DetectDriveTypeResult`, `DetectDriveTypesParams`; `AppsScriptAction` thêm `detectDriveTypes`; `SetPermissionsParams.role` mở rộng + thêm `scope`.
- `webapp/docs/FEAT-030-apps-script.gs`: Thêm action `detectDriveTypes`; `scanFolders` nhận diện loại Drive 1 lần ở gốc và gắn `driveId`/`isSharedDrive` cho mọi kết quả; viết lại `setPermissions` thành **1 code path** qua `Drive.Permissions.create` (`supportsAllDrives: true`) hỗ trợ user/anyone + validate role chỉ-Shared (`fileOrganizer`/`organizer`).
- `webapp/supabase/functions/google-apps-script-proxy/index.ts`: Thêm `detectDriveTypes` vào `ALLOWED_ACTIONS`.
- `webapp/src/components/apps-script/SetPermissionsForm.tsx` (FEAT-031 + BUG-037): Tự phát hiện loại Drive khi rời ô item (gọi `detectDriveTypes`); Select **Đối tượng** (user/anyone) — ẩn email khi anyone; role options suy theo loại Drive (3 role chung / 5 role khi toàn Shared Drive); xử lý lẫn lộn 2 loại Drive (banner cảnh báo + giới hạn 3 role chung); prop `presetItems` cho luồng bulk-from-scan; sửa typo "Ngườii" → "Người".
- `webapp/src/pages/AppsScriptAdminPage.tsx` (FEAT-032): Render `ScanResultsTable` cho kết quả `scanFolders`; helper `detectDriveTypes`; Modal "Cấp quyền hàng loạt" tái dùng `SetPermissionsForm` với `presetItems`.

**Kết quả:**
- `npm run build` pass (tsc + vite).

**⚠️ Cần deploy thủ công sau khi merge:**
1. **Apps Script**: dán lại `docs/FEAT-030-apps-script.gs` vào Code.gs → **Deploy → New version** (URL `/exec` giữ nguyên).
2. **Edge Function**: `supabase functions deploy google-apps-script-proxy` để cập nhật `ALLOWED_ACTIONS`.

---

### 82. Feature FEAT-030: Google Apps Script Admin Panel — Drive Operations

**Mô tả:** Tab admin riêng biệt để quản lý Google Drive thông qua Google Apps Script Web App, không phụ thuộc ngôn ngữ lập trình ở tầng Apps Script. Chỉ user có role `admin` mới truy cập được.

**Files tạo:**
- `webapp/supabase/migrations/019_apps_script_logs.sql`: Bảng audit `apps_script_logs`, indexes và RLS admin-only.
- `webapp/supabase/functions/google-apps-script-proxy/index.ts`: Edge Function proxy xác thực JWT, kiểm tra role admin, validate action allowlist, forward request đến Apps Script Web App, ghi audit log. Hỗ trợ optional `APPS_SCRIPT_TOKEN`.
- `webapp/docs/FEAT-030-apps-script.gs`: Code Google Apps Script Web App đầy đủ 8 tác vụ Drive.
- `webapp/src/types/index.ts`: Types `AppsScriptAction`, `AppsScriptLog`, các payload params và `AppsScriptResponse`.
- `webapp/src/hooks/queries/useAppsScript.ts`: `useAppsScriptMutation` gọi Edge Function + `useAppsScriptLogsQuery` đọc lịch sử.
- `webapp/src/components/apps-script/*.tsx`: 8 form component cố định theo tác vụ.
- `webapp/src/components/apps-script/utils.ts`: Helper trích xuất Drive ID từ link và parse danh sách.
- `webapp/src/pages/AppsScriptAdminPage.tsx`: Trang admin với menu tác vụ, form, kết quả và lịch sử.

**Files sửa:**
- `webapp/src/App.tsx`: Thêm `AdminRoute` và route `/admin/google-drive`.
- `webapp/src/components/Layout.tsx`: Thêm menu `Google Drive` (admin-only) với icon `HardDrive`.
- `webapp/supabase/functions/google-apps-script-proxy/index.ts`: Gửi `authToken` nếu env `APPS_SCRIPT_TOKEN` được cấu hình.

**Kết quả:**
- `npm run verify` pass (tsc + build + eslint).
- `npm run test` pass (56/56 tests).
- 8 tác vụ khả dụng: Scan Folders, Set Permissions, Create Folder, Copy Folder, List Items, Move Item, Remove Permission, Delete Item.
- Edge Function hỗ trợ optional shared-secret với Apps Script Web App.

**Hướng dẫn deploy Apps Script:**
1. Tạo project mới tại https://script.google.com, dán `docs/FEAT-030-apps-script.gs` vào Code.gs.
2. Bật Advanced Service: Extensions → Services → Google Drive API (v3).
3. Deploy as Web App: Execute as Me, Anyone, copy URL.
4. (Khuyến nghị) Tạo script property `APPS_SCRIPT_TOKEN` và Supabase secret `APPS_SCRIPT_TOKEN` để bảo vệ URL.
5. Set Supabase secrets: `APPS_SCRIPT_WEB_APP_URL`, `SB_URL`, `SB_SERVICE_ROLE_KEY` (và `APPS_SCRIPT_TOKEN` nếu dùng).
6. Deploy Edge Function: `supabase functions deploy google-apps-script-proxy`.
7. Chạy migration: `supabase db push`.

---

## 2026-06-25

### 81. Refactor REFACTOR-006: ESLint Cleanup

**Mô tả:** Dọn dẹp toàn bộ 172 lỗi ESLint và TypeScript across 5 phases, đảm bảo codebase đạt trạng thái clean build (100% không còn lỗi compile hay lint).
- **Phase 1:** Sửa type `any` thành type cụ thể cho tất cả các hooks queries.
- **Phase 2:** Di chuyển các component con ra ngoài component chính trong Agent Detail để tránh `react-hooks/static-components` error, sửa type an toàn.
- **Phase 3:** Fix dependencies array trong hooks, tách exported components, remove setState synchronously trong Modals (DeactivateAgentModal, ComposeTemplateModal, CountdownConfirmModal, v.v.).
- **Phase 4:** Fix props, types và `no-explicit-any` tại Pages.
- **Phase 5:** Khắc phục warning hook trong `useAuth.tsx`, UI components và refactor lại các catch-block error (casting sang `Error` safety).

**Kết quả:**
- `npm run lint` pass (chỉ còn lại 1 unused-disable warning).
- `npm run build` pass không có lỗi type.

---

## 2026-06-20

### 80. Docs sync: Cập nhật trạng thái FEAT-004 trong PLAN-feature-dev.md

**Mô tả:** Đối chiếu codebase xác nhận FEAT-004 đã được triển khai toàn diện trong code. Cập nhật `PLAN-feature-dev.md` và `AGENTS.md` cho khớp với thực tế.

**Codebase evidence:**
- `webapp/src/main.tsx` đã setup `QueryClientProvider`.
- `webapp/src/hooks/queries/` có 17 hooks (vượt xa scope gốc plan: 4 hooks + 2 pages).
- Các pages chính đã refactor sang dùng `useQuery`/`useMutation`: `AgentsPage`, `RequestsPage`, `DashboardPage`, `AgentDetailPage`, `RequestDetailPage`, `ActivityLogPage`, `TrashPage`, `HolidaysPage`, `RanksPage`, `DivisionsPage`, `EmailTemplatesPage`.
- Logic `fetchExportData` trong `AgentsPage.tsx` vẫn dùng `supabase.from` trực tiếp nhưng đây là helper export one-off, không phải data fetching chính.

**Files sửa:**
- `webapp/docs/PLAN-feature-dev.md`:
  - Feature Registry: FEAT-004 status `partial` → `done`, thêm ngày hoàn thành `2026-05-30`.
  - Section FEAT-004: cập nhật Current Status phản ánh 17 hooks + các pages đã refactor.
- `webapp/docs/CHANGELOG.md`: Thêm entry này.
- `AGENTS.md`: Cập nhật Known Issues — FEAT-004 từ `Partial` → `done`.

**Kết quả:**
- Plan file đồng bộ với codebase.
- FEAT-004 chính thức đánh dấu hoàn thành.

---

## 2026-06-19

### 79. Fix BUG-036: Dashboard B2 chờ phản hồi chấp thuận không cập nhật khi active B2

**Mô tả:** Từ Request Detail, chuyển request sang B2. Sau khi thành công, quay về Dashboard, phần "B2 chờ phản hồi chấp thuận" không hiển thị request vừa chuyển cho đến khi F5.

**Root Cause:** `RequestDetailPage.tsx` sau các action thay đổi status chỉ invalidate `['request', 'detail', id]` và `['requests']`, không invalidate dashboard queries (`['dashboard', 'b2Requests']`, `['dashboard', 'stats']`, `['dashboard', 'statusCounts']`).

**Files sửa:**
- `webapp/src/pages/RequestDetailPage.tsx`:
  - Sau `confirmStep2Date`, `handleConfirmChange`, `handleCancelRequest`, bổ sung invalidate `['dashboard', 'b2Requests']`, `['dashboard', 'stats']`, `['dashboard', 'statusCounts']`.

**Kết quả:**
- Chuyển request sang B2 → Dashboard B2 pending hiển thị ngay, không cần F5.
- Hoàn tất / hủy request B2 → Dashboard B2 pending/alert và stats cập nhật ngay.

### 78. Fix BUG-035: RequestsPage không tự cập nhật khi tạo / thay đổi request

**Mô tả:** Sau khi tạo request mới từ Agent Detail, badge "Requests" trên sidebar cập nhật tự động nhưng request mới không hiện trong RequestsPage cho đến khi F5. Tương tự khi chuyển bước / hoàn tất / hủy request trong RequestDetailPage.

**Root Cause:** `CreateRequestModal.tsx` và `RequestDetailPage.tsx` sau khi mutation thành công chỉ invalidate query detail, không invalidate query list `['requests']`. RequestsPage subscribe Realtime chỉ khi đang mở, nên khi user tạo/thay đổi request từ trang khác, list cache vẫn cũ.

**Files sửa:**
- `webapp/src/components/CreateRequestModal.tsx`:
  - Import `useQueryClient`.
  - Sau insert request thành công, invalidate `['requests']` và `['layout', 'requestCount']`.
- `webapp/src/pages/RequestDetailPage.tsx`:
  - Sau `confirmStep2Date`, `handleConfirmChange`, `handleCancelRequest`, invalidate thêm `['requests']` cùng với `['request', 'detail', id]`.

**Kết quả:**
- Tạo request mới → navigate sang RequestsPage → request hiện ngay, không cần F5.
- Chuyển bước / hoàn tất / hủy request trong RequestDetailPage → quay lại RequestsPage → status đã cập nhật.
- Sidebar badge vẫn đồng bộ.

### 77. Feature FEAT-002: Supabase Realtime updates (comments, status, sidebar badge)

**Mô tả:** Tích hợp Supabase Realtime để tự động cập nhật UI khi có thay đổi trong database, bao gồm badge số đếm "Requests" trên sidebar.

**Files tạo:**
- `webapp/src/hooks/useRealtime.ts`: Hook reusable để subscribe Supabase Realtime `postgres_changes` events.
- `webapp/src/hooks/queries/useRequestCount.ts`: Hook query cho request count trên sidebar, dùng TanStack Query key `['layout', 'requestCount']`.

**Files sửa:**
- `webapp/src/components/Layout.tsx`:
  - Thay thế local state `requestCount` + `useEffect` fetch một lần bằng `useRequestCountQuery`.
  - Thêm `useRealtime` subscribe `t1_requests` để invalidate query `['layout', 'requestCount']` khi có INSERT/UPDATE/DELETE.
- `webapp/src/pages/RequestsPage.tsx`:
  - Thêm `useRealtime` subscribe `t1_requests`.
  - Khi có thay đổi, invalidate query `['requests']` để kanban/card tự động cập nhật.
- `webapp/src/pages/RequestDetailPage.tsx`:
  - Thêm `useRealtime` subscribe `t1_requests` với filter `id=eq.${id}`.
  - Thêm `useRealtime` subscribe `request_comments` với filter `request_id=eq.${id}`.
  - Khi có thay đổi, invalidate query `['request', 'detail', id]`.
- `webapp/src/pages/ActivityLogPage.tsx`:
  - Thêm `useRealtime` subscribe `activity_logs`.
  - Khi có thay đổi, invalidate query `['activity_logs']`.

**Kết quả:**
- Badge "Requests" trên sidebar tự động tăng/giảm khi có request mới hoặc request hoàn tất/hủy.
- RequestsPage tự động cập nhật danh sách và status counts.
- RequestDetailPage tự động cập nhật thông tin đề xuất và comments.
- ActivityLogPage tự động cập nhật timeline.

**Lưu ý:** Cần bật Realtime replication cho các bảng `t1_requests`, `request_comments`, `activity_logs` trong Supabase Dashboard → Database → Replication để subscription hoạt động.

### 76. Fix BUG-033: Agent Detail lưu thông tin không tự refresh, phải F5 mới thấy mới

**Mô tả:** Khi sửa thông tin agent (đặc biệt là rank) trong Agent Detail và bấm Lưu, UI chuyển về chế độ xem nhưng vẫn hiển thị dữ liệu cũ. Phải F5 mới thấy thông tin mới.

**Root Cause:** `AgentInfoTab.tsx` sau khi update DB thành công chỉ gọi `setIsEditing(false)` mà không invalidate cache của query `['agent', 'detail', agentId]`. `useAgentDetailQuery` có `staleTime` 5 phút nên giữ dữ liệu cũ.

**Files sửa:**
- `webapp/src/components/agent-detail/AgentInfoTab.tsx`:
  - Import `useQueryClient` từ `@tanstack/react-query`
  - Sau khi update DB thành công, gọi `queryClient.invalidateQueries({ queryKey: ['agent', 'detail', agent.id] })` và `queryClient.invalidateQueries({ queryKey: ['agents'] })`

**Kết quả:**
- Sau khi Lưu, Agent Detail tự động refetch và hiển thị thông tin mới (rank mới) ngay lập tức, không cần F5.
- AgentsPage cũng refetch để cột "Cấp bậc" đồng bộ.

---

## 2026-06-15

### 75. Feature FEAT-029: Dashboard Full-Viewport Layout — M1 Transition Fill Remaining Height

**Mô tả:** Chuyển Dashboard sang layout cố định 1 viewport (`100dvh`), M1 Transition tự động chiếm toàn bộ chiều cao còn lại, cách cạnh dưới browser 24px.

**Files sửa:**
- `webapp/src/pages/DashboardPage.tsx`:
  - Wrapper chuyển sang `h-[100dvh] overflow-hidden flex flex-col gap-6 p-6`
  - PageHeader, DashboardStats, B2PendingAlert, B2EligibleList wrap trong `div flex-shrink-0`
  - M1 Transition wrapper thêm `flex-1 min-h-0 pb-6`
  - Cập nhật loading skeleton theo layout mới
- `webapp/src/components/dashboard/M1TransitionList.tsx`:
  - Card thêm `h-full flex flex-col`
  - Header + filter tabs thêm `flex-shrink-0`
  - List area thay `max-h-[400px]` bằng `flex-1 overflow-y-auto min-h-0`

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.
- ESLint pass cho 2 files đã sửa.

---

### 75b. UI Polish: Thu hẹp spacing Dashboard

**Mô tả:** Giảm khoảng cách giữa PageHeader, DashboardStats và M1 Transition để giao diện gọn gàng hơn.

**Files sửa:**
- `webapp/src/pages/DashboardPage.tsx`:
  - Giảm `gap-6 p-6` → `gap-3 p-4`
  - Giảm `pb-6` → `pb-4` cho M1 wrapper
- `webapp/src/components/dashboard/M1TransitionList.tsx`:
  - Giảm card padding `p-5` → `p-4`
  - Giảm header margin `mb-4` → `mb-3`, gap `gap-3` → `gap-2`
  - Giảm filter tabs margin `mb-4` → `mb-3`

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.

---

### 76. Docs sync: Cập nhật trạng thái FEAT-009 → FEAT-018 trong PLAN-feature-dev.md

**Mô tả:** Đối chiếu codebase xác nhận các feature FEAT-009 đến FEAT-018 đã được triển khai trong code. Cập nhật `PLAN-feature-dev.md`:
- Feature Registry: đổi status từ `planned` → `done`, thêm ngày hoàn thành 2026-06-15.
- Phần chi tiết từng feature: thêm dòng `Hoàn thành: 2026-06-15`.

**Files sửa:**
- `webapp/docs/PLAN-feature-dev.md`

**Kết quả:**
- Plan file đồng bộ với codebase.

---

### 74. Feature FEAT-028: Dashboard M1 Transition Enhancement

**Mô tả:** Cải tiến Dashboard: ẩn card "Trạng thái đề xuất" và "Agent đang theo dõi", mở rộng M1 Transition ra full width, thêm filter tabs (Tất cả / Đủ điều kiện / Không đủ điều kiện / Đã gửi email), highlight email count badge.

**Files sửa:**
- `webapp/src/pages/DashboardPage.tsx`:
  - Bỏ import `StatusChart`, `BookmarkedAgentsCard`, `useStatusCountsQuery`, `useBookmarkedAgentsQuery`, `Card`
  - Bỏ grid layout `lg:grid-cols-3`, render `M1TransitionList` ở full width
  - Bỏ render `<BookmarkedAgentsCard />` và `<StatusChart />`
  - Cập nhật loading skeleton
  - Sửa type `canCreateRequest` dùng `Partial<Agent>` và `Pick<T1Change, ...>`
  - Sửa `catch (e: any)` thành type-safe
- `webapp/src/components/dashboard/M1TransitionList.tsx`:
  - Thêm filter state và tabs UI
  - Kết hợp search text + filter tab qua `useMemo`
  - Highlight badge "Đã gửi X lần" bằng màu blue
  - Sửa prop type `canCreateRequest` dùng `Partial<Agent>`

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.
- ESLint pass cho 2 files đã sửa (ESLint vẫn còn lỗi legacy từ code cũ).

---

## 2026-06-12

### 73. UI: Ẩn BulkActionsBar trong AgentsPage

**Mô tả:** Theo yêu cầu, ẩn thanh bulk actions (hiển thị "1 đã chọn", "Soạn mẫu", "Chấm dứt") khi chọn agent trong trang Agents.

**Files sửa:**
- `webapp/src/pages/AgentsPage.tsx`:
  - Xóa import `BulkActionsBar`
  - Xóa `bulkBarRef` và loại bỏ khỏi `useTableSelection` excludeRefs
  - Xóa block render `<BulkActionsBar>`
  - Xóa `clear` khỏi destructuring của `useTableSelection` vì không còn dùng

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.
- ESLint vẫn còn lỗi legacy từ code cũ.

---

## 2026-06-12

### 72. Fix BUG-030: ComposeTemplateModal tự đóng khi chọn loại mẫu do AgentsPage dựa vào selection

**Mô tả:** Sau khi thay native `<select>` bằng custom `Select` (BUG-028), modal "Soạn mẫu thông báo" vẫn tự đóng khi chọn loại mẫu.

**Root Cause:**
- `useTableSelection` trong `AgentsPage` clear selection khi click outside table.
- Mọi tương tác trong modal (dropdown option, copy button...) đều nằm ngoài `tableRef` → selection bị clear.
- `useEffect` thấy `selected.length !== 1` → gọi `setShowCompose(false)`.
- Modal render condition `{showCompose && selected.length === 1 && (...)}` phụ thuộc vào selection.

**Files sửa:**
- `webapp/src/pages/AgentsPage.tsx`:
  - Thêm state `composeAgentId: string | null`
  - Thêm `openCompose(agentId)` lưu agentId và mở modal
  - Thêm `closeCompose()` đóng modal và reset agentId
  - Sửa 2 nút "Soạn mẫu" (header + BulkActionsBar) gọi `openCompose(selected[0])`
  - Render modal: `{showCompose && composeAgentId && <ComposeTemplateModal agentId={composeAgentId} onClose={closeCompose} />}`
  - Bỏ `useEffect` tự động đóng modal

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.
- ESLint vẫn còn lỗi legacy từ code cũ.

---

## 2026-06-12

### 71. Fix BUG-028 + BUG-029: ComposeTemplateModal dropdown + template list sync

**Mô tả:**
- **BUG-028:** Trong AgentsPage, chọn agent → "Soạn mẫu" → dropdown "Chọn loại mẫu" dùng native `<select>`, khi chọn option modal tự đóng (do click-outside nhầm trên backdrop).
- **BUG-029:** `ComposeTemplateModal.loadTemplates()` hardcode 3 default templates và chỉ override subject/body nếu key trùng. Mẫu email mới (key khác) không hiển thị; mẫu đã xóa vẫn còn trong dropdown.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`:
  - Thay native `<select>` bằng custom `<Select>` từ `src/ui/input/Select.tsx`
  - Viết lại `loadTemplates()`:
    - Ưu tiên dữ liệu từ DB (`email_templates`)
    - Nếu DB rỗng → fallback về 3 default templates
    - Tự động reset `selectedKey` về template đầu tiên nếu key hiện tại không còn hợp lệ
  - Đảm bảo `template` luôn có giá trị (`?? templates[0]`) để tránh crash

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.
- ESLint vẫn còn lỗi legacy từ code cũ (không phải do fix này).

---

## 2026-06-12

### 70. Feature FEAT-026: Delete Email Template

**Mô tả:** Thêm chức năng xóa mẫu email trong trang Quản lý mẫu email. Admin bấm nút "Xóa" → confirm modal → hard delete mẫu khỏi DB.

**Files sửa:**
- `webapp/src/hooks/queries/useEmailTemplates.ts`:
  - Thêm `useDeleteEmailTemplateMutation()` dùng `supabase.from('email_templates').delete().eq('id', id)`
  - Invalidate query `['email_templates']` sau khi xóa thành công
- `webapp/src/components/email-templates/TemplateList.tsx`:
  - Thêm prop `onDelete?: (template: Template) => void`
  - Thêm nút "Xóa" màu danger (border + text danger, hover bg-danger-subtle) dùng icon `Trash2`
  - Role guard: chỉ hiển thị nút xóa khi `user?.role === 'admin'`
- `webapp/src/pages/EmailTemplatesPage.tsx`:
  - Thêm `useDeleteEmailTemplateMutation`
  - State `deletingTemplate` để mở confirm modal
  - `handleDelete()` gọi mutation, toast success/error
  - Render `ConfirmationModal` với title "Xóa mẫu email", description hiển thị tên + template key, confirm type danger, loading từ `deleteMut.isPending`

**Kết quả:**
- Build pass (`tsc -b && vite build`).
- 56/56 tests pass.
- ESLint vẫn còn lỗi legacy từ code cũ (không phải do feature này).

---

## 2026-06-11

### 69. Bug BUG-027: ComposeTemplateModal lấy nhầm request khi agent có nhiều request

**Mô tả:** `ComposeTemplateModal` query `t1_requests` theo `agent_id` + `limit(1)` — nếu agent có nhiều request, có thể lấy nhầm request mới nhất (ví dụ: `pending` chưa có T1) thay vì request đang xử lý (`step2`).

**Root Cause:** Modal chỉ nhận `agentId`, tự đoán request bằng cách lấy request active mới nhất.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`:
  - Thêm prop `requestId?: string`
  - Nếu có `requestId`, load request trực tiếp bằng `eq('id', requestId)`
  - Giữ logic `m1TaskId` và fallback query request active
- `webapp/src/components/dashboard/B2EligibleList.tsx`:
  - Sửa `onEmail` signature: `(agentId: string, requestId: string)`
  - Truyền `requestId` khi gọi `onEmail`
- `webapp/src/pages/DashboardPage.tsx`:
  - Sửa `emailModal` state lưu thêm `requestId`
  - Truyền `requestId` xuống `ComposeTemplateModal`

**Kết quả:** Build pass. 56/56 tests pass.

---

## 2026-06-11

### 68. Bug BUG-026: ComposeTemplateModal query `t1_requests` bị 400 Bad Request do cú pháp `.not('status', 'in', ...)` sai

**Mô tả:** Khi mở `ComposeTemplateModal` từ B2 list, query `t1_requests` trả về `400 Bad Request` vì cú pháp filter status dùng dấu nháy đơn thay vì nháy kép.

**Root Cause:**
```ts
.not('status', 'in', "('completed','cancelled')")  // ❌ Sai — 400 Bad Request
```
Supabase REST API yêu cầu dấu nháy kép bên trong: `("completed","cancelled")`.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx` — sửa cú pháp dòng 149

**Kết quả:** Build pass. 56/56 tests pass.

---

## 2026-06-11

### 67. Bug BUG-025: ComposeTemplateModal load sai T1 cũ / Temp T1 / New T1

**Mô tả:** Khi mở `ComposeTemplateModal` từ Dashboard M1 Transition, placeholder `{{oldT1Name}}`, `{{newT1Name}}`, `{{tempT1Name}}` render sai giá trị:
- Old T1 hiển thị giá trị của Temp T1 (vì load từ `agent.current_t1_id` thay vì `task.departed_agent_id`)
- New T1 không hiển thị (vì query loại trừ `completed`)
- Temp T1 không hiển thị (vì load từ `request.temp_t1_id` thay vì `task.temp_t1_id`)

**Root Cause:**
1. `t1Old` load từ `agent.current_t1_id` — sai khi agent đã bị đổi T1 trong DB.
2. `tempT1` load từ `request.temp_t1_id` — sai khi M1 Transition chứa `temp_t1_id` riêng trong `m1_transition_tasks`.
3. `newT1` query `t1_requests` loại trừ `completed` — nên không tìm thấy request khi đã hoàn tất.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`:
  - Refactor `loadData()` thành 2 nhánh:
    - **Có `m1TaskId`:** load `t1Old` từ `task.departed_agent_id`, `tempT1` từ `task.temp_t1_id`, `newT1` từ `task.parent_request_id → proposed_new_t1_id`
    - **Không có `m1TaskId`:** load `t1Old` từ `request.old_t1_id` (sửa từ `agent.current_t1_id`), `newT1` từ `request.proposed_new_t1_id`, `tempT1` từ `request.temp_t1_id`

**Kết quả:** Build pass. 56/56 tests pass.

---

## 2026-06-11

### 66. Bug BUG-024: Placeholder `{{tempT1Name}}` bị trùng giá trị với `{{oldT1Name}}`

**Mô tả:** Placeholder `{{tempT1Name}}` và `{{tempT1StaffId}}` trong email template đang render cùng giá trị với `{{oldT1Name}}` / `{{oldT1StaffId}}`, vì code chưa load `temp_t1` từ database mà hardcode map tới `t1Old`.

**Root Cause:**
1. `ComposeTemplateModal.tsx` — `loadData()` không select `temp_t1_id` từ `t1_requests`, không load agent tạm.
2. `SendEmailModal.tsx` — thiếu prop `tempT1`, `previewData['{{tempT1Name}}']` dùng `t1Old?.full_name` thay vì `tempT1?.full_name`.
3. UI hiển thị email liên quan cũng gán `T1 tạm` = `t1Old?.email`.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`:
  - Thêm state `tempT1`
  - Select thêm `temp_t1_id` từ `t1_requests`
  - Load agent tạm từ `temp_t1_id`
  - Sửa replace `{{tempT1Name}}` / `{{tempT1StaffId}}` dùng `tempT1`
  - Sửa UI email liên quan: `T1 tạm` hiển thị `tempT1?.email`
  - Truyền `tempT1` xuống `SendEmailModal`
- `webapp/src/components/SendEmailModal.tsx`:
  - Thêm prop `tempT1: Agent | null`
  - Thêm `{{tempT1StaffId}}` vào danh sách placeholder
  - Sửa `previewData['{{tempT1Name}}']` → `tempT1?.full_name`
  - Thêm `previewData['{{tempT1StaffId}}']` → `tempT1?.staff_id`

**Kết quả:** Build pass. `{{tempT1Name}}` giờ render tên T1 tạm thực sự, không còn trùng T1 cũ.

---

## 2026-06-11

### 65. Bug BUG-023: Dropdown placeholder trong HtmlEditor bị cắt và không scroll được

**Mô tả:** Khi mở dropdown "Chèn placeholder" trong modal chỉnh sửa mẫu email (`TemplateEditModal`), danh sách 14 placeholders bị cắt ngang bởi container `HtmlEditor` (do `overflow-hidden`) và không có scroll riêng.

**Root Cause:**
1. Container `HtmlEditor` có `overflow-hidden` cắt mọi phần tử `absolute` tràn ra ngoài boundary.
2. Dropdown menu không có `max-height` + `overflow-y-auto`, nên với nhiều item nó tràn dài và bị clip.

**Files sửa:**
- `webapp/src/components/HtmlEditor.tsx`:
  - Bỏ `overflow-hidden` ở container ngoài cùng (dòng 136)
  - Thêm `overflow-hidden rounded-md` vào div editor area (dòng 221) để giữ góc bo tròn
  - Thêm `max-h-60 overflow-y-auto` vào dropdown menu (dòng 202) để tự cuộn khi dài

**Kết quả:** Build pass. Dropdown hiển thị đầy đủ, có scroll riêng, không bị cắt.

---

## 2026-06-11

### 62. Thêm placeholder `{{b3Deadline}}` vào email template

**Mô tả:** Bổ sung placeholder `{{b3Deadline}}` để hiển thị ngày hết hạn 3 ngày làm việc của B2 (ngày xác nhận B2 + 3 ngày làm việc, trừ T7/CN/ngày lễ) trong email template.

**Files sửa:**
- `webapp/src/components/email-templates/TemplateEditModal.tsx` — thêm `{{b3Deadline}}` vào danh sách placeholder + preview data (`28/05/2026`)
- `webapp/src/components/email-templates/TemplatePreviewModal.tsx` — thêm preview data `{{b3Deadline}}`
- `webapp/src/components/HtmlEditor.tsx` — thêm `{{b3Deadline}}` vào danh sách placeholder mặc định
- `webapp/src/components/SendEmailModal.tsx` — thêm prop `b3Deadline`, thêm vào `previewData` và `defaultPlaceholders`
- `webapp/src/components/ComposeTemplateModal.tsx` — load `step2_confirmed_at` từ `t1_requests`, tính B3 deadline bằng `addBusinessDays(step2_confirmed_at, 3, holidays)`, truyền xuống `SendEmailModal`

**Logic:**
- Nếu request đang active có `step2_confirmed_at`, `{{b3Deadline}}` = `addBusinessDays(step2_confirmed_at, 3, holidays)` → format `dd/mm/yyyy`
- Nếu chưa có `step2_confirmed_at` (chưa qua B2), placeholder trả về chuỗi rỗng

---

## 2026-06-11

### 64. Bug BUG-022: B2PendingAlert không hiển thị do addBusinessDays parse ISO datetime sai

**Mô tả:** Request đang ở B2 (`step2_confirmed_at` có giá trị) nhưng biến mất khỏi Dashboard. Root cause: `addBusinessDays` nhận ISO datetime string từ Supabase → parse ra `NaN` → `Invalid Date` → so sánh filter luôn trả về `false`.

**Files sửa:**
- `webapp/src/lib/eligibility.ts` — `addBusinessDays`: thêm `startDateStr.slice(0, 10)` trước khi split để handle cả ISO datetime
- `webapp/src/lib/eligibility.test.ts` — thêm test case `handles ISO datetime strings from Supabase`

**Kết quả:** Build pass. 56/56 tests pass.

---

### 63. Feature FEAT-025: Email Activities Table cho M1 Transition Tracking

**Mô tả:** Tạo bảng `email_activities` riêng để audit việc copy email trong M1 Transition. Thay thế logic cũ (tính khi Resend thành công) bằng logic mới: tính khi user bấm "Copy nội dung" trong `ComposeTemplateModal`.

**Files tạo:**
- `webapp/supabase/migrations/018_email_activities.sql` — bảng `email_activities`, index, RLS policies, trigger `trg_update_m1_email_count`

**Files sửa:**
- `webapp/src/types/index.ts` — thêm `EmailActivity` interface
- `webapp/src/components/ComposeTemplateModal.tsx` — `copyContent()` thành async, insert record vào `email_activities` + invalidate query M1 transitions
- `webapp/src/components/SendEmailModal.tsx` — xóa logic update `email_sent_count` trực tiếp, xóa prop `m1TaskId`

**Trigger:** `handle_email_activity_insert()` — AFTER INSERT ON `email_activities` → tự động tăng `email_sent_count` và cập nhật `last_email_sent_at` trong `m1_transition_tasks`

**Kết quả:** Build pass. Logic đếm email giờ dựa trên hành vi copy thực tế, có audit trail đầy đủ.

---

## 2026-06-10

### 61. Feature FEAT-024: Testing Infrastructure — Smoke Test + Unit Test (Vitest)

**Mô tả:** Triển khai 2 lớp bảo vệ regression: Smoke Test Checklist (thủ công) + Unit Test tự động (Vitest).

**Technical Design:**
- Script `npm run verify`: `tsc -b && vite build && eslint .` — type check + build + lint
- Script `npm run test`: `vitest run` — unit test tự động
- `vitest.config.ts`: environment `jsdom`, setup file `src/test/setup.ts`, include `src/**/*.test.ts`
- `src/test/setup.ts`: import `@testing-library/jest-dom/vitest` để dùng matchers (toBe, toMatch, v.v.)

**Files tạo:**
- `webapp/vitest.config.ts`
- `webapp/src/test/setup.ts`
- `webapp/docs/SMOKE-TEST.md` — checklist 15 routes + 5 business logic luồng cốt lõi
- `webapp/src/lib/date-utils.test.ts` — 8 tests (formatDate, formatDateTime, formatTime, timezone Asia/Ho_Chi_Minh)
- `webapp/src/lib/eligibility.test.ts` — 26 tests (checkEligibility, getT1Capacity, isBusinessDay, addBusinessDays, checkCanChooseNewT1, getM1ImpactSummary)
- `webapp/src/lib/excel-generator.test.ts` — 21 tests (evaluateExpression, replaceExpressionsInCell — ddmmyy, [dd-1], R.num, literal mix)

**Files sửa:**
- `webapp/package.json` — thêm scripts `verify`, `test`, `test:watch`, `test:coverage`; thêm devDependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitest/coverage-v8`)
- `webapp/src/lib/eligibility.ts` — export thêm `AgentLike` và `ChangeLike` (để test import)

**Kết quả:** 56/56 tests pass. Build pass. ESLint có lỗi legacy từ code cũ (không phải do feature này).

**Fix bug phát hiện nhờ test:** `addBusinessDays()` trong `eligibility.ts` bị lệch timezone do `setHours(0,0,0,0)` dùng local time làm lùi UTC date, và `toISOString().slice(0,10)` dùng UTC trong khi `setDate()` dùng local time.
- Fix: Parse `startDateStr` bằng `new Date(y, m-1, d)` (local timezone) thay vì `new Date(startDateStr)` (UTC). Thêm helper `formatLocalDate()` dùng local getters để tạo YYYY-MM-DD string.
- Test cập nhật: dùng local getters (`getFullYear()`, `getMonth()`, `getDate()`) thay vì `toISOString()` để assert.

---

## 2026-06-10

### Docs: Archive PLAN-feature-dev.md & PLAN-bug-fixes.md

**Mô tả:** Tách các plan đã hoàn thành / đã fix sang file archive riêng để giảm dung lượng file active, dễ tra cứu.

**Files tạo:**
- `webapp/docs/PLAN-feature-archive.md` — chứa 10 feature plan đã `done` (FEAT-001, 003, 006, 007, 014, 015, 019, 020, 021, 023)
- `webapp/docs/PLAN-bug-archive.md` — chứa 32 bug plan đã `fixed` (BUG-001 → BUG-030, 032, và các bug khác)

**Files sửa:**
- `webapp/docs/PLAN-feature-dev.md` — giữ lại 12 item active (backlog/planned/in_progress/partial/fixed)
- `webapp/docs/PLAN-bug-fixes.md` — giữ lại 1 item active (BUG-021 planned)

---

## 2026-06-10

### 60. Feature FEAT-023: Tra cứu upline theo rank trong Excel Generator

**Mô tả:** Thêm tab "Tra cứu upline" trong trang Excel Generator. User upload file CSV/Excel chỉ chứa cột `staff_id`, hệ thống tra cứu và trả về T1, T2, T3, ngườii giới thiệu và danh sách agent tuyến trên có rank DD/SDD/GDD/SGDD/RGDD/EGDD (comma-separated nếu nhiều ngườii cùng rank). Hỗ trợ preview trên UI và tải xuống Excel.

**Technical Design:**
- Tạo PostgreSQL RPC `get_agent_upline_ranks(p_staff_ids TEXT[])` dùng self-join 3 lần để lấy T1/T2/T3 + referrer, sau đó aggregate bằng `STRING_AGG` + `CASE` để nhóm theo rank (case-insensitive qua `ILIKE`).
- `UplineLookupPanel.tsx`: upload zone kéo thả, parse CSV/XLSX qua `readCsvFile`/`readDataFile`, validate cột `staff_id`, gọi RPC, preview table, export Excel qua SheetJS.
- `ExcelGeneratorPage.tsx`: Thêm tab `upline` cạnh `generate`, `history`, `templates`.
- `types/index.ts`: Thêm `AgentUplineRankResult`.

**Files tạo:**
- `webapp/supabase/migrations/016_agent_upline_ranks.sql`
- `webapp/src/components/excel-generator/UplineLookupPanel.tsx`

**Files sửa:**
- `webapp/src/types/index.ts`
- `webapp/src/pages/ExcelGeneratorPage.tsx`

**Lưu ý:** `referrer_id` hiện tại được DB trigger đồng bộ với `current_t1_id`, nên cột "Ngườii giới thiệu" trong kết quả sẽ luôn bằng T1.

### 58. Fix BUG-032: Excel Generator — Ngày trong tab Generate bị giảm 1 ngày khi export

**Bug:** Trong tab Generate của Excel Generator, ngày tháng bị giảm mất 1 ngày khi generate file Excel. Ví dụ: `18/09/2022` trong file data hoặc date picker sau khi generate ra chỉ còn `17/09/2022`.

**Root cause:**
1. `GeneratePanel.tsx` dùng `new Date(generateDate)` với `generateDate` dạng `YYYY-MM-DD` → ECMAScript parse như UTC 00:00, sau đó expression parser lấy ngày bằng `.getDate()` theo local timezone. Cách này không robust và có thể lệch khi timezone không đồng nhất.
2. `formatDateDDMMYYYY()` và `formatDateToken()` trong `excel-generator.ts` dùng `date.getDate()` / `date.getMonth()` / `date.getFullYear()` — local methods phụ thuộc timezone máy tính. File Excel lưu date dạng serial UTC; khi SheetJS chuyển về `Date` object, local parse có thể làm tròn xuống ngày trước đó.

**Fix:**
- `excel-generator.ts`:
  - Thêm `parseDateFromInput(dateStr)` để parse `YYYY-MM-DD` thành Date ở **local timezone** (`new Date(y, m - 1, d)`).
  - Sửa `formatDateDDMMYYYY()` dùng `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })` thay vì local getters.
  - Sửa `formatDateToken()` trong expression parser dùng `Intl.DateTimeFormat` với timezone `Asia/Ho_Chi_Minh` để lấy `dd`, `mm`, `yy`, `yyyy`.
- `GeneratePanel.tsx`: Thay `new Date(generateDate)` bằng `parseDateFromInput(generateDate)` ở 3 chỗ (auto-apply mapping, apply mapping, generate workbook).

**Files sửa:**
- `webapp/src/lib/excel-generator.ts`
- `webapp/src/components/excel-generator/GeneratePanel.tsx`

### 59. Fix BUG-032 (Phase 2): Excel Generator — XLSX data import date bị lệch timezone

**Phát sinh khi test:** CSV đúng nhưng XLSX vẫn lỗi. File XLSX data chứa cell date serial (ví dụ `44822`), SheetJS `cellDates: true` parse thành `Date` object bị lệch ~8 tiếng (`2022-09-17T16:59:30Z` thay vì `2022-09-18T00:00:00Z`).

**Fix:**
- `excel-generator.ts`:
  - Thêm `isDateFormatted(w)` detect date serial qua formatted text pattern `\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}`.
  - Thêm `excelSerialToDate(serial)` tính ngày chính xác từ serial theo **1900 epoch** (`1899-12-30`).
  - Rewrite `readDataFile()`: iterate cells thay vì `sheet_to_json`, detect date serial và format bằng `formatDateDDMMYYYY()`; string/number khác giữ nguyên `cell.v`.
- `GeneratePanel.tsx`: Bỏ `cellDates: true` khi đọc file data XLSX.

**Files sửa:**
- `webapp/src/lib/excel-generator.ts`
- `webapp/src/components/excel-generator/GeneratePanel.tsx`

---

## 2026-06-09

### 56. Fix BUG-028 + BUG-029 + BUG-030: Excel Generator — Uppercase, CSV date/zero, XLSX serial date

**Bug:**
1. Tick "VIẾT HOA" trong mapping nhưng giá trị không viết hoa khi generate.
2. Import file CSV: ngày tháng hiển thị lỗi (Excel serial date), SĐT và CCCD mất số 0 đầu.
3. Import file XLSX: ngày tháng chỉ hiện số (Excel serial date).

**Root cause:**
1. `GeneratePanel.tsx` khi auto-apply saved mapping từ template, tạo lại object `FieldMappingValue` cho type `'column'` nhưng quên giữ lại `uppercase` flag.
2. `XLSX.read` parse CSV tự động convert giá trị giống số/date thành `number` (mất số 0) hoặc Excel serial date.
3. `XLSX.read` mặc định `cellDates: false`, nên cell date trong xlsx trả về serial number.

**Fix:**
- `GeneratePanel.tsx`:
  - Thêm `uppercase: mapVal.uppercase` khi adapt saved mapping cho type `'column'`.
  - Phân nhánh đọc file: `.csv` → dùng raw text parser tự viết (giữ nguyên string); `.xlsx/.xls` → `XLSX.read(..., { cellDates: true })`.
- `excel-generator.ts`:
  - Thêm `parseCsvText()` + `readCsvFile()`: parser CSV đơn giản xử lý quoted fields, giữ nguyên nội dung text (không mất số 0, không lỗi date).
  - Sửa `readDataFile()`: format `Date` object thành `dd/mm/yyyy` thay vì `String(date)`.

**Files sửa:**
- `webapp/src/components/excel-generator/GeneratePanel.tsx`
- `webapp/src/lib/excel-generator.ts`

---

### 57. Fix BUG-031: Excel Generator — Inline refs `{{...}}` không hoạt động trong giá trị cố định

**Bug:** Nhập giá trị cố định trong mapping panel chứa `{{...}}` (ví dụ: `Hợp Đồng Nguyên Tắc - {{#Fullname_CTV#}} - {{#staff_id_ctv#}}`) nhưng generate ra nguyên xi, không thay thế `{{...}}`.

**Root cause:** `generateWorkbook` và `buildPreview` chạy `replaceFieldReferences` trước khi apply direct mapping. Sau khi `mapped.type === 'fixed'` ghi đè `value = mapped.value`, không có bước nào xử lý `{{...}}` trên giá trị cố định.

**Fix:** Thêm `replaceFieldReferences(value, dataRow, mapping)` ngay sau khi gán giá trị cố định trong cả `generateWorkbook` và `buildPreview`.

**Files sửa:**
- `webapp/src/lib/excel-generator.ts`

---

## 2026-06-08

### 53. Feature: Import cập nhật cấp bậc hàng loạt (Rank Update)

**Mô tả:** Thêm chế độ "Cập nhật cấp bậc" trong trang Upload. Chỉ cần 2 cột `staff_id` và `rank_name` trong file Excel/CSV để cập nhật cấp bậc cho hàng loạt agent.

**Technical Design:**
- `UploadPage.tsx`: Thêm tab switch giữa "Import đầy đủ" và "Cập nhật cấp bậc".
- Chế độ rank: validate 2 cột `staff_id` + `rank_name`, lookup `ranks` table để ánh xạ `rank_name` → `rank_id` (case-insensitive), sau đó update từng agent theo `staff_id`.
- Báo cáo: số thành công, số không tìm thấy agent, số không tìm thấy cấp bậc.

**Files sửa:**
- `webapp/src/pages/UploadPage.tsx`

---

## 2026-06-08

### 54. Fix BUG-026: Excel Generator — Preview trống và chỉ hiển thị 10 dòng

**Bug:**
1. Preview chỉ hiển thị 10 dòng đầu, user không thể review toàn bộ data.
2. Preview table hiển thị trống dù mapping đã match — do case mismatch giữa template header row (e.g., "TÊN TÀI LIỆU (*)") và template config fields (e.g., "Tên tài liệu (*)") khiến `mapping[fieldName]` trả về `undefined`.

**Fix:**
- `excel-generator.ts`:
  - `buildPreview`: bỏ `limit = 10`, thành `limit?: number` (optional). Khi không truyền limit thì preview toàn bộ rows.
  - `buildPreview` + `generateWorkbook`: thêm `normalizedMapping` (Map lowercase) để lookup mapping case-insensitive.
  - Thêm `getDataValue()` helper để lookup giá trị từ `dataRow` case-insensitive (fix case mismatch giữa header file data và tên cột trong mapping).
  - `replaceFieldReferences`: thêm normalized mapping lookup để xử lý case mismatch trong inline `{{...}}` references.
  - **BUG chính:** `buildPreview` dòng check `templateHeaderRow >= templateWorkbook.SheetNames.length` — `SheetNames.length` là **số sheet** (thường = 1), không phải số dòng. Khi `templateHeaderRow = 1`, điều kiện này `true`, khiến `buildPreview` return sớm với `rows: previewRows` (data rows nguyên bản có key = data headers). Trong khi `headers` vẫn là template fields → key mismatch → preview trống. **Sửa thành `templateHeaderRow >= json.length`.**
- `GeneratePanel.tsx`: truyền `undefined` thay vì `10` khi gọi `buildPreview`; cập nhật UI text từ "dòng đầu" → "X / Y dòng"; thêm wrapper `min-w-max` cho preview table để cho phép scroll ngang khi nhiều cột.

**Files sửa:**
- `webapp/src/lib/excel-generator.ts`
- `webapp/src/components/excel-generator/GeneratePanel.tsx`

---

## 2026-06-09

### 55. Fix BUG-027: Agent edit rank không cập nhật rank_name + M1 Transition không cho tạo đề xuất

**Bug:**
1. Trong Agent Detail → Edit → đổi rank thành CS → lưu → view vẫn hiển thị ASC.
2. M1 Transition không cho tạo đề xuất cho agent này.

**Root cause:** Form edit chỉ update `rank_id`, không update `rank_name`. Display ưu tiên `rank_name` trước `rank_id`, nên vẫn hiện giá trị cũ. Eligibility check cũng dùng `rank_name != 'ASC'`, nên agent vẫn bị tính là ASC → không đủ điều kiện.

**Fix:** `AgentInfoTab.tsx`: trong `onSubmit`, khi `rank_id` thay đổi, đồng bộ cập nhật `rank_name` tương ứng từ bảng `ranks` (hoặc set `null` nếu xóa rank).

**Files sửa:**
- `webapp/src/components/agent-detail/AgentInfoTab.tsx`

---

## 2026-06-05

### 52. Fix BUG-025: Excel Generator — "Không tìm thấy template sau khi cập nhật"

**Bug:** Khi bấm "Cập nhật template" trong modal sửa template, hiện lỗi "Không tìm thấy template sau khi cập nhật".

**Root cause:**
1. Migration `017_excel_templates.sql` thiếu UPDATE RLS policy cho bảng `excel_templates` — chỉ có SELECT, INSERT, DELETE.
2. Khi UPDATE bị RLS từ chối, `.update().select()` trả về empty array với `error = null` (silent fail) → code đi vào nhánh `if (!result)` và báo lỗi.

**Fix:**
- `supabase/migrations/017_excel_templates.sql`: Thêm UPDATE policy `Allow admin to update excel_templates`.
- `TemplateUploadModal.tsx`: Nếu `updated` empty nhưng không có `dbError`, fallback merge `editTemplate` + `payload` trả về cho `onUploaded`.

**SQL cần chạy thủ công trên Supabase SQL Editor:**
```sql
DROP POLICY IF EXISTS "Allow admin to update excel_templates" ON public.excel_templates;
CREATE POLICY "Allow admin to update excel_templates"
  ON public.excel_templates FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Files sửa:**
- `webapp/supabase/migrations/017_excel_templates.sql`
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx`

---

### 51. Fix BUG-024: Excel Generator — "Cannot coerce the result to a single JSON object"

**Bug:** Khi cập nhật template Excel, hiện lỗi "Cannot coerce the result to a single JSON object".

**Root cause:** `.update().eq('id', editTemplate.id).select().single()` — nếu `editTemplate.id` bị undefined hoặc filter không match đúng 1 row thì `.single()` throw lỗi.

**Fix:**
- `TemplateUploadModal.tsx`: Thêm guard check `editTemplate?.id`; bỏ `.single()` trong cả update và insert, thay bằng `.select()` + `data?.[0]`.

**Files sửa:**
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx`

---

### 50. Fix BUG-023: M1 Transition vẫn hiển thị agent expired sau khi deactivate

**Bug:** Khi deactivate agent, task được update thành `expired` nhưng vẫn hiển thị trong Dashboard M1 Transition dưới dạng "Quá hạn 30 ngày" với các nút action. Agent đã ngừng hoạt động nên không còn khả năng xử lý transition.

**Root cause:**
- `DeactivateAgentModal` không invalidate query `['dashboard', 'm1Transitions']` → stale cache.
- Server-side filter `.eq('m1_agent.status', 'active')` qua Supabase FK embedding không hoạt động đúng.

**Fix:**
- `useM1Transitions.ts`: Bỏ server-side filter, thêm client-side filter `.filter((t) => t.m1_agent?.status === 'active')`.
- `DeactivateAgentModal.tsx`: Import `useQueryClient`, invalidate `['dashboard', 'm1Transitions']` và `['dashboard', 'stats']` sau deactivate thành công.

**Files sửa:**
- `webapp/src/hooks/queries/useM1Transitions.ts`
- `webapp/src/components/DeactivateAgentModal.tsx`

---

### 49. Fix BUG-022: M1 Transition vẫn hiển thị agent đã deactivate

**Bug:** Khi agent bị deactivate nhưng vẫn đang là M1 trong `m1_transition_tasks` pending, agent tiếp tục hiển thị trong Dashboard M1 Transition.

**Root cause:** `deactivateAgent` chỉ tạo transition tasks mới cho M1 của agent bị deactivate, nhưng không cancel các task cũ mà agent đó là `m1_agent_id` hoặc `departed_agent_id`.

**Fix:**
- `agent-actions.ts`: Thêm 2 bước trong `deactivateAgent` để update `status = 'expired', resolved_at = now` cho task có `m1_agent_id = agentId` và task có `departed_agent_id = agentId`.

**Files sửa:**
- `webapp/src/lib/agent-actions.ts`

---

### 48. Fix BUG-021: M1 Transition task không bị resolved khi agent hoàn tất chuyển T1

**Bug:** Khi agent hoàn tất request chuyển T1 (ví dụ: Võ Phúc Thịnh - TV00091), các `m1_transition_tasks` cũ mà agent đó là M1 vẫn còn `status = 'pending'` và tiếp tục hiển thị trong Dashboard M1 Transition.

**Root cause:** `completeRequestAction` chỉ update `agents.current_t1_id` và tạo task mới cho M1 của agent đó, nhưng không resolve các task cũ có `m1_agent_id = request.agent_id`.

**Fix:**
- `request-actions.ts`: Thêm bước update `status = 'm1_changed', resolved_at = now` cho `m1_transition_tasks` có `m1_agent_id = request.agent_id` và `status IN ('pending', 'expired')` sau khi update agent.

**Files sửa:**
- `webapp/src/lib/request-actions.ts`

---

### 47. Fix BUG-020: Dashboard stats = 0 do RPC `get_dashboard_stats` chưa deploy / fail

**Bug:** 4 cards thống kê đầu Dashboard (Tổng Agent, Tổng Requests, Đang xử lý, Hoàn tất) đều hiển thị 0 dù DB có data. M1 Transition và Trạng thái đề xuất vẫn hiển thị đúng.

**Root cause:** `useDashboardStats.ts` gọi RPC `get_dashboard_stats()`. Nếu RPC chưa được tạo trên Supabase (migration chưa chạy thủ công) hoặc fail → `data = null` → UI fallback `?? 0`. `DashboardPage` không bắt `statsError` nên không hiện toast.

**Fix:**
1. `useDashboardStats.ts`: Thử RPC trước. Nếu RPC fail/null → fallback sang query 4 count riêng lẻ từ bảng bằng `Promise.all`.
2. `DashboardPage.tsx`: Thêm `statsError` + toast "Lỗi tải thống kê".

**SQL cần chạy thủ công trên Supabase SQL Editor:**
```sql
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_agents INTEGER;
  v_total_requests INTEGER;
  v_pending INTEGER;
  v_completed INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_agents FROM public.agents WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_total_requests FROM public.t1_requests WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_pending FROM public.t1_requests WHERE deleted_at IS NULL AND status IN ('step1','step2','step3','step4','step5');
  SELECT COUNT(*) INTO v_completed FROM public.t1_requests WHERE deleted_at IS NULL AND status = 'completed';
  RETURN jsonb_build_object('total_agents', v_total_agents, 'total_requests', v_total_requests, 'pending', v_pending, 'completed', v_completed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Files sửa:**
- `webapp/src/hooks/queries/useDashboardStats.ts`
- `webapp/src/pages/DashboardPage.tsx`

---

### 46. Fix BUG-019: AgentsPage T1 hiện tại hiển thị UUID thay vì Tên - Staff ID

**Bug:** Cột "T1 HIỆN TẠI" hiển thị UUID rút gọn (8 ký tự đầu) thay vì format `Tên - Staff ID`.

**Root cause:** `useAgents.ts` dùng FK embedding `t1:current_t1_id(full_name, staff_id)` nhưng khi build `t1Map` lại check `a.t1?.id`. Vì query không include `id`, `t1Map` luôn rỗng → UI fallback về `t1Id.slice(0, 8)`.

**Fix:** Thêm `id` vào select: `t1:current_t1_id(id, full_name, staff_id)`.

**Files sửa:**
- `webapp/src/hooks/queries/useAgents.ts`

---

### 45. Fix BUG-018: Duplicate division "Khác" do 2 migrations cùng insert

**Xóa division "Khác" thừa, giữ lại 1 division mặc định duy nhất.**

- `supabase/migrations/008_schema_v2_agents.sql`:
  - Comment dòng INSERT division 'Khác' vì `010_seed_divisions_from_eravntrans.sql` đã có.

- SQL chạy thủ công trên Supabase SQL Editor:
  ```sql
  UPDATE public.agents SET division_id = '33cbbe26-006a-4255-80af-2f3311a71297'
  WHERE division_id = '0202c20d-3337-46cb-92c3-4b1730183480';
  DELETE FROM public.divisions WHERE id = '0202c20d-3337-46cb-92c3-4b1730183480';
  ```

---

## 2026-06-05

### 44. Fix BUG-017: BulkActionsBar buttons không click được do click-outside clear selection

**AgentsPage: Nút "Soạn mẫu" và "Chấm dứt" trong BulkActionsBar giờ hoạt động đúng.**

- `src/hooks/useTableSelection.ts`:
  - Thêm `excludeRefs?: React.RefObject<HTMLElement | null>[]` vào options.
  - Trong `handleClick`, kiểm tra nếu click target nằm trong bất kỳ `excludeRefs` nào thì skip `clear()`.

- `src/pages/AgentsPage.tsx`:
  - Tạo `bulkBarRef` và `headerRef`, truyền vào `useTableSelection({ excludeRefs: [bulkBarRef, headerRef] })`.
  - Bọc `<BulkActionsBar>` trong `<div ref={bulkBarRef}>`.
  - Bọc vùng nút action ở `<PageHeader>` trong `<div ref={headerRef}>`.
  - Thêm `useEffect` đóng `ComposeTemplateModal` khi `selected.length !== 1`, tránh modal tự hiện do state "dính".

---

## 2026-06-05

### 43. Fix CountdownConfirmModal — Full-page backdrop + center popup

**Backdrop giờ đây mờ toàn bộ page thay vì chỉ content area.**

- `src/components/CountdownConfirmModal.tsx`:
  - Dùng `createPortal` để render ra `document.body`, tránh bị giới hạn bởi stacking context của parent.
  - Tăng `z-index` lên `z-[100]` để nổi trên cả sidebar và header.
  - Thêm `backdrop-blur-sm` cho backdrop đẹp hơn.
  - Cập nhật style sang tokens mới (bg-bg-primary, rounded-sm, shadow-modal, text-text-primary).

---

## 2026-06-05

### 42. Tăng base font-size từ 13px lên 16px

**Theo yêu cầu user — tăng size chữ toàn app.**

- `src/index.css` — Sửa `html { font-size: 13px; }` → `html { font-size: 16px; }`.
- Tất cả typography scale tăng tương ứng theo tỷ lệ rem.

---

## 2026-06-05

### 41. REFACTOR-005: Twenty UI/UX Full Adoption — Phase 7 (Page-by-Page Polish — Remaining Pages)

**Refactor 4 pages còn lại + component con theo Twenty UI/UX patterns.**

**Pages đã refactor:**
- `src/pages/UploadPage.tsx` — Dùng PageHeader, Card, Section, Table primitives. Dropzone restyle với tokens. Progress bar dùng `bg-gray-3` + `bg-accent`. Report panel dùng Card + Badge.
- `src/pages/EmailTemplatesPage.tsx` — Dùng PageHeader + TableSkeletonLoader. Loading state chuẩn.
- `src/pages/ActivityLogPage.tsx` — Dùng PageHeader, Card, TextInput, Badge, EmptyState context-aware. Timeline restyle với tokens mới.
- `src/pages/ExcelGeneratorPage.tsx` — Dùng PageHeader, tab nav restyle với tokens.

**Components con đã refactor:**
- `src/components/email-templates/TemplateList.tsx` — Dùng Table, TableHeader, TableRow, TableCell primitives. EmptyState chuẩn.
- `src/components/email-templates/TemplateEditModal.tsx` — Dùng FormField + TextInput primitives. Giữ react-hook-form + zod.
- `src/components/email-templates/TemplatePreviewModal.tsx` — Dùng Modal updated với tokens.
- `src/components/excel-generator/TemplateManager.tsx` — Dùng Table primitives + Badge mapping status + EmptyState.
- `src/components/excel-generator/GenerationHistory.tsx` — Dùng Table primitives + EmptyState.
- `src/components/excel-generator/GeneratePanel.tsx` — Dùng Card, Section, Table primitives. Dropzone, mapping panel, preview table restyle.

**Shared component updated:**
- `src/components/Modal.tsx` — Cập nhật style sang tokens mới (bg-bg-primary, rounded-sm, shadow-modal, border-border-hairline, text-text-primary). Giữ API backward-compatible.

**Files sửa:** 10 files

---

## 2026-06-05

### 40. REFACTOR-005: Twenty UI/UX Full Adoption — Phase 6 (Accessibility & Motion)

**Audit và cải thiện accessibility toàn app theo WCAG AA.**

**Focus Management:**
- `src/hooks/useFocusTrap.ts` — Thêm **focus stack** để hỗ trợ nested modals. Modal trên cùng mới trap focus.
- `src/ui/layout/Modal.tsx` — Thêm `aria-labelledby` trỏ đến title; close button tăng touch target lên 40×40px.

**Touch Targets (min 40×40px):**
- `src/components/Layout.tsx` — Mobile menu, sidebar toggle, user menu.
- `src/ui/layout/PageHeader.tsx` — Close / collapse buttons.
- `src/ui/feedback/BulkActionsBar.tsx` — Clear selection button.
- `src/components/CountdownConfirmModal.tsx` — Close button.
- `src/components/NotificationDropdown.tsx` — Bell button.
- `src/pages/AgentDetailPage.tsx` — Star button.

**Semantic HTML:**
- `src/components/Layout.tsx` — `<aside aria-label="Sidebar navigation">`.
- Các page `ActivityLogPage`, `RequestDetailPage`, `UploadPage` — Sửa `<h3>` → `<h2>` để tuân thủ heading hierarchy (không skip level).

**ARIA:**
- `src/ui/feedback/ToastProvider.tsx` — Container thêm `role="status"`, `aria-live="polite"`, `aria-atomic="true"`. Close button thêm `aria-label`.
- `src/components/Layout.tsx` — User menu thêm `aria-expanded`.
- `src/pages/DivisionsPage.tsx` — Clear agent button thêm `aria-label`.
- Toàn app — Thêm `aria-hidden="true"` cho decorative icons trong buttons, empty states, info rows.

**Files sửa:** 15+ files

---

## 2026-06-05

### 39. REFACTOR-005: Twenty UI/UX Full Adoption — Phase 5 (Form Patterns)

**Refactor toàn bộ forms chính sang `react-hook-form` + `zod`, tạo `FormField`/`FormSection` primitives.**

**Form Primitives:**
- `src/ui/input/TextInput.tsx` — Forward ref để hỗ trợ `register` từ react-hook-form.
- `src/lib/form-schemas.ts` — Tập trung tất cả zod schemas: `loginSchema`, `changePasswordSchema`, `createRequestSchema`, `rankSchema`, `divisionSchema`, `emailTemplateSchema`, `holidaySchema`, `agentInfoSchema`.

**Forms đã refactor:**
| Form | Schema | Ghi chú |
|------|--------|---------|
| `LoginPage` | `loginSchema` | Email + password validation, bỏ `useState` |
| `ChangePasswordPage` | `changePasswordSchema` | Password + confirm match, bỏ `useState` |
| `CreateRequestModal` | `createRequestSchema` | Validate `selectedT1Id` được chọn, giữ nguyên search dropdown + eligibility RPC |
| `AgentInfoTab` | `agentInfoSchema` | **Thêm edit mode** với ~25 fields schema v2, chia 4 sections (Thông tin cơ bản, Thông tin cá nhân, Ngân hàng & Thuế, Nghề nghiệp), nút Sửa/Lưu/Hủy inline |
| `RanksPage` modal | `rankSchema` | name, rank_type, sort_order |
| `DivisionsPage` modal | `divisionSchema` | name, head_agent_id (search dropdown), is_official |
| `EmailTemplatesPage` / `TemplateEditModal` | `emailTemplateSchema` | name, template_key, subject, body (HtmlEditor qua Controller) |
| `HolidaysPage` modal | `holidaySchema` | holiday_date, name |

**Files sửa:**
- `src/ui/input/TextInput.tsx`
- `src/lib/form-schemas.ts` — Mới
- `src/pages/LoginPage.tsx`
- `src/pages/ChangePasswordPage.tsx`
- `src/components/CreateRequestModal.tsx`
- `src/components/agent-detail/AgentInfoTab.tsx`
- `src/pages/RanksPage.tsx`
- `src/pages/DivisionsPage.tsx`
- `src/components/email-templates/TemplateEditModal.tsx`
- `src/pages/HolidaysPage.tsx`
- `src/pages/EmailTemplatesPage.tsx` (bỏ validation thủ công trong `handleSave`)

---

## 2026-06-04

### 38. REFACTOR-005: Twenty UI/UX Full Adoption — Phase 4 (Table & List Refactor)

**Nâng cấp toàn bộ tables trong app theo Twenty CRM table patterns.**

**Filter Chips:**
- `src/ui/input/FilterChips.tsx` — Component hiển thị active filters dạng removable chip + nút "Xóa tất cả".
- Tích hợp vào `AgentsPage` (search + quick filter) và `RequestsPage` (search + status filter).

**Table Selection (nâng cao):**
- `src/hooks/useTableSelection.ts` — Hook quản lý selection với: toggle, select all, indeterminate state, shift-click range select, click-outside deselect.
- `src/ui/feedback/BulkActionsBar.tsx` — Bottom fixed bar hiển thị khi có selection, hỗ trợ custom actions + nút bỏ chọn.
- `AgentsPage` — Refactor sang dùng `useTableSelection` + `BulkActionsBar` thay vì text "Đã chọn X agent".

**Column Resizing:**
- `src/hooks/useColumnResize.ts` — Hook quản lý widths array, drag-to-resize với global mouse listeners.
- `src/ui/layout/TableHeader.tsx` — Thêm `resizable` prop + drag handle ở border header.
- Áp dụng column resize cho toàn bộ pages có table: `AgentsPage`, `RequestsPage`, `TrashPage`, `HolidaysPage`, `RanksPage`, `DivisionsPage`.

**Context-aware Empty States:**
- Cập nhật `EmptyState` trong tất cả tables: hiển thị `filter_empty` khi có active filter/search không match, `no_data` khi database trống.
- Thêm nút "Xóa bộ lọc" trong empty state khi có active filters.

**Files mới:** `src/ui/input/FilterChips.tsx`, `src/hooks/useTableSelection.ts`, `src/hooks/useColumnResize.ts`, `src/ui/feedback/BulkActionsBar.tsx`.
**Files sửa:** `src/ui/layout/TableHeader.tsx`, `src/pages/AgentsPage.tsx`, `src/pages/RequestsPage.tsx`, `src/pages/TrashPage.tsx`, `src/pages/HolidaysPage.tsx`, `src/pages/RanksPage.tsx`, `src/pages/DivisionsPage.tsx`.

---

## 2026-06-04

### 37. REFACTOR-005: Twenty UI/UX Full Adoption — Phase 1-3 + Partial Phase 7

**Refactor UI/UX theo Twenty CRM patterns, giữ nguyên Tailwind CSS v4.**

**Phase 1 — Design Tokens & Global Styles:**
- `src/ui/theme/tokens.css` — CSS custom properties dựa trên Radix gray scale + Twenty accent (`#4a38f5`).
- `src/index.css` — Rewrite với `@theme` block mới, base 13px, font Inter, focus ring, prefers-reduced-motion, legacy neutral aliases cho backward compat.
- `index.html` — Thêm Google Fonts Inter.

**Phase 2 — Layout Architecture:**
- `src/ui/layout/` — PageContainer, PageHeader, PageBody, ShowPageContainer, Card, Section, Modal (base primitive), Table, TableHeader, TableRow, TableCell.
- `src/components/Layout.tsx` — Refactor sidebar resizable/collapsible (240px → 64px), mobile bottom nav, header styling theo tokens mới.

**Phase 3 — Component Primitives:**
- `src/ui/display/` — Badge, EmptyState (context-aware), Skeleton, Avatar, AvatarGroup, Chip, Pill, Tag.
- `src/ui/input/` — TextInput, TextArea, Select (searchable/clearable), InputLabel, InputErrorHelper, InputHint.
- `src/ui/navigation/` — NavigationDrawerItem, Breadcrumb, MobileNavigationBar.
- `src/ui/feedback/` — ToastProvider (queue + dedupe + pause on hover), useToast, ConfirmationModal, DialogManager, PageContentSkeletonLoader, TableSkeletonLoader, LeftPanelSkeletonLoader.
- `src/components/FormField.tsx`, `FormSection.tsx` — Form wrappers.
- `src/main.tsx` — Thêm DialogProvider.
- Cài dependencies: `react-hook-form`, `@hookform/resolvers`, `zod`.

**Phase 7 — Page-by-Page Polish (partial):**
- `LoginPage` — Bỏ gradient, dùng Card + TextInput primitives.
- `ChangePasswordPage` — Tương tự LoginPage.
- `DashboardPage` — Dùng PageHeader, Card primitives.
- `AgentsPage` — Dùng PageHeader, Table primitives, TextInput, Badge, EmptyState.
- `RequestsPage` — Dùng PageHeader, Table primitives, Badge, EmptyState.
- `AgentDetailPage` — Dùng PageHeader, Badge, Card.
- `RequestDetailPage` — Dùng PageHeader, Badge, Card.
- `TrashPage` — Dùng PageHeader, Table primitives, Badge, EmptyState, ConfirmationModal.
- `HolidaysPage` — Dùng PageHeader, Table primitives, Modal, TextInput.
- `RanksPage` — Dùng PageHeader, Table primitives, Modal, TextInput.
- `DivisionsPage` — Dùng PageHeader, Table primitives, Modal, TextInput, Badge.

**Backward compat:**
- Giữ nguyên business logic, API calls, data flow.
- Không xóa components cũ trong `src/components/` (Badge, EmptyState, Skeleton, Modal, Toast).
- Legacy color aliases (`neutral-*`, `primary`) được thêm vào `@theme` block để pages chưa refactor không bị break.

**Files mới:** 35+ files trong `src/ui/`
**Files sửa:** `index.html`, `src/index.css`, `src/main.tsx`, `src/components/Layout.tsx`, `src/App.tsx`, 11 pages

---

## 2026-06-04

### 36. BUG-016: Fix Dashboard tự reload khi chuyển tab

**Bug:**
- Chuyển browser tab rồi quay lại app → Dashboard refetch toàn bộ queries, gây nhấp nháy / skeleton.
- Chuyển page trong app (Dashboard → Agents → Dashboard) → cũng bị refetch lại.

**Fix:**
- `main.tsx`: QueryClient thêm `refetchOnWindowFocus: false` và `gcTime: 10 phút`.
- Dashboard query hooks (`useDashboardStats`, `useStatusCounts`, `useB2Requests`, `useM1Transitions`): tăng `staleTime` từ 2 phút lên 5 phút.

**Files sửa:**
- `webapp/src/main.tsx`
- `webapp/src/hooks/queries/useDashboardStats.ts`
- `webapp/src/hooks/queries/useStatusCounts.ts`
- `webapp/src/hooks/queries/useB2Requests.ts`
- `webapp/src/hooks/queries/useM1Transitions.ts`
- `webapp/docs/PLAN-bug-fixes.md`

---

## 2026-06-04

### 32. BUG-015: Fix expression parser bị override bởi mapping trùng tên

**Bug:** Cell template chỉ chứa expression `(R.num)`, `(dd/mm/yyyy)` bị override nếu user vô tình map field trùng tên → hiển thị nguyên xi thay vì evaluate.

**Fix:**
- Thêm `isExpressionOnly()` — detect cell chỉ chứa `(...)` không có text khác.
- Trong `generateWorkbook` và `buildPreview`: skip mapping nếu cell là expression-only.
- Expression luôn evaluate trước mapping, không bị "nuốt".

**Files sửa:**
- `webapp/src/lib/excel-generator.ts`

### 33. FEAT-020: Excel Generator Enhancements — Inline Field Reference + Uppercase + Chọn ngày generate

**Tính năng:**
1. **Inline Field Reference**: Syntax `{{Tên Field}}` trong cell template để kết hợp data động + expression + text cố định.
   - Ví dụ: `{{Họ và tên}} - (ddmmyy)(R.num)` → `Trần Lê Toàn Hữu - 03062607`
2. **Uppercase Toggle**: Checkbox "VIẾT HOA" cho từng field mapping. Giá trị được `.toUpperCase()` trước khi chèn.
3. **Chọn ngày generate**: Input date picker trong GeneratePanel. Expression `(dd)`, `(mm)`, `(yy)` dùng ngày đã chọn thay vì `new Date()`.

**Files sửa:**
- `webapp/src/types/index.ts` — Thêm `uppercase?: boolean` vào `FieldMappingValue`
- `webapp/src/lib/excel-generator.ts` — Thêm `replaceFieldReferences()`, `isExpressionOnly()`, cập nhật `generateWorkbook` + `buildPreview`
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx` — Checkbox VIẾT HOA trong mapping panel
- `webapp/src/components/excel-generator/GeneratePanel.tsx` — Date picker + checkbox VIẾT HOA

### 34. FEAT-021: Excel Generator — Edit Template đã lưu

**Tính năng:**
1. Nút "Sửa" (icon Pencil) trong Template Manager table.
2. Modal upload chuyển sang chế độ edit: pre-fill name, description, row headers, fields, mapping.
3. Hiển thị file cũ + nút "Thay file mới" cho cả export template và import mẫu.
4. Update DB row thay vì insert. Nếu upload file mới → xóa file cũ trong Storage + upload file mới.

**Files sửa:**
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx` — Hỗ trợ `editTemplate` prop, edit mode
- `webapp/src/components/excel-generator/TemplateManager.tsx` — Nút Edit, mở modal với `editTemplate`

### 35. Fix: Data rows ghi đè lên header row trong Excel Generator

**Bug phát sinh sau FEAT-019:** `generateWorkbook` bỏ `templateHeaderRow` và thay bằng data rows đầu tiên. Ví dụ: header row ở row 5 → data row 1 cũng xuất hiện ở row 5, đè lên header.

**Fix:** Giữ nguyên `templateHeaderRow` trong output, insert data rows **sau** header row.

**Files sửa:**
- `webapp/src/lib/excel-generator.ts` — Thêm `outputRows.push(json[templateHeaderRow])` trước vòng lặp data rows

---

## 2026-06-03

### 31. FEAT-019: Mail Merge Generator (template + data → file Excel)

**Tính năng:**
1. Trang mới `/excel-generator` với 3 tabs: Generate, Lịch sử, Quản lý Template (admin).
2. **Upload template** (admin): Dropzone upload file `.xlsx`, auto-detect placeholder `{{...}}`, lưu metadata vào `excel_templates` + file vào Storage bucket `excel-templates`.
3. **Generate** (tất cả user): Chọn template từ dropdown, upload file data `.xlsx/.csv`, preview match status (✅/⚠️), preview bảng ~10 dòng đầu sau replace.
4. **Generate flow**: Đọc template row chứa placeholder → replicate theo số dòng data → replace placeholder → xuất file `.xlsx`.
5. **Tên file generate**: `{template_name}_{YY}{MM}{DD}_{HH}{MM}.xlsx` (sanitize tiếng Việt, lowercase, space → `_`).
6. **Lưu lịch sử**: File data gốc + file generate upload vào Storage bucket `excel-generations`, metadata vào `excel_generation_logs`.
7. **Lịch sử**: Bảng hiển thị template, file gốc, file generate, số dòng, ngày tạo. Nút Download từng dòng. Admin có thể xóa.
8. **Xóa template**: Admin xóa row DB + file Storage.

**Schema:**
- `supabase/migrations/017_excel_templates.sql` — Bảng `excel_templates` + `excel_generation_logs` + indexes + RLS policies (DROP POLICY IF EXISTS trước CREATE).
- Storage buckets cần tạo thủ công: `excel-templates`, `excel-generations`.

**Files sửa/tạo:**
- `webapp/supabase/migrations/017_excel_templates.sql` — Mới
- `webapp/src/types/index.ts` — Thêm `ExcelTemplate`, `ExcelGenerationLog`
- `webapp/src/lib/excel-generator.ts` — Mới (loadXlsx, detectPlaceholders, readDataFile, getTemplateRowIndex, replacePlaceholdersInRow, generateWorkbook, buildPreview, sanitizeFileName, formatGenerateFileName)
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx` — Mới
- `webapp/src/components/excel-generator/TemplateManager.tsx` — Mới
- `webapp/src/components/excel-generator/GeneratePanel.tsx` — Mới
- `webapp/src/components/excel-generator/GenerationHistory.tsx` — Mới
- `webapp/src/pages/ExcelGeneratorPage.tsx` — Mới
- `webapp/src/App.tsx` — Thêm route `/excel-generator`
- `webapp/src/components/Layout.tsx` — Thêm menu "Excel Generator"
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật FEAT-019 status
- `webapp/docs/CHANGELOG.md` — File này

### 31a. FEAT-019 Enhancement: Manual Column Mapping

**Yêu cầu:** User muốn có UI cho phép mapping thủ công giữa placeholder trong template và cột trong file data, thay vì auto match đơn thuần.

**Thay đổi:**
1. **`webapp/src/lib/excel-generator.ts`:**
   - Thêm type `ColumnMapping = Record<string, string>`.
   - Thêm hàm `suggestMapping(placeholders, dataHeaders)` — auto-suggest mapping dựa trên case-insensitive match.
   - Cập nhật `replacePlaceholdersInRow()` nhận thêm `mapping?: ColumnMapping` — nếu có mapping thì dùng mapped column, nếu không thì fallback exact match cũ.
   - Cập nhật `generateWorkbook()` và `buildPreview()` nhận thêm `mapping` parameter.
   - `PlaceholderMatch` thêm field `mappedColumn?` để hiển thị cột đã map trong UI.
2. **`webapp/src/components/excel-generator/GeneratePanel.tsx`:**
   - Thêm state `mapping`, `showMappingPanel`, `templatePlaceholders`, `dataHeaders`.
   - Sau khi upload data → hiển thị **Mapping Panel** thay vì auto-build preview.
   - Mapping Panel: mỗi placeholder có dropdown chọn cột từ file data (auto-suggest từ `suggestMapping`). Có thể chọn "-- Không map".
   - Nút **"Xác nhận mapping"** → build preview theo mapping đã chọn.
   - Preview table có link **"Chỉnh sửa mapping"** để quay lại mapping panel.
   - Generate flow dùng mapping đã chọn thay vì auto match.

**Files sửa:**
- `webapp/src/lib/excel-generator.ts`
- `webapp/src/components/excel-generator/GeneratePanel.tsx`
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật FEAT-019 mô tả, flow, matching rules, preview table, UI spec
- `webapp/docs/CHANGELOG.md` — File này

### 31b. FEAT-019 Enhancement: Template 2 Files + Saved Mapping + Download Import Mẫu

**Yêu cầu:** Template gồm 2 file (export template + import mẫu). Mapping được lưu vào DB khi tạo template. User có thể tải file import mẫu để biết cấu trúc cột. Fix lỗi xóa template khi có `template_id NOT NULL` + `ON DELETE SET NULL`.

**Thay đổi:**
1. **Schema (`017_excel_templates.sql`):**
   - Bảng `excel_templates` thêm `import_template_path text`, `import_headers jsonb DEFAULT '[]'`, `column_mapping jsonb DEFAULT '{}'`.
   - Bảng `excel_generation_logs`: `template_id` bỏ `NOT NULL` để fix lỗi xóa template.
2. **`webapp/src/types/index.ts`:**
   - `ExcelTemplate` thêm `import_template_path`, `import_headers`, `column_mapping`.
3. **`webapp/src/pages/ExcelGeneratorPage.tsx`:**
   - Parse `import_headers` và `column_mapping` từ JSONB khi fetch templates.
4. **`webapp/src/components/excel-generator/TemplateUploadModal.tsx`:**
   - Upload **2 file**: export template + import mẫu.
   - Detect placeholder từ export template, detect headers từ import mẫu.
   - Hiển thị **Mapping Panel** trong modal: mỗi placeholder → dropdown chọn cột từ import mẫu (auto-suggest).
   - Upload cả 2 file lên Storage (`excel-templates/export/`, `excel-templates/import/`) + lưu mapping vào DB.
5. **`webapp/src/components/excel-generator/TemplateManager.tsx`:**
   - Hiển thị **Mapping status** (x/x đã map).
   - Nút **"Tải file import mẫu"** → download từng template.
   - Xóa template → xóa cả 2 file trong Storage (export + import).
6. **`webapp/src/components/excel-generator/GeneratePanel.tsx`:**
   - Hiển thị mapping đã lưu + link **"Tải file import mẫu"**.
   - Sau upload data: so sánh headers với `import_headers` đã lưu.
     - Nếu khớp → **auto-apply saved mapping** → build preview luôn.
     - Nếu không khớp → hiện **Mapping Panel** để user adjust.
   - Preview table có link **"Chỉnh sửa mapping"**.
7. **`webapp/src/lib/excel-generator.ts`:**
   - Không thay đổi thêm (đã có `ColumnMapping`, `suggestMapping` từ 31a).

**Files sửa:**
- `webapp/supabase/migrations/017_excel_templates.sql`
- `webapp/src/types/index.ts`
- `webapp/src/pages/ExcelGeneratorPage.tsx`
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx`
- `webapp/src/components/excel-generator/TemplateManager.tsx`
- `webapp/src/components/excel-generator/GeneratePanel.tsx`
- `webapp/docs/PLAN-feature-dev.md`
- `webapp/docs/CHANGELOG.md` — File này

### 31c. FEAT-019 Rewrite: Expression Parser + Field-Based Mapping + Row Header

**Yêu cầu:** Làm mới hoàn toàn FEAT-019. Không còn placeholder `{{...}}`. Thay bằng:
1. **Expression parser** trong export template: `(ddmmyy)`, `(R.num)`, `([dd-1]mmyy)`, `([R.num+1])`...
2. **Field-based mapping**: Export template có row header chứa tên trường. Map trường → cột data hoặc text cố định.
3. **Row header cho cả 2 file**: User chỉ định row nào làm header trong cả export template, import mẫu, và file data.

**Thay đổi:**
1. **Schema (`017_excel_templates.sql`):**
   - Thêm `template_header_row integer`, `import_header_row integer`.
   - Thêm `fields jsonb` (tên trường từ export template), bỏ `placeholders jsonb`.
   - `column_mapping` đổi format: `{ fieldName -> {type: 'column'|'fixed', value: string} }`.
2. **`webapp/src/types/index.ts`:**
   - Thêm `FieldMappingValue` interface.
   - `ExcelTemplate` thêm `template_header_row`, `import_header_row`, `fields`; bỏ `placeholders`.
3. **`webapp/src/lib/excel-generator.ts` — Viết lại hoàn toàn:**
   - `detectFields(workbook, headerRowIndex)` — lấy tên trường từ row header.
   - `readDataFile(workbook, headerRowIndex)` — lấy headers + rows từ row header.
   - **Expression parser:** `parseExpression()`, `evaluateExpression()`, `replaceExpressionsInCell()`.
     - Hỗ trợ tokens: `dd`, `mm`, `yy`, `yyyy`, `R.num`.
     - Hỗ trợ phép tính `+n`/`-n` trong `[]`.
     - Date arithmetic tự động xử lý chuyển tháng/năm.
     - `R.num` zero-padded 2 chữ số, 1-based.
   - `generateWorkbook()` — replicate header row, evaluate expression, apply mapping.
   - `buildPreview()` — preview với expression + mapping.
4. **`webapp/src/components/excel-generator/TemplateUploadModal.tsx` — Viết lại:**
   - Upload 2 file + input row header cho mỗi file.
   - Nút "Detect trường" / "Detect cột" để đọc row header.
   - Mapping panel: mỗi field → dropdown chọn cột HOẶC input text cố định.
   - Auto-suggest mapping dựa trên case-insensitive match.
5. **`webapp/src/components/excel-generator/TemplateManager.tsx`:**
   - Hiển thị fields thay vì placeholders.
   - Download import mẫu, xóa cả 2 files.
6. **`webapp/src/components/excel-generator/GeneratePanel.tsx` — Viết lại:**
   - Hiển thị fields, mapping, link tải import mẫu.
   - Upload data + input row header.
   - Auto-apply saved mapping (adapt column names) hoặc hiện mapping panel.
   - Preview với expression evaluated.
7. **`webapp/src/pages/ExcelGeneratorPage.tsx`:**
   - Parse `fields`, `column_mapping` (với `type`/`value`) từ JSONB.

**Files sửa:**
- `webapp/supabase/migrations/017_excel_templates.sql`
- `webapp/src/types/index.ts`
- `webapp/src/lib/excel-generator.ts`
- `webapp/src/pages/ExcelGeneratorPage.tsx`
- `webapp/src/components/excel-generator/TemplateUploadModal.tsx`
- `webapp/src/components/excel-generator/TemplateManager.tsx`
- `webapp/src/components/excel-generator/GeneratePanel.tsx`
- `webapp/docs/PLAN-feature-dev.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-30

### 30. REFACTOR-004: Phase 4 — Backend-Frontend Alignment & Performance

**Mục tiêu:** Loại bỏ duplicate logic, fix N+1, unify T1 field, unify modal pattern, proactive M1 processing.

**Thay đổi:**
1. **Consolidate Eligibility Logic:**
   - Thêm `checkEligibilityRpc()` trong `src/lib/eligibility.ts` — wrapper gọi RPC `check_eligibility` (single source of truth).
   - `CreateRequestModal` chuyển sang dùng RPC thay vì client-side `checkEligibility`.
   - `getAgentT1` chỉ trả về `current_t1_id`.
2. **Fix N+1 Queries:**
   - `useAgents.ts`: Dùng FK embedding `agents:current_t1_id(full_name, staff_id)` thay vì batch query T1 riêng.
   - `useDashboardStats.ts`: Dùng RPC `get_dashboard_stats()` — giảm 4 queries xuống 1.
3. **Resolve Dual T1 Fields:**
   - Xóa toàn bộ update `referrer_id` từ frontend. Frontend chỉ đọc/ghi `current_t1_id`.
   - Audit và sửa: `request-actions.ts`, `agent-actions.ts`, `DashboardPage.tsx`, `AgentsPage.tsx`, `AgentDetailPage.tsx`, `AgentInfoTab.tsx`, `CreateRequestModal.tsx`, `ComposeTemplateModal.tsx`, `DeactivateAgentModal.tsx`, `RestoreAgentModal.tsx`, `UploadPage.tsx`, `useAgents.ts`, `useAgentDetail.ts`.
   - `types/index.ts`: Thêm comment document rõ về dual field.
4. **Unify Modal Pattern:**
   - Thêm `size` prop vào `<Modal>` component.
   - Refactor 6 modal sang dùng `<Modal>` chuẩn: `CreateRequestModal`, `ExportModal`, `ComposeTemplateModal`, `SendEmailModal`, `DeactivateAgentModal`, `RestoreAgentModal`.
5. **M1 Transition Proactive:**
   - Migration `016_phase4_rpc_and_cron.sql`: RPC `get_dashboard_stats()` + cron job `pg_cron` chạy `process_expired_m1_transitions` hàng ngày.

**Files sửa/tạo:**
- `webapp/src/components/Modal.tsx` — Thêm `size` prop
- `webapp/src/lib/eligibility.ts` — Thêm `checkEligibilityRpc`, refactor `getAgentT1`
- `webapp/src/types/index.ts` — Comment dual T1 fields
- `webapp/src/lib/request-actions.ts` — Xóa `referrer_id` updates
- `webapp/src/lib/agent-actions.ts` — Xóa `referrer_id` updates/queries
- `webapp/src/pages/DashboardPage.tsx` — `applyT2` chỉ update `current_t1_id`
- `webapp/src/hooks/queries/useAgents.ts` — FK embedding, filter `current_t1_id`
- `webapp/src/hooks/queries/useDashboardStats.ts` — Dùng RPC
- `webapp/src/hooks/queries/useAgentDetail.ts` — Chỉ dùng `current_t1_id`
- `webapp/src/pages/AgentsPage.tsx` — Chỉ dùng `current_t1_id`
- `webapp/src/pages/AgentDetailPage.tsx` — Chỉ dùng `current_t1_id`
- `webapp/src/components/agent-detail/AgentInfoTab.tsx` — Chỉ dùng `current_t1_id`
- `webapp/src/components/CreateRequestModal.tsx` — Dùng `<Modal>`, RPC eligibility
- `webapp/src/components/ExportModal.tsx` — Dùng `<Modal>`
- `webapp/src/components/ComposeTemplateModal.tsx` — Dùng `<Modal>`, `current_t1_id`
- `webapp/src/components/SendEmailModal.tsx` — Dùng `<Modal>`
- `webapp/src/components/DeactivateAgentModal.tsx` — Dùng `<Modal>`, `current_t1_id`
- `webapp/src/components/RestoreAgentModal.tsx` — Dùng `<Modal>`, `current_t1_id`
- `webapp/src/pages/UploadPage.tsx` — Xóa sync `referrer_id`, xóa `referrer_id`/`agent_code` khỏi OPTIONAL_HEADERS
- `webapp/supabase/migrations/016_phase4_rpc_and_cron.sql` — RPC + cron job

---

### 29. REFACTOR-003: Phase 3 — Page Decomposition

**Mục tiêu:** Không page nào >250 dòng. Tách UI thành sub-components.

**Thay đổi:**
1. **DashboardPage** (544 → ~170 dòng) — Tách thành:
   - `DashboardStats`, `B2PendingAlert`, `B2EligibleList`, `M1TransitionList`, `BookmarkedAgentsCard`, `StatusChart`
2. **AgentDetailPage** (280 → ~110 dòng) — Tách thành:
   - `AgentInfoTab`, `AgentHistoryTab`, `T1History`, `M1List`, `AsT1History`, `DeactivationHistory`
3. **RequestDetailPage** (402 → ~170 dòng) — Tách thành:
   - `RequestInfoCard`, `RequestProgress`, `DeadlineInfo`, `RequestComments`, `StepHistory`, `NotificationChecklist`
4. **EmailTemplatesPage** (237 → ~80 dòng) — Tách thành:
   - `TemplateList`, `TemplateEditModal`, `TemplatePreviewModal`

**Files sửa/tạo:**
- `webapp/src/components/dashboard/*` — 6 components mới
- `webapp/src/components/agent-detail/*` — 6 components mới
- `webapp/src/components/request-detail/*` — 6 components mới
- `webapp/src/components/email-templates/*` — 3 components mới
- `webapp/src/pages/DashboardPage.tsx`, `AgentDetailPage.tsx`, `RequestDetailPage.tsx`, `EmailTemplatesPage.tsx` — Refactor sử dụng components

---

### 28. REFACTOR-002: Phase 2 — TanStack Query Data Layer

**Mục tiêu:** Dừng dùng `useState + useEffect` thủ công. Dùng cache, background refetch, invalidation.

**Thay đổi:**
1. **Custom query hooks** — Tạo/cập nhật:
   - `useAgents.ts`, `useAgentDetail.ts`, `useRequests.ts`, `useRequestDetail.ts`, `useDashboardStats.ts`, `useM1Transitions.ts`, `useB2Requests.ts`, `useStatusCounts.ts`
   - `useActivityLogs.ts`, `useTrash.ts`, `useHolidays.ts` (list + set), `useRanks.ts` (map + list + mutations), `useDivisions.ts` (map + list + mutations), `useEmailTemplates.ts`
2. **Refactor pages sang hooks:**
   - `AgentsPage.tsx`, `RequestsPage.tsx`, `DashboardPage.tsx`
   - `AgentDetailPage.tsx`, `RequestDetailPage.tsx`
   - `ActivityLogPage.tsx`, `TrashPage.tsx`, `HolidaysPage.tsx`, `RanksPage.tsx`, `DivisionsPage.tsx`, `EmailTemplatesPage.tsx`
3. **Mutations** — Tất cả create/update/delete dùng `useMutation` + `queryClient.invalidateQueries()` thay vì `setState` manual.
4. **Type safety** — Fix null index types (`rankNamesMap[agent.rank_id]` → null-safe), remove unused variables.

**Files sửa/tạo:**
- `webapp/src/hooks/queries/*` — 13 hooks (mới/cập nhật)
- `webapp/src/pages/AgentsPage.tsx`, `RequestsPage.tsx`, `DashboardPage.tsx`, `AgentDetailPage.tsx`, `RequestDetailPage.tsx`
- `webapp/src/pages/ActivityLogPage.tsx`, `TrashPage.tsx`, `HolidaysPage.tsx`, `RanksPage.tsx`, `DivisionsPage.tsx`, `EmailTemplatesPage.tsx`

---

### 27. REFACTOR-001: Phase 1 — Hotfixes & Safety

**Mục tiêu:** Fix lỗi crash và rủi ro bảo mật trước khi đụng vào architecture.

**Thay đổi:**
1. **Fix `LoginPage.tsx` broken import** — Di chuyển `import { supabase }` từ cuối file lên đầu file.
2. **HtmlEditor XSS sanitization** — Cài `dompurify`, thêm `sanitizeHtml()` helper. Sanitize output trước khi gọi `onChange` (visual mode) và trước khi render `dangerouslySetInnerHTML` (preview mode).
3. **Add Root Error Boundary** — Tạo `src/components/ErrorBoundary.tsx` (class component + fallback UI có nút "Tải lại trang"). Wrap `<Routes>` trong `App.tsx`.
4. **Cleanup dead CSS** — Xóa toàn bộ file `src/App.css` (CSS starter từ Vite template, không được import ở đâu).

**Files sửa/tạo:**
- `webapp/src/pages/LoginPage.tsx`
- `webapp/src/components/HtmlEditor.tsx`
- `webapp/src/components/ErrorBoundary.tsx` — Mới
- `webapp/src/App.tsx`
- `webapp/src/App.css` — Xóa

---

### 26. BUG-014: Fix `temp_t1_id` trong Deactivation bị set sai

**Bug:** Khi deactivate agent, `m1_transition_tasks.temp_t1_id` bị set = chính agent bị deactivate (vì code lấy `m1.referrer_id` của M1). Agent đã nghỉ không thể làm T1 tạm.

**Fix:**
- Query agent bị deactivate trước để lấy `referrer_id` / `current_t1_id` (T1 của agent bị deactivate).
- Set `temp_t1_id` cho toàn bộ M1 transition tasks = T1 của agent bị deactivate (T2 của M1).
- Nếu agent bị deactivate không có T1 → `temp_t1_id = null`.

**Files sửa:**
- `webapp/src/lib/agent-actions.ts` — Query deactivated agent T1, dùng làm `temp_t1_id` cho M1 tasks

---

## 2026-05-29

### 16. FEAT-015: Thêm mẫu email mới (popup trình soạn thảo)

**Tính năng:**
1. Nút **"Thêm mẫu"** trên trang Quản lý mẫu email.
2. Modal form: Tên mẫu, Template key (auto-slug từ tên, có thể sửa tay), Tiêu đề, Nội dung (HtmlEditor 3 tabs).
3. Insert vào bảng `email_templates` với `version = 1`.
4. Validate `template_key` unique, toast lỗi nếu trùng.

**Files sửa:**
- `webapp/src/pages/EmailTemplatesPage.tsx` — Thêm modal create, logic insert Supabase, auto-slug helper

---

### 17. FEAT-014: Quản lý mẫu email dạng danh sách (list view + modal edit)

**Tính năng:**
1. Chuyển `EmailTemplatesPage` từ dạng card mở sẵn editor → bảng danh sách gọn (`# | Tên mẫu | Template key | Tiêu đề | Hành động`).
2. Click "Chỉnh sửa" → mở modal soạn thảo (dùng `Modal` component + `HtmlEditor`).
3. Click "Xem trước" → mở modal preview riêng render HTML với placeholders.
4. Giữ chức năng Lưu mẫu (update DB) như cũ.

**Files sửa:**
- `webapp/src/pages/EmailTemplatesPage.tsx` — Refactor toàn bộ UI

---

### 25. FEAT-018: ComposeTemplateModal — Refactor email section (1 section, 4 emails, copy từng email)

**Tính năng:**
1. Bỏ 2 cột "Agent | T1 Cũ", thay bằng 1 section **"Email liên quan"**.
2. 4 dòng: Agent, T1 mới, T1 cũ, T1 tạm.
3. Có email → hiện email + icon Copy. Không có → "—".
4. Nút "Copy email" footer copy toàn bộ email có dữ liệu.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`

---

### 24. Thêm placeholder `{{oldT1StaffId}}` và `{{tempT1StaffId}}`

**Thay đổi:**
- `EmailTemplatesPage`: Thêm `{{oldT1StaffId}}`, `{{tempT1StaffId}}` vào `defaultPlaceholders` và `previewData`.
- `ComposeTemplateModal`: Thêm `.replace(/{{oldT1StaffId}}/g, t1Old?.staff_id ?? '')` và `.replace(/{{tempT1StaffId}}/g, t1Old?.staff_id ?? '')` trong `rendered`.

**Files sửa:**
- `webapp/src/pages/EmailTemplatesPage.tsx`
- `webapp/src/components/ComposeTemplateModal.tsx`

---

### 23. FEAT-017: Dashboard B2 — Search bar + nút "Tạo email mẫu"

**Tính năng:**
1. Section **"B2 đủ điều kiện xác nhận thay đổi"** thêm search bar (tìm theo tên/mã agent, T1 cũ, T1 mới) giống M1 Transition.
2. Thêm nút **"Tạo email mẫu"** mỗi row B2 → mở `ComposeTemplateModal` để soạn/copy nội dung.
3. Hiển thị số lượng B2 eligible trong tiêu đề.
4. Empty state khi search không có kết quả.

**Files sửa:**
- `webapp/src/pages/DashboardPage.tsx`

---

### 22. BUG-013: ComposeTemplateModal hiển thị raw HTML tags, copy ra mã

**Bug:** Khung "Nội dung đã soạn" dùng `<textarea readOnly>` hiển thị HTML string → user thấy raw tags (`<div>`, `<b>`, style...).

**Fix:**
- Thay `<textarea readOnly>` bằng `<div dangerouslySetInnerHTML>` → render HTML đẹp.
- Nút "Copy nội dung" strip HTML tags (dùng DOM tạm `div.innerHTML = html; div.innerText`) trước khi copy → paste ra chỉ có plain text.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`

---

### 21. FEAT-016: Thêm nút xóa cho Ranks và Divisions (có kiểm tra agents)

**Tính năng:**
1. `RanksPage`: Thêm nút **Xóa** mỗi row. Trước khi xóa, query đếm agents đang dùng `rank_id`. Nếu > 0 → toast lỗi, chặn xóa.
2. `DivisionsPage`: Thêm nút **Xóa** mỗi row (ẩn với division `is_default`). Trước khi xóa, query đếm agents thuộc `division_id`. Nếu > 0 → toast lỗi, chặn xóa.
3. Cả 2 đều có modal confirm đơn giản (không countdown), màu đỏ, loading state.

**Lý do chặn xóa khi có agents:**
- `agents.rank_id` → `REFERENCES ranks(id)` (không có ON DELETE) → xóa rank đang dùng sẽ lỗi FK.
- `agents.division_id` → `REFERENCES divisions(id) ON DELETE CASCADE` → xóa division đang có agent sẽ xóa luôn agents. Để tránh mất data, chặn ở app layer.

**Files sửa:**
- `webapp/src/pages/RanksPage.tsx`
- `webapp/src/pages/DivisionsPage.tsx`

---

### 20. BUG-012: EmailTemplatesPage — Preview modal bị đẩy lên, thiếu nút X, text không xuống dòng

**Bug phát sinh sau FEAT-014 (refactor list view).**

**Hiện tượng:**
1. Modal "Xem trước mẫu" bị đẩy lên gần header, tiêu đề và nút ✕ bị cắt khỏi viewport.
2. Mẫu email cũ (plain text) hiển thị `\n\n` thay vì xuống dòng đúng.

**Root cause:**
1. Preview modal vẫn dùng inline `fixed inset-0 flex items-center justify-center` thay vì component `Modal` chuẩn.
2. `getPreviewHtml` replace placeholders trên `template.body` trực tiếp, không convert plain text → HTML.

**Fix:**
- Thay inline preview modal bằng component `<Modal>` (portal, focus trap, Escape, backdrop click).
- Export `plainTextToHtml` từ `HtmlEditor.tsx`, dùng trong `getPreviewHtml` để wrap plain text thành `<p>` + `<br>`.

**Files sửa:**
- `webapp/src/pages/EmailTemplatesPage.tsx`
- `webapp/src/components/HtmlEditor.tsx`

---

### 19. Tạm ẩn tính năng gửi email (Resend)

**Lý do:** Chờ IT verify domain `myera.com.vn` trên Resend trước khi bật production.

**Thay đổi:**
- Comment nút **"Gửi email"** trong `ComposeTemplateModal` (không mở `SendEmailModal`).
- Giữ nguyên nút **"Tạo email mẫu"** / **"Gửi lại email"** trong Dashboard M1 Transition (vẫn mở `ComposeTemplateModal` để soạn/copy nội dung).
- Tính năng soạn mẫu email (`EmailTemplatesPage`) vẫn hoạt động bình thường.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/src/pages/DashboardPage.tsx`

---

### 18. BUG-011: HtmlEditor text bị đảo chiều khi nhập (hello → olleh)

**Bug:** Trong tab Soạn thảo của `HtmlEditor`, gõ `hello` thành `olleh` do con trỏ bị reset về đầu mỗi lần nhập.

**Root cause:** `useEffect` sync `innerHTML` mỗi khi prop `value` thay đổi. Mỗi ký tự user nhập → `onInput` → `onChange` → state update → `value` prop mới → useEffect chạy lại → ghi đè `innerHTML` → selection bị mất → browser đặt con trỏ về đầu → text bị đảo.

**Fix:**
- Dùng `useRef` flag `isInternalChangeRef` để phân biệt change từ bên trong editor (đang gõ/format/chèn placeholder) vs bên ngoài.
- Chỉ sync `innerHTML` khi `!isInternalChangeRef.current`.
- Reset flag sau mỗi lần useEffect chạy.

**Files sửa:**
- `webapp/src/components/HtmlEditor.tsx` — Thêm `isInternalChangeRef`, skip sync khi change nội bộ

**Lesson learned:** Không bao giờ set `innerHTML` từ `useEffect` trong khi user đang tương tác với `contentEditable`.

---

### 14. BUG-010: M1 Transition query trả về rỗng do join cột `reason` không tồn tại

**Bug phát sinh trong lúc dev FEAT-013.**

**Hiện tượng:** Card M1 Transition hiển thị 0 item sau khi deploy code FEAT-013, dù DB vẫn có data.

**Root cause:** Query `.select()` join `parent_request:parent_request_id(reason)` nhưng bảng `t1_requests` trên DB production không có cột `reason` → PostgREST trả lỗi 400 → toàn bộ query fail.

**Fix:**
- Bỏ join `parent_request` khỏi query, chỉ dùng `parent_request_id` để hiển thị badge lý do.
- Thêm `tasksError` log để query fail sẽ hiện toast.

**Lesson learned:** Phải verify schema DB production trước khi dùng embedded resource join. Không trust migration local blindly.

**Files sửa:** `src/pages/DashboardPage.tsx`

---

### 15. FEAT-013: M1 Transition — Search, T1 cũ + Lý do, Email Tracking

**Tính năng:**
1. **Search bar** trên card M1 Transition (Dashboard): tìm nhanh theo tên M1, mã nhân viên, T1 tạm, T1 cũ. Filter client-side với debounce.
2. **Hiển thị T1 cũ**: Query join `departed_agent:departed_agent_id`, hiển thị tên + mã T1 cũ trên mỗi row. Click tên → navigate Agent Detail.
3. **Hiển thị Lý do**: Badge "T1 cũ thay đổi" (nếu từ `t1_request`) hoặc "Deactivate agent" (nếu từ deactivate). Query join `parent_request:parent_request_id(reason)`.
4. **Email tracking**: ALTER TABLE `m1_transition_tasks` thêm `email_sent_count` (DEFAULT 0) và `last_email_sent_at` (TIMESTAMPTZ).
   - UI hiển thị icon Mail + số lần đã gửi. Tooltip hiển thị thờigian gửi gần nhất.
   - Nút đổi label: "Tạo email mẫu" (chưa gửi) → "Gửi lại email" (đã gửi).
   - Sau mỗi lần gửi qua `SendEmailModal` → tự động `+1` count + update timestamp.

**Schema:**
- `supabase/migrations/015_m1_email_tracking.sql` — ALTER TABLE + index.

**Files sửa/tạo:**
- `webapp/supabase/migrations/015_m1_email_tracking.sql` — Mới
- `webapp/src/types/index.ts` — Thêm `email_sent_count`, `last_email_sent_at` vào `M1TransitionTask`
- `webapp/src/pages/DashboardPage.tsx` — Search bar, filter logic, cột T1 cũ/Lý do/Email, grid layout responsive
- `webapp/src/components/SendEmailModal.tsx` — Nhận `m1TaskId`, update count sau gửi thành công
- `webapp/src/components/ComposeTemplateModal.tsx` — Nhận và truyền `m1TaskId`
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật FEAT-013 status
- `webapp/docs/CHANGELOG.md` — File này

---

### 13. FEAT-001: Tích hợp gửi email thật (Resend + HTML Editor + CC)

**Tính năng:**
1. **Gửi email trực tiếp** từ `ComposeTemplateModal` qua nút [Gửi email]. Mở `SendEmailModal` với To (agent email), CC (dynamic list thêm/xóa nhiều ngườii), Subject rendered từ template, Body preview HTML.
2. **Resend + Supabase Edge Function** (`supabase/functions/send-email/index.ts`): Gọi Resend API, lưu log vào `email_logs`, xử lý CORS, lấy `sent_by` từ JWT token.
3. **HtmlEditor component** (3 tabs):
   - Visual: `contentEditable` + toolbar (Bold, Italic, Underline, Link, Text Color, Align, Undo, Placeholder dropdown).
   - Code: textarea hiển thị HTML raw.
   - Preview: `dangerouslySetInnerHTML` với dynamic values replaced.
   - Auto-convert plain text → HTML (backward-compatible với templates cũ).
4. **EmailTemplatesPage** đã chuyển từ textarea plain text sang `HtmlEditor` cho phần nội dung mẫu. Preview modal render HTML thay vì `whitespace-pre-wrap`.
5. **Schema** `014_email_logs.sql`: Bảng `email_logs` + cột `cc_emails` (jsonb) + indexes + RLS policies.

**Lưu ý triển khai:**
- Cần chạy migration `014_email_logs.sql` trên Supabase SQL Editor.
- Cần deploy Edge Function: `supabase functions deploy send-email`.
- Cần thêm `RESEND_API_KEY` vào Supabase Secrets.
- From email mặc định: `opt@myera.com.vn` — cần verify domain trên Resend trước khi dùng production. Trong lúc chờ IT: dùng `onboarding@resend.dev` để test.

**Files sửa/tạo:**
- `webapp/supabase/migrations/014_email_logs.sql` — Mới
- `webapp/supabase/functions/send-email/index.ts` — Mới
- `webapp/src/types/index.ts` — Thêm `EmailLog`
- `webapp/src/components/HtmlEditor.tsx` — Mới
- `webapp/src/components/SendEmailModal.tsx` — Mới
- `webapp/src/components/ComposeTemplateModal.tsx` — Thêm nút Gửi email
- `webapp/src/pages/EmailTemplatesPage.tsx` — Dùng HtmlEditor
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật FEAT-001 status
- `webapp/docs/CHANGELOG.md` — File này

---

### 12. Refactor: AgentDetailPage 2-tab layout

**Thay đổi:**
- Header: `{full_name} - {staff_id}` + badge Active (xanh) / Inactive (đỏ)
- Tab 1 — "Thông tin Agent": 2 cột
  - Trái: 24 fields (Tên, Mã NV, Cấp bậc, Email, SĐT, Ngày ký HĐ, Ngày chấm dứt, Lý do chấm dứt, Email công việc, Ngày đăng ký, Ngày bắt đầu, Nguồn, CCCD, Ngày sinh, Giới tính, Ngày cấp CCCD, Nơi cấp CCCD, Nguyên quán, Địa chỉ thường trú, Ngân hàng, Số TK, Chi nhánh, Mã số thuế, Doanh số tích lũy)
  - Phải: Ngườii giới thiệu, T1 hiện tại, Division, Khu vực hoạt động, Kinh nghiệm BĐS, Số chứng chỉ MG, Hết hạn chứng chỉ, Ngày seminar
- Tab 2 — "Lịch sử": 3 sub-tab (Lịch sử T1 | M1 | Lịch sử làm T1) + Lịch sử chấm dứt nếu có

**Files sửa:**
- `webapp/src/pages/AgentDetailPage.tsx`
- `webapp/docs/CHANGELOG.md`

---

### 11. FEAT-003 + FEAT-006 + FEAT-007: In-app Notifications, Schema v2 UI polish, Agent Deactivation complete

**FEAT-003 — In-app Notifications (hoàn thành):**
- `supabase/migrations/013_notifications.sql` — Bảng `notifications` + indexes + RLS policies.
- `src/types/index.ts` — Thêm interface `Notification`.
- `src/lib/notifications.ts` — Helpers: `createNotification`, `createNotificationsForAdmins`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `getUnreadNotificationCount`.
- `src/components/NotificationDropdown.tsx` — Query từ bảng `notifications` thay vì `activity_logs`, badge unread từ DB, mark read trong DB, poll 30s, icon theo type.
- Tích hợp tạo notification tự động:
  - `CreateRequestModal` → `request_new`
  - `RequestDetailPage` (hủy) → `request_cancelled`
  - `RequestDetailPage` (comment) → `comment_new`
  - `request-actions.ts` (hoàn tất) → `request_completed`
  - `agent-actions.ts` (deactivate/restore) → `agent_deactivated` / `agent_restored`

**FEAT-006 — Schema v2 UI polish:**
- `src/pages/AgentDetailPage.tsx` — Thêm 3 section mới trong info card:
  - "Thông tin cá nhân": CCCD, ngày sinh, giới tính, ngày cấp CCCD, nơi cấp, nguyên quán, địa chỉ thường trú.
  - "Ngân hàng & Thuế": ngân hàng, số TK, chi nhánh, mã số thuế.
  - "Nghề nghiệp": khu vực hoạt động, kinh nghiệm BĐS, số chứng chỉ MG, hết hạn chứng chỉ, ngày seminar.
- `UploadPage` — Đã có đầy đủ OPTIONAL_HEADERS cho ~25 cột schema v2 (không cần sửa).

**FEAT-007 — Agent Deactivation (hoàn thành):**
- Xác nhận `AgentDetailPage` đã có tab "Lịch sử chấm dứt".
- Xác nhận `Layout.tsx` đã có menu "Ranks" và "Divisions".
- `src/lib/agent-actions.ts` — Đã thêm `createNotificationsForAdmins` khi deactivate/restore.

**Lưu ý triển khai:**
- Cần chạy 3 file migration trên Supabase SQL Editor:
  1. `008_schema_v2_agents.sql` (FEAT-006)
  2. `009_agent_deactivation.sql` (FEAT-007)
  3. `013_notifications.sql` (FEAT-003)

**Files sửa/tạo:**
- `webapp/supabase/migrations/013_notifications.sql` — Mới
- `webapp/src/types/index.ts` — Thêm `Notification`
- `webapp/src/lib/notifications.ts` — Mới
- `webapp/src/components/NotificationDropdown.tsx` — Rewrite
- `webapp/src/components/CreateRequestModal.tsx` — Thêm noti
- `webapp/src/pages/RequestDetailPage.tsx` — Thêm noti + sections info
- `webapp/src/lib/request-actions.ts` — Thêm noti
- `webapp/src/lib/agent-actions.ts` — Thêm noti
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật status
- `webapp/docs/CHANGELOG.md` — File này

---

### 10. FEAT-009 + FEAT-010 + FEAT-011 + FEAT-012: Dashboard navigation, Requests multi-filter, Ranks/Divisions modal CRUD

**Tính năng:**

1. **FEAT-009 — Dashboard navigation:**
   - 4 stat cards (Tổng Agent, Tổng Requests, Đang xử lý, Hoàn tất) thêm `onClick` navigate sang `/agents` hoặc `/requests?status=...`.
   - Chart "Trạng thái đề xuất": click từng bar navigate `/requests?status=xxx`.
   - Style hover cho cards và chart rows.

2. **FEAT-010 — Requests multi-choice status filter:**
   - Đổi `statusFilter` từ single-select → `RequestStatus[]` (multi-choice).
   - Click status button → toggle chọn/bỏ chọn.
   - "Tất cả" button → clear filter.
   - Đồng bộ URL query param `?status=step1,step2` khi filter thay đổi.
   - `RequestsPage` đọc `status` param từ URL để set initial filter.

3. **FEAT-011 — Ranks modal CRUD:**
   - Bỏ inline form footer.
   - Thêm/Sửa mở popup `Modal` component.
   - Giữ nguyên fields: Tên, Loại, Thứ tự.

4. **FEAT-012 — Divisions modal CRUD + table height:**
   - Bỏ inline form footer.
   - Thêm/Sửa mở popup `Modal` component (giữ searchable dropdown head agent).
   - Bỏ `max-h-[400px]` trên bảng → chiều cao tự nhiên như RanksPage.

**Fix nhỏ đi kèm:**
- `Modal.tsx`: Thêm `createPortal` render ra `document.body` để tránh stacking context issue với `PageTransition`.

**Files sửa:**
- `webapp/src/components/Modal.tsx` — createPortal
- `webapp/src/pages/DashboardPage.tsx` — stat cards + chart navigation
- `webapp/src/pages/RequestsPage.tsx` — multi-choice filter + URL sync
- `webapp/src/pages/RanksPage.tsx` — modal CRUD
- `webapp/src/pages/DivisionsPage.tsx` — modal CRUD + table height
- `webapp/docs/PLAN-feature-dev.md` — Cập nhật status 4 feature
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### Docs Cleanup: Archive `PLAN-ui-improvements.md`

**Lý do:** File `PLAN-ui-improvements.md` đã hoàn thành toàn bộ 4 phases (Foundation, Critical Fixes, Loading/Animation Polish, Advanced UI). Các cải tiến đã được triển khai và ghi nhận trong mục **"UI Improvements — Phase 1-4"** ở trên. Để tránh confuse cho AI/agent sau, nội dung plan gốc đã được merge vào CHANGELOG.md và file plan đã xóa.

**Nội dung plan gốc (tóm tắt):**
- **Phase 1:** Design tokens (CSS variables), `@layer components`, `Skeleton`, `Badge`, `EmptyState`, `Pagination`, `Modal`, `PageTransition`, `SearchDropdown`, hooks `useDebounce`/`useFocusTrap`.
- **Phase 2:** Fix pagination overflow, table `overflow-x-auto`, max-width container, responsive padding.
- **Phase 3:** Skeleton loading cho tất cả pages, EmptyState, page transitions, modal animations, debounce search, login polish, aria labels, table row hover.
- **Phase 4:** Command Palette (Ctrl+K), Notification Dropdown, `SearchDropdown` refactor, print CSS.

**Files xóa:**
- `webapp/docs/PLAN-ui-improvements.md`

**Files sửa:**
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 9. Fix BUG-007: M1 Transition UI cải tiến

**Vấn đề:** Dashboard M1 Transition UI chưa tối ưu: hiển thị "T2 tạm" sai, thiếu Staff ID của T1 tạm, chưa có quick actions, tên M1 chưa clickable.

**Giải pháp:**
- Đổi text "T2 tạm" → "T1 tạm", hiển thị format `tên (staff_id)`.
- Tên M1 bọc trong `<Link>` → chuyển `/agents/:id`.
- Thêm 3 quick buttons: Tạo email mẫu (disabled nếu không eligible), Tạo đề xuất, Ở lại với T2 (countdown 10s).
- Query thêm `contract_signing_date`, `rank_name` của m1_agent và `t1_changes` để check eligibility.

**Files sửa:**
- `webapp/src/pages/DashboardPage.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 8. Fix BUG-006: Modal bị cắt trong container do PageTransition transform

**Vấn đề:** Modal `ComposeTemplateModal` bị giới hạn bên trong khung content, không overlay toàn màn hình. Nguyên nhân là `PageTransition` dùng CSS animation `fade-in` có `transform: translateY()`, tạo stacking context mới → `position: fixed` của modal bị "trapped".

**Giải pháp:** Dùng `createPortal` từ `react-dom` để render modal ra `document.body`, hoàn toàn thoát khỏi DOM tree và stacking context của `PageTransition` / `Layout`.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 7. Fix BUG-005: Hardcoded T1 mới trong email, thiếu newT1StaffId

**Vấn đề:** `ComposeTemplateModal` hardcoded T1 mới là `'Lê Thị D'` / `'ltd@era.com'` cho mọi agent. Thực tế T1 mới phải lấy từ `t1_requests.proposed_new_t1_id` (request active). Thiếu placeholder `{{newT1StaffId}}`.

**Giải pháp:**
- Query `t1_requests` tìm request active mới nhất của agent → lấy `proposed_new_t1_id`.
- Query `agents` lấy `full_name`, `staff_id`, `email` của T1 dự kiến.
- Replace `{{newT1Name}}`, `{{newT1Email}}`, `{{newT1StaffId}}` từ dữ liệu thực thay vì hardcoded.
- Thêm `{{newT1StaffId}}` vào `EmailTemplatesPage` placeholders + preview.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/src/pages/EmailTemplatesPage.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 6. Fix BUG-004: Modal soạn mẫu bị đẩy lên trên, mất nút X

**Vấn đề:** Modal `ComposeTemplateModal` bị đẩy sát header app, phần header của modal (tiêu đề + nút X) bị ẩn khỏi viewport khi nội dung dài.

**Giải pháp:**
- Wrapper: thêm `overflow-y-auto` để cuộn an toàn khi modal cao hơn viewport.
- Inner modal: bỏ `max-h-[90vh] overflow-y-auto`, thay bằng `my-auto` để tự căn giữa không bị cắt header.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 5. Fix BUG-003: Soạn mẫu email không lấy nội dung từ DB

**Vấn đề:** `ComposeTemplateModal` dùng mảng templates hardcoded trong code, không query từ DB. Khi admin sửa template trong `EmailTemplatesPage` và lưu, modal soạn thư vẫn hiển thị nội dung cũ.

**Giải pháp:**
- Thêm `loadTemplates()` query `email_templates` từ Supabase khi modal mount.
- Merge DB templates với `defaultTemplates` (DB override theo `template_key`).
- Giữ hardcoded làm fallback nếu DB chưa có data.
- Thêm `else { setT1Old(null) }` để tránh giữ T1 cũ khi chuyển sang agent không có T1.

**Files sửa:**
- `webapp/src/components/ComposeTemplateModal.tsx`
- `webapp/docs/PLAN-bug-fixes.md`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### UI Improvements — Phase 1-4 (Foundation, Critical Fixes, Polish, Advanced)

**Mục tiêu:** Cải tiến UI/UX toàn diện dựa trên patterns từ `freelancer-workspace` (ThompBui SaaS dashboard).

#### Phase 1: Foundation
- **CSS Design Tokens:** Chuyển sang CSS variables làm design tokens, thêm animation keyframes (`fade-in`, `fade-in-scale`, `skeleton-pulse`).
- **Shared Components (mới):**
  - `Skeleton` — Block, Text, Card, Table shimmer loading states
  - `Badge` — 5 variants: primary/success/warning/danger/neutral
  - `EmptyState` — Icon 48px + title + subtitle + optional CTA
  - `Pagination` — Smart ellipsis `[1] ... [5] [6] **7** [8] [9] ... [255]`
  - `Modal` — Backdrop blur, scale+fade animation, focus trap, Escape đóng
  - `PageTransition` — Fade-in wrapper cho mỗi page route
- **Hooks (mới):**
  - `useDebounce` — Debounce value với delay tùy chỉnh
  - `useFocusTrap` — Trap focus trong modal (Tab vòng lặp)

#### Phase 2: Critical Fixes (P0)
- **Pagination overflow fix:** `AgentsPage` thay 255 nút page inline bằng `Pagination` component (max 7 visible buttons + ellipsis).
- **Table scroll mobile:** Thêm `overflow-x-auto` wrapper + `min-w` cho tất cả tables: Agents, Requests, AgentDetail (M1), Trash, Holidays.
- **Max-width container:** `Layout.tsx` thêm `max-w-7xl mx-auto` cho Main Content, giảm stretch trên màn hình lớn.
- **Responsive padding:** Main content padding thay đổi theo breakpoint `p-4 sm:p-6 lg:p-8`.

#### Phase 3: Loading, Empty & Animation Polish
- **Skeleton loading:** Thay spinner/text "Đang tải..." bằng `Skeleton` components trên Dashboard (stat cards + content cards), AgentsPage (5 table rows), RequestsPage, AgentDetailPage, RequestDetailPage.
- **Empty States:** Thay text đơn điệu "Không có dữ liệu" bằng `EmptyState` component (icon + title + subtitle) trên Agents, Requests, AgentDetail (M1, T1 history, as T1), ActivityLog, Trash, Holidays, Dashboard (bookmarks + transitions).
- **Page Transitions:** `App.tsx` wrap tất cả pages với `PageTransition` → fade-in 350ms mỗi lần chuyển trang.
- **Modal animations:** `Modal` component mới dùng scale 95% + fade 150ms, focus trap, Escape đóng.
- **Debounce search:** `RequestsPage` và `ActivityLogPage` dùng `useDebounce` 300ms cho search input.
- **Login polish:** `LoginPage` thêm toggle show/hide password (Eye/EyeOff icon), `autoComplete="email"` và `autoComplete="current-password"`.
- **Aria labels:** Thêm `aria-label` cho Menu, Notifications, User menu, bookmark star, delete holiday.
- **Table row hover:** Thêm `transition-colors duration-100` cho tất cả table rows.

#### Phase 4: Advanced UI
- **Command Palette (Ctrl+K):** Component mới `CommandPalette` — global search:
  - Tìm agent theo tên/mã (server-side, limit 5)
  - Tìm request theo mã/agent (server-side, limit 5)
  - Navigation nhanh đến tất cả pages
  - Keyboard nav: ↑↓ chọn, Enter mở, Escape đóng
  - Header thêm nút "Tìm kiếm [Ctrl K]" trigger
- **Notification Dropdown:** Component mới `NotificationDropdown`:
  - Query 20 activity_logs gần nhất
  - Badge đỏ hiển thị số chưa đọc
  - Mark all read / mark individual read (lưu localStorage)
  - Link đến request detail / activity log
- **Print CSS:** `@media print` ẩn sidebar, header, nav, buttons — chỉ hiển thị nội dung chính.

**Files sửa/tạo:**
- `webapp/src/index.css` — Design tokens, animations, print CSS
- `webapp/src/components/Skeleton.tsx` — Mới
- `webapp/src/components/Badge.tsx` — Mới
- `webapp/src/components/EmptyState.tsx` — Mới
- `webapp/src/components/Pagination.tsx` — Mới
- `webapp/src/components/Modal.tsx` — Mới
- `webapp/src/components/PageTransition.tsx` — Mới
- `webapp/src/components/CommandPalette.tsx` — Mới
- `webapp/src/components/NotificationDropdown.tsx` — Mới
- `webapp/src/hooks/useDebounce.ts` — Mới
- `webapp/src/hooks/useFocusTrap.ts` — Mới
- `webapp/src/App.tsx` — PageTransition wrap
- `webapp/src/components/Layout.tsx` — max-width, aria labels, CommandPalette, NotificationDropdown
- `webapp/src/pages/LoginPage.tsx` — Toggle password, autoComplete
- `webapp/src/pages/AgentsPage.tsx` — Pagination component, SkeletonTable, EmptyState, overflow-x-auto
- `webapp/src/pages/RequestsPage.tsx` — Debounce, SkeletonTable, EmptyState, overflow-x-auto
- `webapp/src/pages/AgentDetailPage.tsx` — Skeleton, EmptyState, overflow-x-auto
- `webapp/src/pages/RequestDetailPage.tsx` — Skeleton loading
- `webapp/src/pages/ActivityLogPage.tsx` — Debounce, EmptyState
- `webapp/src/pages/TrashPage.tsx` — EmptyState
- `webapp/src/pages/HolidaysPage.tsx` — EmptyState, overflow-x-auto, aria-label
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-28

### 4. Fix BUG-002: Agent không tìm thấy do Supabase `max-rows` limit

**Vấn đề:** Agent Lê Vạn Lý - LL60640 có trong DB nhưng không tìm thấy khi search trong AgentsPage. Supabase REST API mặc định giới hạn 1000 rows, query không có `.limit()` chỉ trả về ~1000 agents mới nhất. Search client-side chỉ tìm trên subset → agents cũ bị "mất".

**Giải pháp (theo plan BUG-002):**
- Chuyển search + pagination sang **server-side**:
  - Search dùng `.or('full_name.ilike...staff_id.ilike...')` gọi trực tiếp Supabase.
  - Pagination dùng `.range(from, to)` server-side.
  - Count dùng `.select('*', { count: 'exact', head: true })`.
- Search input debounce 300ms.
- T1 info chỉ query cho 10 rows hiển thị (current page) thay vì toàn bộ.
- Tạm ẩn các quick filter presets phức tạp (`near_91d`, `near_180d`, `quota_exceeded`) — cần eligibility engine server-side (Bước 2 plan).
- ExportModal: thêm prop `fetchData` để loop query toàn bộ records (batch 1000 rows) khi export, bypass max-rows limit.

**Files sửa:**
- `webapp/src/pages/AgentsPage.tsx` — Refactor load/search/filter/pagination sang server-side
- `webapp/src/components/ExportModal.tsx` — Thêm `fetchData` prop để export toàn bộ không bị giới hạn pagination
- `webapp/docs/PLAN-bug-fixes.md` — Cập nhật status `fixed`
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-27

### 3. Fix M1 không được chuyển khi agent không có T1 cũ (old_t1_id = null)

**Vấn đề:** Request #f7e77204 — Trần Vĩnh Phi Long (LT36739) có 191 M1, chuyển sang T1 mới, nhưng `old_t1_id = null` trong `t1_requests`. `completeRequestAction` wrap toàn bộ xử lý M1 trong `if (request.old_t1_id)` → block bị skip → 191 M1 vẫn kẹt dưới line cũ, không có transition task nào được tạo.

**Business rule đã xác nhận:** Agent có thể không có T1. Khi chuyển đi, M1 không có T2 tạm nhưng vẫn được xử lý 30 ngày + eligibility. Lựa chọn của M1: không có T1 hoặc chọn T1 mới.

**Giải pháp:**
- Tách logic query M1 + tạo transition tasks + update M1s ra khỏi `if (request.old_t1_id)`.
- `m1_transition_tasks.temp_t1_id` → nullable (`string | null`). Khi `old_t1_id = null`, task được tạo với `temp_t1_id = null`.
- Update M1s `current_t1_id = request.old_t1_id` → `null` khi agent không có T1 cũ.
- Dashboard hiển thị "Không có T1 tạm" khi `temp_t1_id = null`.

**Files sửa:**
- `webapp/supabase/migrations/004_fix_m1_null_temp_t1.sql` — `ALTER TABLE DROP NOT NULL` cho `temp_t1_id`
- `webapp/src/types/index.ts` — `temp_t1_id: string | null`
- `webapp/src/lib/request-actions.ts` — Tách M1 logic khỏi `if (old_t1_id)`
- `webapp/src/pages/DashboardPage.tsx` — UI xử lý `temp_t1_id = null`, `applyT2` set `current_t1_id = null`
- `webapp/docs/CHANGELOG.md` — File này

**Lưu ý triển khai:** Schema local đã sửa nhưng DB production cần chạy thủ công trong Supabase SQL Editor:
```sql
ALTER TABLE public.m1_transition_tasks ALTER COLUMN temp_t1_id DROP NOT NULL;
```

---

## 2026-05-27

### 2. Fix lỗi hoàn tất request khi agent không có T1 cũ + ẩn B4/B5

**Vấn đề 1:** Khi bấm "Đồng ý" hoàn tất đổi T1 cho agent **không có T1 cũ** (`old_t1_id = null`), `completeRequestAction` cố insert `m1_transition_tasks` với `temp_t1_id: null` → lỗi `violates not-null constraint`. Vì lỗi xảy ra ở bước cuối (sau khi đã update request + insert t1_changes + update agent), log báo thành công nhưng thực ra chưa hoàn tất. Bấm lại tạo duplicate `t1_changes` và `activity_logs`.

**Giải pháp:**
- Thêm **guard check** `status === 'completed'` ở đầu `completeRequestAction` → tránh bấm lại tạo duplicate
- Nếu `old_t1_id = null` → **bỏ qua** hoàn toàn bước tạo `m1_transition_tasks` và move M1s (vì không có T2 tạm)
- Đưa bước move M1s vào chung `if (request.old_t1_id)`

**Vấn đề 2:** Dashboard và Requests List vẫn hiển thị **B4, B5** trong chart và Kanban cards (đã không còn trong workflow 3 bước).

**Giải pháp:**
- `DashboardPage.tsx`: Chart "Trạng thái đề xuất" từ 7 cột → 5 cột (B1, B2, B3, Hoàn tất, Đã hủy)
- `RequestsPage.tsx`: Kanban summary từ 7 cards → 5 cards

**Files sửa:**
- `webapp/src/lib/request-actions.ts` — Fix null `temp_t1_id` + guard duplicate
- `webapp/src/pages/DashboardPage.tsx` — Ẩn B4/B5 khỏi chart
- `webapp/src/pages/RequestsPage.tsx` — Ẩn B4/B5 khỏi Kanban cards
- `webapp/docs/CHANGELOG.md` — File này

---

### 1. Rút gọn quy trình Request từ 5 bước → 3 bước (B1→B2→B3)

**Vấn đề:** Request Detail Page đang hiển thị quy trình cũ 5 bước (B1→B2→B3→B4→B5), không đúng với workflow thực tế đã thống nhất. Quy trình thực tế chỉ có 3 bước: B1 (tạo đề xuất) → B2 (T1 mới xác nhận, nhập ngày) → B3 (điểm quyết định sau 3 ngày làm việc).

**Giải pháp:**
- Progress bar: 5 bước → 3 bước (B1, B2, B3)
- B3 là "điểm quyết định" với 2 nút: `Đồng ý` và `Hủy đề xuất`
- `Đồng ý`: bị **khóa** trong 3 ngày làm việc đầu (agent có quyền đổi ý). Hiển thị countdown `Đồng ý (X ngày)`. Mở khóa khi đủ ngày.
- `Hủy`: **luôn hiện** ngay từ sau B2 (agent có thể đổi ý & hủy bất cứ lúc nào)
- Cả 2 nút đều dùng **CountdownConfirmModal 10 giây**
- Thêm card hiển thị deadline: ngày xác nhận B2 + ngày hết hạn 3 ngày LV + trạng thái chờ
- Xóa logic advance B3→B4→B5, xóa modal inline cũ
- Xử lý backward-compatible cho request legacy đang ở step3/4/5 (map vào B3)

**Files sửa:**
- `webapp/src/pages/RequestDetailPage.tsx` — Refactor toàn bộ UI/UX + logic 3 bước
- `webapp/docs/PLAN-t1-change-tracker.md` — Cập nhật quy trình 3 bước
- `webapp/docs/PROGRESS.md` — Cập nhật mô tả Phase 4
- `webapp/docs/UI-DESIGN.md` — Cập nhật mockup Request Detail (3 bước, B3 decision)
- `webapp/docs/CHANGELOG.md` — File này

---

## 2026-05-26

### 1. Sửa điều kiện eligibility cấp bậc

**Vấn đề:** Điều kiện cấp bậc đang yêu cầu `>= CS/Cấp 1` (dùng whitelist 15 rank). Thực tế business rule chỉ cần **không phải ASC** là đủ điều kiện.

**Giải pháp:**
- Frontend (`eligibility.ts`): Đổi `isCSOrAbove()` → `isNotASC()`; message đổi thành `(không được là ASC)`
- Backend (SQL RPC `check_eligibility`): Bỏ `v_cs_ranks`, dùng `LOWER(rank_name) != 'asc'`

**Files sửa:**
- `webapp/src/lib/eligibility.ts`
- `webapp/supabase/migrations/001_initial_schema.sql`
- `webapp/docs/PROGRESS.md`

---

### 2. Gộp agent_code vào staff_id

**Vấn đề:** Mã NV (`staff_id`) và Mã Agent (`agent_code`) trong thực tế là một. Có mâu thuẫn giữa thiết kế (PLAN nói `staff_id` là unique key) và code (upsert lại dùng `agent_code` làm onConflict).

**Giải pháp:** Xóa hoàn toàn trường `agent_code`, giữ `staff_id` làm unique key cho upsert.

**Files sửa:**
- `webapp/supabase/migrations/001_initial_schema.sql` — Xóa cột `agent_code`
- `webapp/src/types/index.ts` — Xóa `agent_code` khỏi `Agent` interface
- `webapp/src/pages/UploadPage.tsx` — Expected headers, validate, upsert logic đổi sang `staff_id`
- `webapp/src/pages/AgentsPage.tsx` — Xóa cột Mã Agent, search + export theo `staff_id`
- `webapp/src/pages/AgentDetailPage.tsx` — Xóa dòng Mã Agent, title + M1 list hiển thị `staff_id`
- `webapp/src/components/CreateRequestModal.tsx` — Search + display đổi sang `staff_id`
- `webapp/src/components/ComposeTemplateModal.tsx` — Placeholder `{{agentCode}}` → `{{staffId}}`
- `webapp/src/pages/RequestsPage.tsx` — Query + display + export đổi sang `staff_id`
- `webapp/src/pages/RequestDetailPage.tsx` — Query + display đổi sang `staff_id`
- `webapp/src/pages/DashboardPage.tsx` — Query + display đổi sang `staff_id`
- `webapp/src/pages/TrashPage.tsx` — Query + display đổi sang `staff_id`
- `webapp/scripts/extract_agents.py` — Output SQL chỉ insert `staff_id`
- `webapp/supabase/seed_data.sql` — Xóa cột `agent_code`
- `webapp/supabase/import_agents.sql` — Xóa cột `agent_code`
- `webapp/docs/PROGRESS.md` — Cập nhật mô tả
- `PLAN-t1-change-tracker.md` — Cập nhật schema mô tả
- `UI-DESIGN.md` — Xóa cột Mã Agent khỏi mockup

---

### 3. Fix lỗi tạo đề xuất khi agent chưa có T1

**Vấn đề:** Khi tạo `t1_requests`, `old_t1_id` bị lỗi `violates not-null constraint` vì agent chưa có T1 (`current_t1_id = null`).

**Giải pháp:** Bỏ `NOT NULL` cho `old_t1_id` ở bảng `t1_requests` và `t1_changes`.

**Files sửa:**
- `webapp/supabase/migrations/001_initial_schema.sql` — `old_t1_id UUID` (bỏ NOT NULL)
- `webapp/src/types/index.ts` — `old_t1_id: string | null`

**Lưu ý triển khai:** Schema local đã sửa nhưng DB trên Supabase chưa tự động sync. Cần chạy thủ công trong SQL Editor:
```sql
ALTER TABLE public.t1_requests ALTER COLUMN old_t1_id DROP NOT NULL;
ALTER TABLE public.t1_changes ALTER COLUMN old_t1_id DROP NOT NULL;
```

---

### 4. Cải tiến trang Email Templates

**Vấn đề:**
- Menu Email Templates ẩn vì chỉ cho role `admin`
- Placeholder (`{{agentName}}`, `{{agentCode}}`...) chỉ hiển thị, không click để chèn được
- `{{agentCode}}` đã lỗi thờivì đã xóa trường `agent_code`

**Giải pháp:**
- Hướng dẫn user đổi role thành `admin` trong Supabase Table Editor
- Thêm tính năng **click placeholder để chèn** vào textarea tại vị trí con trỏ
- Đổi `{{agentCode}}` → `{{staffId}}`

**Files sửa:**
- `webapp/src/pages/EmailTemplatesPage.tsx`

---

### 5. Deploy production

**URL:** https://t1-change-tracker.vercel.app

**Cách deploy:** `cd webapp && vercel --prod --yes`

---

## 2026-05-27

### 6. Điều chỉnh workflow B2 — nhập ngày xác nhận, cảnh báo 3 ngày làm việc, xác nhận thay đổi từ ngày thứ 4

**Thay đổi:**
- Khi chuyển sang B2, admin phải nhập ngày xác nhận (date picker) thay vì auto ghi `NOW()`.
- Dashboard thêm card **"B2 chờ phản hồi chấp thuận"**: tính deadline = ngày xác nhận + 3 ngày làm việc (trừ T7, CN, ngày lễ VN), cảnh báo đỏ khi quá hạn.
- Dashboard thêm card **"B2 đủ điều kiện xác nhận thay đổi"**: từ ngày thứ 4 (ngày xác nhận + 4 ngày làm việc), admin có thể bấm **"Xác nhận thay đổi"** để hoàn tất request ngay (bypass B3→B4→B5) hoặc **"Hủy đề xuất"**.
- Cả 2 nút đều có **countdown 10 giây** (modal `CountdownConfirmModal`) để tránh misclick.
- Không auto-update, chỉ xảy ra khi admin thao tác tay.

**Files sửa:**
- `webapp/src/lib/eligibility.ts` — Thêm `addBusinessDays`, `isBusinessDay`, `checkCanChooseNewT1`, `getM1ImpactSummary`
- `webapp/src/lib/request-actions.ts` — Tạo mới, tách `completeRequestAction` reusable
- `webapp/src/components/CountdownConfirmModal.tsx` — Tạo mới
- `webapp/src/pages/RequestDetailPage.tsx` — Modal nhập ngày B2, refactor dùng `completeRequestAction`
- `webapp/src/pages/DashboardPage.tsx` — 2 card B2 + query holidays + countdown modal
- `webapp/docs/CHANGELOG.md`

### 7. M1 Impact Analysis trong modal Tạo đề xuất

**Thay đổi:**
- Khi tạo đề xuất, hiển thị thêm section **"Tác động đến ngưởi dưới line"**:
  - Tổng số M1 của agent đang đổi T1.
  - Số M1 đủ điều kiện chọn T1 mới.
  - Số M1 không đủ điều kiện (sẽ ở lại với T2).
  - Expandable list chi tiết từng M1 + lý do.

**Files sửa:**
- `webapp/src/components/CreateRequestModal.tsx`
- `webapp/src/lib/eligibility.ts`

### 8. Fix M1 không tự động chuyển T1 khi request hoàn tất

**Vấn đề:** Khi admin xác nhận hoàn tất đổi T1, agent chính được cập nhật `current_t1_id` sang T1 mới, nhưng các M1 dưới line vẫn giữ `current_t1_id` = agent cũ → tab M1 của agent cũ vẫn hiển thị họ.

**Giải pháp:** Trong `completeRequestAction`, sau khi tạo `m1_transition_tasks`, cập nhật `agents.current_t1_id = old_t1_id` (T2 tạm) cho toàn bộ M1.

**Files sửa:**
- `webapp/src/lib/request-actions.ts`

### 9. Định dạng ngày giờ dd/mm/yyyy, GMT+7

**Thay đổi:** Toàn bộ app hiển thị ngày theo định dạng `dd/mm/yyyy` (2 chữ số ngày/tháng), timezone `Asia/Ho_Chi_Minh`.

**Files sửa:**
- `webapp/src/lib/date-utils.ts` — Tạo mới (`formatDate`, `formatDateTime`, `formatTime`)
- `webapp/src/pages/AgentsPage.tsx`
- `webapp/src/pages/AgentDetailPage.tsx`
- `webapp/src/pages/RequestsPage.tsx`
- `webapp/src/pages/RequestDetailPage.tsx`
- `webapp/src/pages/DashboardPage.tsx`
- `webapp/src/pages/ActivityLogPage.tsx`
- `webapp/src/pages/TrashPage.tsx`
- `webapp/src/pages/HolidaysPage.tsx`
- `webapp/src/components/ComposeTemplateModal.tsx`

### 10. Fix hiển thị UUID thay vì tên + staff_id

**Vấn đề:** Nhiều chỗ trong app hiển thị `current_t1_id`, `old_t1_id`, `proposed_new_t1_id` dưới dạng UUID cắt ngắn (vd: `939774a7`) thay vì tên ngưởi.

**Giải pháp:** Load thêm thông tin agent liên quan (T1 cũ, T1 mới, ngưởi giới thiệu) qua join/query riêng, hiển thị `Họ tên - staff_id`.

**Files sửa:**
- `webapp/src/pages/AgentsPage.tsx` — Cột "T1 hiện tại"
- `webapp/src/pages/RequestsPage.tsx` — Cột "T1 cũ → T1 mới", Export
- `webapp/src/pages/AgentDetailPage.tsx` — Tab M1, Lịch sử T1, T1 Hiện tại, Ngưởi giới thiệu
- `webapp/src/pages/RequestDetailPage.tsx` — Header T1 CŨ / T1 MỚI, Agent info
- `webapp/src/pages/ActivityLogPage.tsx` — T1 cũ → T1 mới trong log item
- `webapp/src/pages/DashboardPage.tsx` — Agent name, T1 name trong B2 cards

### 11. Fix RLS — operator không thể insert t1_changes, activity_logs, m1_transition_tasks

**Vấn đề:** Role `operator` bị RLS chặn khi bấm "Xác nhận thay đổi" từ Dashboard vì `completeRequestAction` insert vào 3 bảng này.

**Giải pháp:** Thêm policy INSERT cho operator.

**Files sửa:**
- `webapp/supabase/migrations/003_fix_rls_policies.sql` — Tạo mới

### 12. Schema cleanup — xóa cột agent_code thừa

**Thay đổi:** Database production vẫn còn cột `agent_code` từ schema cũ. Xóa cột và đồng bộ file import.

**Files sửa:**
- `webapp/supabase/cleanup_agent_data.sql` — Tạo mới (script xóa data giữ schema)
- `webapp/supabase/import_agents.sql` — Revert về không có `agent_code`

### 13. BUG-008: DivisionsPage — Head Agent searchable dropdown + table scroll

**Vấn đề:**
1. Form "Sửa division" yêu cầu nhập UUID thủ công cho `head_agent_id` → admin không thể dùng thực tế.
2. Bảng divisions hiển thị toàn bộ 29 dòng, không giới hạn chiều cao → page dài, khó quan sát.

**Giải pháp:**
1. Thay input text UUID bằng **searchable dropdown**: gõ tên hoặc staff_id → query Supabase → chọn agent → lưu UUID ngầm.
2. Giới hạn chiều cao bảng `max-h-[400px]` với `overflow-y-auto` + `sticky` header.

**Files sửa:**
- `webapp/src/pages/DivisionsPage.tsx` — Searchable dropdown, sticky scroll table


### 14. BUG-009: AgentsPage không hiển thị Division — Schema gap `division_id` INTEGER vs UUID

**Vấn đề:**
1. `AgentsPage` không có cột Division trong bảng.
2. `agents.division_id` là `INTEGER` (schema cũ) trong khi `divisions.id` là `UUID` (schema mới). Trigger `recompute_division_on_referrer_change` gán UUID vào cột INTEGER → sẽ gây lỗi cast.

**Giải pháp:**
1. **Schema migration** (`011_fix_division_id_uuid.sql`):
   - Tạo cột `division_uuid UUID`, compute division cho toàn bộ agents (head → division của head, còn lại → "Khác")
   - Drop cột `division_id` INTEGER cũ, rename `division_uuid` → `division_id`
   - Tạo index, recreate trigger với kiểu UUID đúng
2. **Frontend:**
   - `types/index.ts` — `Agent.division_id: string | null`
   - `AgentsPage.tsx` — query divisions, thêm cột Division, update export
   - `AgentDetailPage.tsx` — hiển thị division trong info card

**Files sửa:**
- `webapp/supabase/migrations/011_fix_division_id_uuid.sql` — Tạo mới
- `webapp/src/types/index.ts`
- `webapp/src/pages/AgentsPage.tsx`
- `webapp/src/pages/AgentDetailPage.tsx`


### 15. FEAT-008: Division Safety Net — Force Recompute & getAgentDivision RPC

**Mô tả:**
Hoàn thiện Lớp 2 và Lớp 3 của Division Safety Net theo thiết kế FEAT-006:

- **Lớp 2:** RPC `get_agent_division(agent_id)` — tính division đúng theo business rule (agent là head → division đó, có T1 → đi lên cây T1 tìm head → division của head, fallback → "Khác")
- **Lớp 3:** Nút "🔄 Tính lại Division" trong trang Divisions — admin force recompute toàn bộ agents với CountdownConfirmModal 10s

**Files sửa:**
- `webapp/supabase/migrations/012_division_safety_net.sql` — 2 RPC functions mới
- `webapp/src/pages/DivisionsPage.tsx` — Thêm button + CountdownConfirmModal + gọi RPC

