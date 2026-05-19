# TASKS: WorkKPI Implementation Plan

Bản tracking này chia nhỏ các User Story từ `PRD.md` và `specs/` thành các task kỹ thuật cụ thể.
Mỗi task được thiết kế để hoàn thành trong **tối đa 2 giờ**.

> **Ghi chú phạm vi:** Các tính năng nâng cao (Import/Export Excel, Snapshot KPI, Khiếu nại KPI,
> Export PDF, Thông báo email, Cảnh báo tự động, Tích hợp bên ngoài, Audit log, Backup/Restore,
> Cấu hình ngưỡng KPI/mức phạt) được **lược bỏ khỏi MVP** và sẽ triển khai sau khi hoàn thành
> dự án cốt lõi.

---

## Milestone 1: Authentication Foundation (F1)
*Mục tiêu: Đăng nhập cơ bản, Quên mật khẩu và Protected Routes.*

- [x] **Khởi tạo Supabase SSR Clients:** Cài đặt `@supabase/ssr` và tạo các utility functions
  cho server, browser, middleware.
    - *Files:* `utils/supabase/server.ts`, `utils/supabase/client.ts`, `utils/supabase/middleware.ts`

- [x] **Thiết lập Middleware chặn Route:** Viết logic redirect từ `/dashboard` về `/login`
  nếu chưa có session.
    - *Files:* `middleware.ts`

- [x] **UI/UX Màn hình Đăng nhập:** Xây dựng layout Login Form với Email/Password.
    - *Files:* `app/auth/layout.tsx`, `app/auth/login/page.tsx`, `app/auth/login/login-form.tsx`

- [x] **Logic Đăng nhập Email/Password:** Gọi API Supabase `signInWithPassword`, xử lý hiển thị
  lỗi an toàn (chung chung, không tiết lộ email có tồn tại không).
    - *Files:* `app/auth/login/login-form.tsx`

- [x] **Luồng Quên mật khẩu (Request):** UI form nhập email và logic gửi email reset qua Supabase.
    - *Files:* `app/auth/forgot-password/page.tsx`, `app/auth/forgot-password/forgot-password-form.tsx`

- [x] **Luồng Đặt lại mật khẩu (Update):** UI form nhập mật khẩu mới (2 bước xác nhận) sau khi
  click link email.
    - *Files:* `app/auth/update-password/page.tsx`, `app/auth/update-password/update-password-form.tsx`

- [x] **Nút Đăng xuất:** Logic sign out và xóa session, redirect về `/login`.
    - *Files:* `components/auth/sign-out-button.tsx`

> **Lược bỏ:** Google SSO — sẽ triển khai sau MVP.

---

## Milestone 2: Advanced Security & Session Lifecycle (F1)
*Mục tiêu: Lockout sau 5 lần sai, Lịch sử đăng nhập, Auto-logout 8 tiếng.*

- [x] **Định nghĩa Schema Session & Lockout:** Thiết kế DB lưu history đăng nhập và tracking
  failed attempts.
    - *Files:* `prisma/schema.prisma`

- [x] **Logic Tracking Login Thất bại & Khóa 15 phút:** Đếm số lần sai, chèn lock window vào DB,
  trả về thông báo đếm ngược.
    - *Files:* `app/api/auth/login/route.ts`

- [ ] **Cảnh báo & Auto-expire Session (8 tiếng):** Client wrapper theo dõi event tương tác,
  show popup cảnh báo trước 5 phút, tự đăng xuất khi hết hạn.
    - *Files:* `components/auth/session-watcher.tsx`

- [x] **API Lưu & Lấy Lịch sử đăng nhập:** Ghi log mỗi lần login thành công (IP, User Agent).
  View 10 lần gần nhất.
    - *Files:* `app/api/auth/sessions/route.ts`, `app/profile/sessions/page.tsx`

- [x] **Đăng xuất Remote:** Invalidate session cụ thể từ xa (xóa JWT/SessionID khỏi hệ thống).
    - *Files:* `app/api/auth/sessions/[id]/route.ts`, `components/profile/active-sessions.tsx`

> **Lược bỏ:** Nhớ thiết bị 30 ngày, Email cảnh báo bảo mật (New Device / Change Password)
> — sẽ triển khai sau MVP.

---

## Milestone 3: User & Profile Management (F2) ✅ COMPLETED
*Mục tiêu: Hồ sơ cá nhân, Avatar, Cài đặt cá nhân, Theme.*

- [x] **Schema Cài đặt Profile:** Cấu hình table chứa avatar, số ĐT, theme, timezone, language.
    - *Files:* `prisma/schema.prisma`
    - ✅ Profile model đầy đủ với tất cả fields (displayName, phone, avatar, theme, language,
      timezone, notificationEmail)

- [x] **UI Xem & Chỉnh sửa thông tin cá nhân:** Hiện badge thống kê và form sửa Số điện thoại /
  Tên hiển thị.
    - *Files:* `app/dashboard/profile/page.tsx`, `components/profile/profile-form.tsx`
    - ✅ Profile page với 4 KPI stats, Edit form với validation, auto-redirect

- [x] **Logic Upload & Crop Avatar:** Cho phép chọn file, kiểm tra size < 2MB, upload lên
  Supabase Storage.
    - *Files:* `components/profile/avatar-upload.tsx`, `app/api/users/me/avatar/route.ts`
    - ✅ Drag-drop zone, preview, delete, progress bar, file validation

- [x] **Cập nhật Mật khẩu với Password Strength:** Thanh đánh giá độ mạnh regex-based.
    - *Files:* `components/profile/change-password-form.tsx`, `lib/password/strength.ts`
    - ✅ 5-bar strength indicator, requirements checklist, success redirect

- [x] **Cài đặt Dark/Light Mode:** Theme toggle và lưu preference.
    - *Files:* `components/profile/settings-form.tsx`, `app/api/users/me/settings/route.ts`
    - ✅ Theme selection (light/dark) trong settings form

- [x] **Cài đặt Ngôn ngữ & Múi giờ:** Form settings lưu preferences vào DB profile.
    - *Files:* `components/profile/settings-form.tsx`, `app/api/users/me/settings/route.ts`
    - ✅ Language (vi/en) và 20+ IANA timezones, notification email toggle

**Deliverables Summary:**
- 5 Pages: profile, edit, avatar, password, settings
- 7 UI Components: card, badge, avatar, separator, input, select, checkbox
- 5 Form Components: profile-form, avatar-upload, password-strength-indicator,
  change-password-form, settings-form
- 4 API Routes: GET/PATCH profile, POST/DELETE avatar, POST password, PATCH settings
- Test Coverage: 23/26 tests passing (88%)
- TypeScript: 0 errors across all 17 components
- Build Status: ✅ Successful (3.6s compile)

---

## Milestone 4: Admin — Quản lý người dùng & Phòng ban (F3)
*Mục tiêu: CRUD người dùng, Quản lý phòng ban, Team, RBAC.*

- [x] **Schema User, Role, Department & Team:** Thiết kế các model phòng ban, team và quan hệ roles
  (DIRECTOR / MANAGER / LEADER / EMPLOYEE).
    - *Files:* `prisma/schema.prisma`
    - ✅ Migration `20260516145356_add_admin_models` applied

- [x] **Bảng Quản trị Người dùng (Data Table):** Danh sách user với Sort, Pagination, Filter theo
  phòng ban / vai trò / trạng thái.
    - *Files:* `app/admin/users/page.tsx`, `components/admin/user-form.tsx`
    - ✅ COMPLETED: GET/POST `/api/admin/users`, UI page with 50-user listing

- [x] **CRUD User — Tạo & Chỉnh sửa:** Form tạo user mới (Họ tên, Email, Phòng ban, Vai trò),
  gửi email mời với mật khẩu tạm.
    - *Files:* `app/admin/users/new/page.tsx`, `app/admin/users/[id]/page.tsx`, `components/admin/user-form.tsx`
    - ✅ COMPLETED: User create/edit pages with form, temp password generation & email invite

- [x] **Logic Vô hiệu hóa & Kích hoạt lại User:** API cập nhật status `DISABLED`/`ACTIVE`
  (không xóa cứng), nhập lý do bắt buộc khi vô hiệu hóa.
    - *Files:* `app/api/admin/users/[id]/status/route.ts`
    - ✅ COMPLETED: Soft-delete with reason validation

- [x] **Chuyển User sang Phòng ban khác:** API reassign, cảnh báo task đang làm ở phòng cũ.
    - *Files:* `app/api/admin/users/[id]/department/route.ts`
    - ✅ COMPLETED: Transfer user to another department with team removal

- [x] **CRUD Phòng ban:** Tạo / sửa phòng ban, gán Trưởng phòng, validate tên không trùng.
    - *Files:* `app/admin/departments/page.tsx`, `app/admin/departments/new/page.tsx`, 
      `app/admin/departments/[id]/page.tsx`, `components/admin/department-form.tsx`
    - ✅ COMPLETED: Full department CRUD with manager auto-role assignment

- [x] **CRUD Team trong Phòng ban:** Tạo team, gán Leader, thêm/xóa thành viên, validate nhân viên
  chỉ thuộc 1 team/phòng.
    - *Files:* `app/api/admin/departments/[id]/teams/route.ts`, `app/api/admin/teams/[id]/members/route.ts`
    - ✅ COMPLETED: Team creation, leader assignment, member management with validation

> **Lược bỏ:** Import/Export Excel nhân viên hàng loạt — sẽ triển khai sau MVP.

---

## Milestone 5: Task Management (F4) ✅ COMPLETED
*Mục tiêu: Tạo/giao task, Vòng đời trạng thái, Kanban Board, Sub-task, Comment.*

### 5A — Schema & API cốt lõi

- [x] **Schema Task, Comment & Attachment:** Thiết kế model Task đầy đủ (assignees, weight, priority, deadline, status, tags), file đính kèm.
    - *Files:* `prisma/schema.prisma`, migration `20260517131740_add_task_models`

- [x] **API CRUD Task:** Tạo, sửa, xóa task. Validate tổng weight assignee không vượt 100%/tháng.
    - *Files:* `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`, `app/api/tasks/weight-summary/route.ts`, `lib/tasks/weight.ts`

- [x] **API Chuyển trạng thái Task:** Logic state machine — chỉ cho phép chuyển theo luồng hợp lệ
  (To-Do → In Progress → Pending/Review → Done). RBAC: chỉ assignee hoặc người tạo.
    - *Files:* `app/api/tasks/[id]/status/route.ts`, `lib/tasks/permissions.ts`,
      `lib/tasks/state-machine.ts`

- [x] **API Upload File đính kèm:** Upload lên Supabase Storage, giới hạn 10MB/file, 50MB/task.
    - *Files:* `app/api/tasks/[id]/attachments/route.ts`, `lib/tasks/attachments.ts`

### 5B — Giao diện Task

- [x] **Form Tạo & Chỉnh sửa Task:** Tiêu đề, mô tả, deadline picker, assignee selector,
  weight dropdown (5/10/20/30/35%), priority (4 mức), tag.
    - *Files:* `components/tasks/task-form.tsx`, `components/tasks/weight-selector.tsx`, `app/dashboard/tasks/new/page.tsx`, `app/dashboard/tasks/[id]/edit/page.tsx`

- [x] **Kanban Board:** 5 cột (To-Do / In Progress / Pending / Review / Done), kéo thả đổi trạng thái, màu theo priority, counter mỗi cột, lọc theo assignee.
    - *Files:* `app/dashboard/tasks/page.tsx`, `components/tasks/kanban-board.tsx`,
      `components/tasks/task-card.tsx`

- [x] **List View Task (Trưởng phòng):** Bảng tổng quan toàn phòng, sort/filter theo nhân viên / trạng thái / tháng / priority, highlight task overdue màu đỏ.
    - *Files:* `app/dashboard/tasks/list/page.tsx`, `components/tasks/task-table.tsx`

- [x] **Trang Chi tiết Task:** Hiển thị đầy đủ thông tin, lịch sử thay đổi (audit trail), file
  đính kèm, luồng trạng thái hiện tại.
    - *Files:* `app/dashboard/tasks/[id]/page.tsx`, `components/tasks/task-detail.tsx`

- [x] **Widget Thanh Weight Nhân viên:** Thanh tiến trình 0–100% tổng weight đã gán trong tháng,
  cảnh báo màu khi > 80% và > 100%.
    - *Files:* `components/tasks/weight-progress-bar.tsx`

### 5C — Tương tác & cộng tác

- [x] **Checklist trong Task:** Thêm/xóa checklist items, tick hoàn thành, % tiến độ tự cập nhật
  theo tỷ lệ items đã tick, chặn chuyển sang Review khi còn item chưa tick.
    - *Files:* `components/tasks/checklist.tsx`, `app/api/tasks/[id]/checklist/route.ts`

- [x] **Sub-task:** Tạo sub-task từ task cha, gán assignee + deadline, % task cha = trung bình %
  sub-tasks, hiển thị dạng cây.
    - *Files:* `components/tasks/subtask-list.tsx`, `app/api/tasks/[id]/subtasks/route.ts`

- [x] **Từ chối Task & Yêu cầu Gia hạn Deadline:** Nút "Từ chối" kèm lý do bắt buộc (≥ 20 ký tự),
  nút "Yêu cầu gia hạn" kèm ngày đề xuất, Trưởng phòng nhận thông báo trong web để xét duyệt.
    - *Files:* `components/tasks/task-actions.tsx`, `app/api/tasks/[id]/reject/route.ts`,
      `app/api/tasks/[id]/extend/route.ts`

---

## Milestone 6: Nghiệm thu & Tính KPI (F4 & F5) 
*Mục tiêu: Luồng nộp nghiệm thu, chấm điểm, tính KPI tự động theo tháng.*

### 6A — Nghiệm thu Task

- [x] **Luồng Nộp Nghiệm thu:** Nút "Nộp nghiệm thu", bắt buộc đính kèm bằng chứng + tóm tắt kết
  quả, chuyển task sang trạng thái Review.
    - *Files:* `components/tasks/submit-review-form.tsx`, `app/api/tasks/[id]/submit-review/route.ts`
    - ✅ DONE: Validate checklist, evidence, summary. Chuyển sang REVIEW status.

- [x] **Form Chấm điểm Nghiệm thu (Trưởng phòng):** Nhập điểm chất lượng 0–100, xem bằng chứng và
  lịch sử tiến độ, nhập nhận xét, nút Duyệt / Trả lại.
    - *Files:* `app/api/tasks/[id]/review/route.ts`
    - ✅ DONE: Approve/reject logic. Điểm CL, tiến độ. Phạt overdue tự động.

- [x] **Logic Phạt Overdue tự động:** Tính số ngày trễ từ deadline → ngày nộp Review.
  `Điểm sau phạt = max(0, điểm_gốc − 10 × số_ngày_trễ)` (tính ngày làm việc).
    - *Files:* `lib/kpi/overdue-penalty.ts`
    - ✅ DONE: countBusinessDaysBetween, applyOverduePenalty.

- [x] **Tự đánh giá trước khi nộp:** Form tự đánh giá (thang 1–5 cho từng tiêu chí, nhận xét bắt
  buộc) hiển thị cho Trưởng phòng khi nghiệm thu.
    - *Files:* `components/tasks/self-assessment-form.tsx`, `lib/kpi/self-assessment.ts`
    - ✅ DONE: Validate (quality/timeliness/collaboration 1-5, comment ≥ 20 ký tự).

- [x] **Phê duyệt hàng loạt Review:** Checkbox chọn nhiều task Review, bulk approve với điểm mặc
  định, xác nhận trước khi áp dụng.
    - *Files:* `app/api/tasks/bulk-review/route.ts`
    - ✅ DONE: POST bulk approve, tối đa 50 task/lần, áp dụng penalty tự động.

### 6B — Tính KPI

- [x] **Schema KPI Record:** Model lưu kết quả KPI tháng: điểm từng task, tổng điểm, xếp loại,
  tháng/năm, userId.
    - *Files:* `prisma/schema.prisma`
    - ✅ DONE: KpiRecord model với month, year, totalScore, grade (EXCELLENT/GOOD/PASS/NEEDS_IMPROVEMENT).

- [x] **Hàm Tính KPI Core:** `KPI = Σ(% hoàn thành × điểm CL × trọng số)`, xử lý task Cancelled
  (không tính), trả về object chi tiết từng task đóng góp bao nhiêu điểm.
    - *Files:* `lib/kpi/calculator.ts`, `lib/kpi/grades.ts`, `lib/kpi/persist.ts`
    - ✅ DONE: taskContribution, calculateKpiFromTasks, gradeForScore, calculateAndSaveKpiForUsers.

- [x] **API Trigger Tính KPI tháng:** Endpoint tính KPI cho toàn bộ nhân viên của 1 tháng (chạy
  thủ công từ admin, sau MVP sẽ tự động hóa bằng cron). Lưu kết quả vào DB.
    - *Files:* `app/api/admin/kpi/calculate/route.ts`
    - ✅ DONE: POST with month/year/departmentId. RBAC: ADMIN + MANAGER. Lưu KpiRecord.

- [x] **API KPI Cá nhân:** Retrieve KPI tháng/năm, điểm tổng, xếp loại, chi tiết từng task.
    - *Files:* `app/api/kpi/me/route.ts`
    - ✅ DONE: GET /api/kpi/me?month=5&year=2026, trả về KpiRecord + task breakdown.

- [x] **API KPI Phòng ban:** Retrieve KPI tất cả nhân viên trong phòng, xếp hạng.
    - *Files:* `app/api/kpi/department/route.ts`
    - ✅ DONE: GET /api/kpi/department, RBAC: MANAGER + ADMIN, return KpiRecords sorted by score.

- [x] **KPI Ước tính Real-time:** Tính KPI dự phóng dựa trên task đã Done + task đang làm tính theo
  % tiến độ hiện tại. Label rõ "Ước tính — chưa chính thức". Cập nhật khi có thay đổi.
    - *Files:* `app/api/kpi/estimate/route.ts`, `lib/kpi/types.ts`
    - ✅ DONE: GET /api/kpi/estimate, trả về estimated KPI dựa trên task DONE + IN_PROGRESS.

### 6C — Dashboard & UI 

- [x] **Trang KPI Cá nhân (Nhân viên):** Điểm tổng, xếp loại (Xuất sắc/Tốt/Đạt/Cần cải thiện),
  bảng chi tiết đóng góp từng task, biểu đồ xu hướng 6 tháng (Recharts).
    - *Files:* `app/dashboard/kpi/page.tsx`, `components/kpi/kpi-personal-card.tsx`,
      `components/kpi/kpi-trend-chart.tsx`, `components/kpi/kpi-breakdown-table.tsx`
    - ✅ DONE: Fetch GET /api/kpi/me API, display score/grade/on-time-rate, breakdown table, 6-month trend chart (simple bar chart).

- [x] **Trang KPI Phòng ban (Trưởng phòng):** Bảng xếp hạng tất cả nhân viên trong phòng (STT,
  Tên, Điểm, Xếp loại), biểu đồ cột so sánh, lọc theo tháng.
    - *Files:* `app/dashboard/kpi/department/page.tsx`, `components/kpi/kpi-department-table.tsx`
    - ✅ DONE: Fetch GET /api/kpi/department API, RBAC check (MANAGER + ADMIN only), ranking table, summary stats, grade distribution.

- [x] **Form Chấm điểm Nghiệm thu UI:** Dialog/form hiển thị task details, auto-calculate penalty,
  input quality score 0-100, review comments, approve/reject buttons.
    - *Files:* `components/tasks/review-form.tsx`, `app/api/tasks/[id]/penalty-preview/route.ts`, integrated into `components/tasks/task-detail.tsx`
    - ✅ DONE: Modal form with self-assessment display, quality score input, penalty preview, approve/reject flow, integrate with POST /api/tasks/[id]/review route.

> **Lược bỏ:** Snapshot KPI bất biến, Khiếu nại KPI, Export PDF KPI cá nhân, KPI năm
> — sẽ triển khai sau MVP.

---

## Milestone 7: Dashboard & Thông báo trong Web (F5) 
*Mục tiêu: Dashboard theo vai trò, Thông báo in-app, Tìm kiếm & lọc nâng cao.*

### 7A — Dashboard

- [x] **Dashboard Nhân viên:** Widget task đang làm / đến hạn hôm nay / overdue, KPI ước tính
  tháng hiện tại, Top 5 task cần xử lý gấp, biểu đồ tròn tỷ lệ task theo trạng thái.
    - *Files:* `app/dashboard/page.tsx`, `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-view.tsx`
    - ✅ DONE: Role-based shell render theo profile, KPI ước tính, top task khẩn, trạng thái task, deadline gần nhất.

- [x] **Dashboard Trưởng phòng:** Widget tổng task theo trạng thái toàn phòng, KPI trung bình
  phòng, danh sách nhân viên kèm task overdue + KPI tháng, cảnh báo KPI thấp nổi bật.
    - *Files:* `app/dashboard/page.tsx`, `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-view.tsx`
    - ✅ DONE: Department-scoped summary, member KPI table, overdue count, current-month overview.

- [x] **Dashboard Leader:** Dữ liệu giới hạn trong team, widget task team theo trạng thái,
  KPI trung bình team, bảng thành viên kèm task đang làm + overdue.
    - *Files:* `app/dashboard/page.tsx`, `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-view.tsx`
    - ✅ DONE: Team-scoped view dựa trên team members và task assignees.

- [x] **Dashboard BGĐ:** KPI trung bình toàn công ty, biểu đồ cột KPI từng phòng, Top nhân viên
  xuất sắc và cần cải thiện, tỷ lệ task hoàn thành đúng hạn.
    - *Files:* `app/dashboard/page.tsx`, `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-view.tsx`
    - ✅ DONE: Company KPI summary, department averages, top/bottom performers.

- [x] **Widget Countdown Deadline:** Đếm ngược đến deadline task gần nhất (xanh → vàng ≤ 3 ngày
  → đỏ ≤ 1 ngày), top 3 task sắp đến hạn.
    - *Files:* `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-view.tsx`
    - ✅ DONE: Near-deadline card + urgent task list trong dashboard shell.

- [x] **Widget Dự báo KPI cuối tháng:** 3 kịch bản bi quan/bình thường/lạc quan, gợi ý task
  nên ưu tiên, cập nhật mỗi giờ.
    - *Files:* `components/dashboard/kpi-forecast-widget.tsx`
    - 📋 STATUS: Forecast widget derived from dashboard KPI estimate and urgent tasks.

### 7B — Thông báo In-app

- [x] **Schema Notification & Persist Layer:** Model Notification đã có, CRUD & query with read/unread
  filtering. Logic tự động gửi/xóa thông báo cũ (> 30 ngày).
    - *Files:* `prisma/schema.prisma` (✅ SCHEMA READY), `app/api/notifications/route.ts`,
      `app/api/notifications/[id]/read/route.ts`, `app/api/notifications/read-all/route.ts`
    - 📋 STATUS: GET `/api/notifications`, PATCH `/api/notifications/:id/read`, PATCH `/api/notifications/read-all` implemented. Auto-purge cron planned.

- [x] **Notification UI (In-app Bell Icon):** Bell icon ở header, badge đếm unread, dropdown list
  unread + recent (20), action: delete, dismiss (basic dropdown implemented).
    - *Files:* `components/notifications/notification-bell.tsx`
    - 📋 STATUS: Bell dropdown now loads 10 recent items, unread badge caps at 99+, mark-as-read + read-all works, history page at `/dashboard/notifications`.

- [x] **Notification Toast (Lightweight Popup):** Toast khi có notification mới (2s dismiss tự động
  hoặc click close).
    - *Files:* `components/notifications/notification-toast.tsx`
    - 📋 STATUS: Custom polling toast implemented with auto-dismiss.

- [x] **Mark as Read & Delete:** Khi click notification, auto mark as read, click chuyển tới detail
  page, swipe/button delete.
    - *Files:* `app/api/notifications/[id]/read/route.ts`, `app/api/notifications/[id]/route.ts`
    - 📋 STATUS: Mark-as-read and DELETE endpoints implemented; UI swipe/delete polish planned.

- [x] **Notification Preferences (Settings Tab):** Toggle on/off per notification type
  (TASK_ASSIGNED, TASK_REJECTED, REVIEW_NEEDED, etc.), email notification toggle.
    - *Files:* `components/profile/notification-preferences.tsx`, `components/profile/settings-form.tsx`
    - 📋 STATUS: Client-side persisted notification type preferences added to settings.

### 7C — Tìm kiếm & Lọc Task (Advanced)

- [x] **Global Search:** Search bar ở header, tìm task/người/phòng ban/team (1s debounce), display 3
  mục results.
    - *Files:* `components/search/global-search-input.tsx`, `app/api/search/route.ts`
    - 📋 STATUS: Basic search API + client component implemented (contains-based search). Integrated into dashboard header.

- [x] **Task List Advanced Filter:** Dropdown + checkbox: status, priority, assignee, creator,
  deadline range, department, weight. Save filter preset, clear all.
    - *Files:* `components/tasks/task-filter-bar.tsx`, `app/api/tasks?filters=...`
    - 📋 STATUS: Filterable task table with saved presets, clear all, deadline/weight/date range filters.

- [x] **Sort by:** Deadline, Priority, Created, Updated, Weight, Progress %.
    - *Files:* Task List Page
    - 📋 STATUS: Sort dropdown implemented in task table.

### 7C — Tìm kiếm & Lọc

- [x] **Tìm kiếm Task theo Từ khóa:** Real-time khi gõ ≥ 3 ký tự, tìm trong tiêu đề + mô tả,
  highlight từ khóa trong kết quả.
    - *Files:* `components/tasks/task-search.tsx`, `app/api/tasks/search/route.ts`
    - 📋 STATUS: Added debounced 300ms task search (min 3 chars), keyword highlight in title/description,
      role-scoped API search and integrated widget on task list page.

- [x] **Bộ lọc Nâng cao Task:** Lọc đa điều kiện (trạng thái, assignee, deadline, priority, tag),
  lưu bộ lọc yêu thích.
    - *Files:* `components/tasks/task-filter.tsx`, `components/tasks/task-table.tsx`, `app/api/users/me/saved-filters/route.ts`, `app/api/users/me/saved-filters/[id]/route.ts`
    - 📋 STATUS: Added advanced filter component for task search and moved saved filter presets to per-user
      API persistence (max 10 presets, create/apply/delete).

- [x] **Tìm kiếm Toàn cục (Ctrl+K):** Tìm đồng thời task + nhân viên + phòng ban, phân nhóm kết
  quả theo loại.
    - *Files:* `components/layout/global-search.tsx`, `components/search/global-search-input.tsx`, `app/api/search/global/route.ts`, `app/api/search/route.ts`
    - 📋 STATUS: Implemented global search wrapper component, grouped task/user/department result rendering,
      switched to /api/search/global with 300ms debounce and role-based task scope.

---

## Milestone 8: Báo cáo (F7)
*Mục tiêu: Báo cáo tháng/quý cho Trưởng phòng và BGĐ, export Excel.*

- [ ] **Báo cáo Tháng — Trưởng phòng:** Tóm tắt tổng task / hoàn thành / trễ hạn, KPI trung bình
  phòng và từng nhân viên, so sánh với tháng trước, highlight xuất sắc và cần cải thiện.
    - *Files:* `app/dashboard/reports/monthly/page.tsx`, `components/reports/monthly-report.tsx`,
      `app/api/reports/monthly/route.ts`

- [ ] **Báo cáo KPI Toàn công ty — BGĐ:** KPI trung bình từng phòng, xếp hạng phòng, biểu đồ so
  sánh, Top 5 nhân viên xuất sắc, tỷ lệ hoàn thành đúng hạn.
    - *Files:* `app/dashboard/reports/company/page.tsx`, `components/reports/company-kpi-report.tsx`,
      `app/api/reports/company-kpi/route.ts`

- [ ] **Báo cáo Tiến độ Task theo Tuần:** Task Done / In Progress / Pending theo tuần, tỷ lệ hoàn
  thành đúng hạn, so sánh tuần trước.
    - *Files:* `components/reports/weekly-progress-report.tsx`, `app/api/reports/weekly/route.ts`

- [ ] **Export Báo cáo ra Excel:** Nút export trên trang báo cáo, xuất theo bộ lọc hiện tại,
  format bảng với header, tên file tự động theo tháng/phòng.
    - *Files:* `lib/export/excel-report.ts`, `app/api/reports/export/route.ts`

> **Lược bỏ:** Phân tích nguyên nhân task trễ, Workload balancing, Báo cáo so sánh cùng kỳ
> năm ngoái, Báo cáo tự động gửi email, Cấu hình hệ thống (ngưỡng KPI, mức phạt, chu kỳ tính),
> Audit log toàn hệ thống, Backup/Restore, Tích hợp bên ngoài (Google Calendar, Zalo/Slack,
> REST API Swagger) — sẽ triển khai sau MVP.