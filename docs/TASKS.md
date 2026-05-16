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

- [ ] **Schema User, Role, Department & Team:** Thiết kế các model phòng ban, team và quan hệ roles
  (DIRECTOR / MANAGER / LEADER / EMPLOYEE).
    - *Files:* `prisma/schema.prisma`

- [ ] **Bảng Quản trị Người dùng (Data Table):** Danh sách user với Sort, Pagination, Filter theo
  phòng ban / vai trò / trạng thái.
    - *Files:* `app/admin/users/page.tsx`, `components/admin/users-table.tsx`

- [ ] **CRUD User — Tạo & Chỉnh sửa:** Form tạo user mới (Họ tên, Email, Phòng ban, Vai trò),
  gửi email mời với mật khẩu tạm.
    - *Files:* `app/admin/users/new/page.tsx`, `components/admin/user-form.tsx`,
      `app/api/admin/users/route.ts`

- [ ] **Logic Vô hiệu hóa & Kích hoạt lại User:** API cập nhật status `DISABLED`/`ACTIVE`
  (không xóa cứng), nhập lý do bắt buộc khi vô hiệu hóa.
    - *Files:* `app/api/admin/users/[id]/status/route.ts`, `components/admin/user-row-actions.tsx`

- [ ] **Chuyển User sang Phòng ban khác:** API reassign, cảnh báo task đang làm ở phòng cũ.
    - *Files:* `app/api/admin/users/[id]/department/route.ts`

- [ ] **CRUD Phòng ban:** Tạo / sửa phòng ban, gán Trưởng phòng, validate tên không trùng.
    - *Files:* `app/admin/departments/page.tsx`, `components/admin/department-form.tsx`,
      `app/api/admin/departments/route.ts`

- [ ] **CRUD Team trong Phòng ban:** Tạo team, gán Leader, thêm/xóa thành viên, validate nhân viên
  chỉ thuộc 1 team/phòng.
    - *Files:* `app/admin/departments/[id]/teams/page.tsx`, `components/admin/team-form.tsx`,
      `app/api/admin/teams/route.ts`

> **Lược bỏ:** Import/Export Excel hàng loạt — sẽ triển khai sau MVP.

---

## Milestone 5: Task Management (F4)
*Mục tiêu: Tạo/giao task, Vòng đời trạng thái, Kanban Board, Sub-task, Comment.*

### 5A — Schema & API cốt lõi

- [ ] **Schema Task, Comment & Attachment:** Thiết kế model Task đầy đủ (assignees, weight, priority,
  deadline, status, tags), Comment (nested reply), file đính kèm.
    - *Files:* `prisma/schema.prisma`

- [ ] **API CRUD Task:** Tạo, sửa, xóa task. Validate tổng weight assignee không vượt 100%/tháng.
    - *Files:* `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`

- [ ] **API Chuyển trạng thái Task:** Logic state machine — chỉ cho phép chuyển theo luồng hợp lệ
  (To-Do → In Progress → Pending/Review → Done). RBAC: chỉ assignee hoặc người tạo.
    - *Files:* `app/api/tasks/[id]/status/route.ts`, `lib/tasks/permissions.ts`,
      `lib/tasks/state-machine.ts`

- [ ] **API Upload File đính kèm:** Upload lên Supabase Storage, giới hạn 10MB/file, 50MB/task.
    - *Files:* `app/api/tasks/[id]/attachments/route.ts`

### 5B — Giao diện Task

- [ ] **Form Tạo & Chỉnh sửa Task:** Tiêu đề, mô tả (rich text), deadline picker, assignee selector,
  weight dropdown (5/10/20/30/35%), priority (4 mức), tag.
    - *Files:* `components/tasks/task-form.tsx`, `components/tasks/weight-selector.tsx`

- [ ] **Kanban Board:** 5 cột (To-Do / In Progress / Pending / Review / Done), kéo thả đổi trạng
  thái, màu theo priority, counter mỗi cột, lọc theo assignee.
    - *Files:* `app/dashboard/tasks/page.tsx`, `components/tasks/kanban-board.tsx`,
      `components/tasks/task-card.tsx`

- [ ] **List View Task (Trưởng phòng):** Bảng tổng quan toàn phòng, sort/filter theo nhân viên /
  trạng thái / tháng / priority, highlight task overdue màu đỏ.
    - *Files:* `app/dashboard/tasks/list/page.tsx`, `components/tasks/task-table.tsx`

- [ ] **Trang Chi tiết Task:** Hiển thị đầy đủ thông tin, lịch sử thay đổi (audit trail), file
  đính kèm, luồng trạng thái hiện tại.
    - *Files:* `app/dashboard/tasks/[id]/page.tsx`, `components/tasks/task-detail.tsx`

- [ ] **Widget Thanh Weight Nhân viên:** Thanh tiến trình 0–100% tổng weight đã gán trong tháng,
  cảnh báo màu khi > 80% và > 100%.
    - *Files:* `components/tasks/weight-progress-bar.tsx`

### 5C — Tương tác & cộng tác

- [ ] **Comment & Nested Reply:** Ô nhập comment, trả lời từng comment, chỉnh sửa/xóa comment
  của mình, đánh dấu "Đã giải quyết".
    - *Files:* `components/tasks/comment-section.tsx`, `app/api/tasks/[id]/comments/route.ts`

- [ ] **@Mention trong Comment:** Gõ `@` gợi ý danh sách thành viên, highlight @mention, lọc
  comment có mention mình.
    - *Files:* `components/tasks/mention-input.tsx`

- [ ] **Checklist trong Task:** Thêm/xóa checklist items, tick hoàn thành, % tiến độ tự cập nhật
  theo tỷ lệ items đã tick, chặn chuyển sang Review khi còn item chưa tick.
    - *Files:* `components/tasks/checklist.tsx`, `app/api/tasks/[id]/checklist/route.ts`

- [ ] **Sub-task:** Tạo sub-task từ task cha, gán assignee + deadline, % task cha = trung bình %
  sub-tasks, hiển thị dạng cây.
    - *Files:* `components/tasks/subtask-list.tsx`, `app/api/tasks/[id]/subtasks/route.ts`

- [ ] **Từ chối Task & Yêu cầu Gia hạn Deadline:** Nút "Từ chối" kèm lý do bắt buộc (≥ 20 ký tự),
  nút "Yêu cầu gia hạn" kèm ngày đề xuất, Trưởng phòng nhận thông báo trong web để xét duyệt.
    - *Files:* `components/tasks/task-actions.tsx`, `app/api/tasks/[id]/reject/route.ts`,
      `app/api/tasks/[id]/extend/route.ts`

---

## Milestone 6: Nghiệm thu & Tính KPI (F5)
*Mục tiêu: Luồng nộp nghiệm thu, chấm điểm, tính KPI tự động theo tháng.*

### 6A — Nghiệm thu Task

- [ ] **Luồng Nộp Nghiệm thu:** Nút "Nộp nghiệm thu", bắt buộc đính kèm bằng chứng + tóm tắt kết
  quả, chuyển task sang trạng thái Review.
    - *Files:* `components/tasks/submit-review-form.tsx`, `app/api/tasks/[id]/submit-review/route.ts`

- [ ] **Form Chấm điểm Nghiệm thu (Trưởng phòng):** Nhập điểm chất lượng 0–100, xem bằng chứng và
  lịch sử tiến độ, nhập nhận xét, nút Duyệt / Trả lại.
    - *Files:* `components/tasks/review-form.tsx`, `app/api/tasks/[id]/review/route.ts`

- [ ] **Logic Phạt Overdue tự động:** Tính số ngày trễ từ deadline → ngày nộp Review.
  `Điểm sau phạt = max(0, điểm_gốc − 10% × số_ngày_trễ)`. Hiển thị chi tiết phạt trong form
  nghiệm thu.
    - *Files:* `lib/kpi/overdue-penalty.ts`

- [ ] **Tự đánh giá trước khi nộp:** Form tự đánh giá (thang 1–5 cho từng tiêu chí, nhận xét bắt
  buộc) hiển thị cho Trưởng phòng khi nghiệm thu.
    - *Files:* `components/tasks/self-assessment-form.tsx`

- [ ] **Phê duyệt hàng loạt Review:** Checkbox chọn nhiều task Review, bulk approve với điểm mặc
  định, xác nhận trước khi áp dụng.
    - *Files:* `components/tasks/bulk-review-actions.tsx`, `app/api/tasks/bulk-review/route.ts`

### 6B — Tính KPI

- [ ] **Schema KPI Record:** Model lưu kết quả KPI tháng: điểm từng task, tổng điểm, xếp loại,
  tháng/năm, userId.
    - *Files:* `prisma/schema.prisma`

- [ ] **Hàm Tính KPI Core:** `KPI = Σ(% hoàn thành × điểm CL × trọng số)`, xử lý task Cancelled
  (không tính), trả về object chi tiết từng task đóng góp bao nhiêu điểm.
    - *Files:* `lib/kpi/calculator.ts`

- [ ] **API Trigger Tính KPI tháng:** Endpoint tính KPI cho toàn bộ nhân viên của 1 tháng (chạy
  thủ công từ admin, sau MVP sẽ tự động hóa bằng cron). Lưu kết quả vào DB.
    - *Files:* `app/api/admin/kpi/calculate/route.ts`

- [ ] **Trang KPI Cá nhân (Nhân viên):** Điểm tổng, xếp loại (Xuất sắc/Tốt/Đạt/Cần cải thiện),
  bảng chi tiết đóng góp từng task, biểu đồ xu hướng 6 tháng (Recharts).
    - *Files:* `app/dashboard/kpi/page.tsx`, `components/kpi/kpi-personal-card.tsx`,
      `components/kpi/kpi-trend-chart.tsx`, `app/api/kpi/me/route.ts`

- [ ] **Trang KPI Phòng ban (Trưởng phòng):** Bảng xếp hạng tất cả nhân viên trong phòng (STT,
  Tên, Điểm, Xếp loại), biểu đồ cột so sánh, lọc theo tháng.
    - *Files:* `app/dashboard/kpi/department/page.tsx`, `components/kpi/kpi-department-table.tsx`,
      `app/api/kpi/department/route.ts`

- [ ] **KPI Ước tính Real-time:** Tính KPI dự phóng dựa trên task đã Done + task đang làm tính theo
  % tiến độ hiện tại. Label rõ "Ước tính — chưa chính thức". Cập nhật khi có thay đổi.
    - *Files:* `components/kpi/kpi-estimate-widget.tsx`, `app/api/kpi/estimate/route.ts`

> **Lược bỏ:** Snapshot KPI bất biến, Khiếu nại KPI, Export PDF KPI cá nhân, KPI năm
> — sẽ triển khai sau MVP.

---

## Milestone 7: Dashboard & Thông báo trong Web (F6)
*Mục tiêu: Dashboard theo vai trò, Thông báo in-app, Tìm kiếm & lọc nâng cao.*

### 7A — Dashboard

- [ ] **Dashboard Nhân viên:** Widget task đang làm / đến hạn hôm nay / overdue, KPI ước tính
  tháng hiện tại, Top 5 task cần xử lý gấp, biểu đồ tròn tỷ lệ task theo trạng thái.
    - *Files:* `app/dashboard/page.tsx`, `components/dashboard/employee-dashboard.tsx`

- [ ] **Dashboard Trưởng phòng:** Widget tổng task theo trạng thái toàn phòng, KPI trung bình
  phòng, danh sách nhân viên kèm task overdue + KPI tháng, cảnh báo KPI thấp nổi bật.
    - *Files:* `components/dashboard/manager-dashboard.tsx`

- [ ] **Dashboard Leader:** Dữ liệu giới hạn trong team, widget task team theo trạng thái,
  KPI trung bình team, bảng thành viên kèm task đang làm + overdue.
    - *Files:* `components/dashboard/leader-dashboard.tsx`

- [ ] **Dashboard BGĐ:** KPI trung bình toàn công ty, biểu đồ cột KPI từng phòng, Top nhân viên
  xuất sắc và cần cải thiện, tỷ lệ task hoàn thành đúng hạn.
    - *Files:* `components/dashboard/director-dashboard.tsx`

- [ ] **Widget Countdown Deadline:** Đếm ngược đến deadline task gần nhất (xanh → vàng ≤ 3 ngày
  → đỏ ≤ 1 ngày), top 3 task sắp đến hạn.
    - *Files:* `components/dashboard/deadline-countdown.tsx`

- [ ] **Widget Dự báo KPI cuối tháng:** 3 kịch bản bi quan/bình thường/lạc quan, gợi ý task
  nên ưu tiên, cập nhật mỗi giờ.
    - *Files:* `components/dashboard/kpi-forecast-widget.tsx`

### 7B — Thông báo trong Web

- [ ] **Schema & API Thông báo:** Model Notification (userId, type, message, isRead, link),
  API tạo và lấy danh sách thông báo.
    - *Files:* `prisma/schema.prisma`, `app/api/notifications/route.ts`

- [ ] **Bell Icon & Dropdown Thông báo:** Badge số chưa đọc, dropdown 10 thông báo gần nhất,
  click → mở task tương ứng, đánh dấu đã đọc từng thông báo / tất cả.
    - *Files:* `components/layout/notification-bell.tsx`

- [ ] **Trigger Thông báo cho các sự kiện chính:** Gửi thông báo in-app khi: được giao task mới,
  task sắp hạn (3 ngày + 1 ngày), task bị trả lại, nhân viên báo Pending, Trưởng phòng cần
  xét duyệt nghiệm thu.
    - *Files:* `lib/notifications/triggers.ts`

- [ ] **Trang Lịch sử Thông báo:** Danh sách đầy đủ, lọc theo đã đọc/chưa đọc và loại thông báo,
  giữ lịch sử 90 ngày.
    - *Files:* `app/dashboard/notifications/page.tsx`

- [ ] **Cài đặt Loại Thông báo:** Bật/tắt từng loại thông báo (Task / KPI / Hệ thống), cài đặt
  giờ "Không làm phiền".
    - *Files:* `components/profile/notification-settings.tsx`,
      `app/api/users/me/notification-settings/route.ts`

> **Lược bỏ:** Thông báo qua email, Push notification trình duyệt, Cảnh báo tự động KPI thấp /
> task Pending / workload quá tải — sẽ triển khai sau MVP.

### 7C — Tìm kiếm & Lọc

- [ ] **Tìm kiếm Task theo Từ khóa:** Real-time khi gõ ≥ 3 ký tự, tìm trong tiêu đề + mô tả,
  highlight từ khóa trong kết quả.
    - *Files:* `components/tasks/task-search.tsx`, `app/api/tasks/search/route.ts`

- [ ] **Bộ lọc Nâng cao Task:** Lọc đa điều kiện (trạng thái, assignee, deadline, priority, tag),
  lưu bộ lọc yêu thích.
    - *Files:* `components/tasks/task-filter.tsx`

- [ ] **Tìm kiếm Toàn cục (Ctrl+K):** Tìm đồng thời task + nhân viên + phòng ban, phân nhóm kết
  quả theo loại.
    - *Files:* `components/layout/global-search.tsx`

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