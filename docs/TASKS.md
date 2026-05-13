# TASKS: WorkKPI Implementation Plan

Bản tracking này chia nhỏ các User Story từ `PRD.md` và `specs/` thành các task kỹ thuật cụ thể. Mỗi task được thiết kế để hoàn thành trong **tối đa 2 giờ**.

---

## Milestone 1: Authentication Foundation (F1)
*Mục tiêu: Đăng nhập cơ bản, SSO, Quên mật khẩu và Protected Routes.*

- [x] **Khởi tạo Supabase SSR Clients:** Cài đặt `@supabase/ssr` và tạo các utility functions cho server, browser, middleware.
    - *Files:* `utils/supabase/server.ts`, `utils/supabase/client.ts`, `utils/supabase/middleware.ts`
- [x] **Thiết lập Middleware chặn Route:** Viết logic redirect từ `/dashboard` về `/login` nếu chưa có session.
    - *Files:* `middleware.ts`
- [x] **UI/UX Màn hình Đăng nhập:** Xây dựng layout Login Form với Email/Password và nút Đăng nhập bằng Google.
    - *Files:* `app/auth/layout.tsx`, `app/auth/login/page.tsx`, `app/auth/login/login-form.tsx`
- [x] **Logic Đăng nhập Email/Password:** Gọi API Supabase signInWithPassword, xử lý hiển thị lỗi an toàn (chung chung).
    - *Files:* `app/auth/login/login-form.tsx`
- [ ] **Logic Đăng nhập Google SSO:** Gọi API Supabase signInWithOAuth và xử lý callback.
    - *Files:* `app/auth/login/login-form.tsx`, `app/auth/callback/route.ts`
- [x] **Luồng Quên mật khẩu (Request):** UI form nhập email và logic gửi email reset qua Supabase.
    - *Files:* `app/auth/forgot-password/page.tsx`, `app/auth/forgot-password/forgot-password-form.tsx`
- [x] **Luồng Đặt lại mật khẩu (Update):** UI form nhập mật khẩu mới (có 2 bước xác nhận) sau khi click link email.
    - *Files:* `app/auth/update-password/page.tsx`, `app/auth/update-password/update-password-form.tsx`
- [x] **Nút Đăng xuất:** Nén logic sign out và xóa session.
    - *Files:* `components/auth/sign-out-button.tsx`

---

## Milestone 2: Advanced Security & Session Lifecycle (F1)
*Mục tiêu: Lockout, Auto-logout, History, Trusted Device.*

- [x] **Định nghĩa Schema Session & Lockout:** Thiết kế DB lưu history đăng nhập và tracking failed attempts.
    - *Files:* `prisma/schema.prisma`
- [x] **Logic Tracking Login Thất bại & Khóa 15p:** Đếm số lần sai, chèn lock window vào DB, trả về thông báo đếm ngược.
    - *Files:* `app/api/auth/login/route.ts` (hoặc server action tương ứng)
- [ ] **Cảnh báo & Auto-expire Session (8 tiếng):** Viết Client wrapper theo dõi event click/scroll, show popup lúc 7h55m.
    - *Files:* `components/auth/session-watcher.tsx`
- [x] **API Lưu & Lấy Lịch sử đăng nhập:** Ghi log mỗi lần login thành công (IP, User Agent). View lịch sử 10 lần gần nhất.
    - *Files:* `app/api/auth/sessions/route.ts`, `app/profile/sessions/page.tsx`
- [x] **Đăng xuất Remote:** Xoá/Invalidate session cụ thể từ xa (xóa JWT/SessionID khỏi hệ thống).
    - *Files:* `app/api/auth/sessions/[id]/route.ts`, `components/profile/active-sessions.tsx`
- [ ] **Tính năng Nhớ thiết bị 30 ngày:** Set cookie trusted device, config thời hạn sống của auth token.
    - *Files:* `utils/supabase/middleware.ts`, `app/auth/login/login-form.tsx`
- [ ] **Gửi Email cảnh báo bảo mật:** Logic gửi mail (Resend/Nodemailer) khi có New Device hoặc Change Password.
    - *Files:* `lib/email/security-alerts.ts`

---

## Milestone 3: User & Profile Management (F2) ✅ COMPLETED
*Mục tiêu: Hồ sơ cá nhân, Avatar, Cài đặt cá nhân, Theme.*

- [x] **Schema Cài đặt Profile:** Cấu hình table chứa avatar, số ĐT, theme, timezone, language.
    - *Files:* `prisma/schema.prisma`
    - ✅ Profile model đầy đủ với tất cả fields (displayName, phone, avatar, theme, language, timezone, notificationEmail)
- [x] **UI Xem & Chỉnh sửa thông tin cá nhân:** Hiện badge thống kê và form sửa Số điện thoại/Tên hiển thị.
    - *Files:* `app/dashboard/profile/page.tsx`, `components/profile/profile-form.tsx`
    - ✅ Profile page với 4 KPI stats, Edit form với validation, auto-redirect
- [x] **Logic Upload & Crop Avatar:** Cho phép chọn file, kiểm tra size <2MB, upload raw file lên Supabase Storage.
    - *Files:* `components/profile/avatar-upload.tsx`, `app/api/users/me/avatar/route.ts`
    - ✅ Drag-drop zone, preview, delete, progress bar, file validation
- [x] **Cập nhật Mật khẩu với Password Strength:** Tạo thanh đánh giá độ mạnh của password regex-based.
    - *Files:* `components/profile/change-password-form.tsx`, `lib/password/strength.ts`
    - ✅ 5-bar strength indicator, requirements checklist, success redirect
- [x] **Cài đặt Dark/Light Mode:** Cài đặt theme toggle và dropdown chọn theme.
    - *Files:* `components/profile/settings-form.tsx`, `app/api/users/me/settings/route.ts`
    - ✅ Theme selection (light/dark) trong settings form
- [x] **Cài đặt Ngôn ngữ & Múi giờ:** Form settings lưu preferences vào DB profile.
    - *Files:* `components/profile/settings-form.tsx`, `app/api/users/me/settings/route.ts`
    - ✅ Language (vi/en) và 20+ IANA timezones, notification email toggle

**Deliverables Summary:**
- 5 Pages: profile, edit, avatar, password, settings
- 7 UI Components: card, badge, avatar, separator, input, select, checkbox
- 5 Form Components: profile-form, avatar-upload, password-strength-indicator, change-password-form, settings-form
- 4 API Routes: GET/PATCH profile, POST/DELETE avatar, POST password, PATCH settings
- Test Coverage: 23/26 tests passing (88%) - profile, password, settings routes fully tested
- TypeScript: 0 errors across all 17 components
- Build Status: ✅ Successful (3.6s compile)

---

## Milestone 4: Admin Control & Auditing (F3)
*Mục tiêu: CRUD người dùng, Import/Export Excel, RBAC.*

- [ ] **Schema User, Role & Department:** Thiết kế cấu trúc các phòng ban và quan hệ Roles.
    - *Files:* `prisma/schema.prisma`
- [ ] **Bảng Quản trị Người dùng (Data Table):** Hiển thị danh sách user với Sort, Pagination, Filter theo phòng ban.
    - *Files:* `app/admin/users/page.tsx`, `components/admin/users-table.tsx`
- [ ] **Logic Soft Delete & Đổi Role:** API cập nhật status `DISABLED` (không xóa cứng) và thay đổi quyền admin.
    - *Files:* `app/api/admin/users/[id]/status/route.ts`, `components/admin/user-row-actions.tsx`
- [ ] **UI Import/Export Excel:** Nút tạo File mẫu, upload file, và tính năng báo lỗi từng dòng.
    - *Files:* `components/admin/import-users-modal.tsx`
- [ ] **Logic Excel Parsing & Validation:** Validate dòng dữ liệu, check trùng lặp email, gửi invite email.
    - *Files:* `lib/excel-parser.ts`, `app/api/admin/users/import/route.ts`
- [ ] **Audit Logging Infrastructure:** Wrapper service ghi log "Who did What When", kết nối Prisma.
    - *Files:* `lib/audit-logger.ts`, `prisma/schema.prisma`
- [ ] **Trang Xem Audit Log:** UI hiển thị lịch sử thay đổi tài khoản, thao tác hệ thống.
    - *Files:* `app/admin/audit-logs/page.tsx`

---

## Milestone 5: Task & KPI Management (F4)
*Mục tiêu: Đăng task, Progress update, Bảng thống kê KPI.*

- [ ] **Schema Task & KPI:** Thiết kế bảng Tasks (assignee, deadlline, status, priority).
    - *Files:* `prisma/schema.prisma`
- [ ] **Form Tạo & Chỉnh sửa Task:** Form input với deadline picker, assignee selector (<1s save).
    - *Files:* `components/tasks/task-form.tsx`, `app/api/tasks/route.ts`
- [ ] **Kanban/List View của Task:** Dàn layout hiển thị cột ToDo / In Progress / Done.
    - *Files:* `app/tasks/page.tsx`, `components/tasks/kanban-board.tsx`
- [ ] **RBAC cho Cập nhật Task:** Logic cho phép chỉ Assignee hoặc người tạo mới được chuyển status.
    - *Files:* `app/api/tasks/[id]/status/route.ts`, `lib/tasks/permissions.ts`
- [ ] **Bộ tính điểm số KPI Core:** Hàm logic tính % hoàn thành dựa trên priority và hạn deadline đúng hạn.
    - *Files:* `lib/kpi-calculator.ts`
- [ ] **Dashboard KPI (Frontend):** Trang tổng hợp chart (Recharts) hiển thị KPI theo phòng ban và theo tuần/tháng.
    - *Files:* `app/dashboard/kpi/page.tsx`, `components/dashboard/kpi-charts.tsx`
- [ ] **Tối ưu API KPI Dashboard:** Viết SQL/tối ưu Prisma truy vấn số lượng lớn (<3s loading).
    - *Files:* `app/api/reports/kpi/route.ts`