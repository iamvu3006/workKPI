# PRD — WorkKPI: Hệ thống quản trị công việc và KPI nội bộ

## 1. Product Overview
**Vision:** Xây dựng một nền tảng quản trị tập trung giúp doanh nghiệp theo dõi tiến độ công việc, đo lường KPI cá nhân/phòng ban, đồng thời đảm bảo bảo mật và quản lý phân quyền chặt chẽ.

**Target Users:** Ban Giám đốc (xem báo cáo), Trưởng phòng (Giao việc, quản lý nhân sự trong phòng ban và KPI của phòng ban), Leader (Chia Task -> sub Task, quản lý nhân sự và KPI của team),Nhân viên (sử dụng hệ thống, cập nhật công việc), Quản trị viên hệ thống (Admin).

**Business Goal:** Số hóa và tự động hóa quy trình quản lý KPI và công việc, thay thế các công cụ phân tán (Excel, Zalo), giảm thiểu thời gian báo cáo và tăng tính minh bạch.

**Success Metrics:** 
- 100% nhân viên áp dụng hệ thống cho báo cáo tiến độ.
- Giảm thời gian tổng hợp báo cáo hàng tuần xuống dưới 15 phút.
- Đảm bảo uptime hệ thống và an toàn dữ liệu 99.9%.

## 2. User Personas
- **Người dùng (Nhân viên/Trưởng phòng):** Cần đăng nhập, quản lý hồ sơ, xem thư mục nhân viên, gia hạn phiên (session), cập nhật công việc.
- **Quản trị viên (Admin):** Cần công cụ quản lý toàn bộ vòng đời tài khoản người dùng, phòng ban, cấu hình bảo mật, thiết lập chính sách mật khẩu, và kiểm tra audit log.

## 3. Core Features
### F1: Authentication & Security [HIGH]
- Đăng nhập/Đăng xuất (Email & Password, Google SSO).
- Cơ chế bảo vệ: Khóa tài khoản sau 5 lần thử sai (15 phút), tự động hết hạn session sau 8h không hoạt động.
- Quản lý phiên: Theo dõi lịch sử đăng nhập (10 lần gần nhất), đóng phiên từ xa, 'Nhớ thiết bị' (30 ngày).
- Cảnh báo bảo mật: Email cảnh báo thiết bị lạ, thông báo khi đổi mật khẩu.
- *Acceptance criteria:* Auth flow mượt mà, session quản lý an toàn tuyệt đối, cơ chế chống brute-force chính xác thời gian.

### F2: User & Profile Management [HIGH]
- Hồ sơ: Cập nhật thông tin cơ bản, ảnh đại diện, đổi mật khẩu.
- Cài đặt cá nhân: Đổi ngôn ngữ, múi giờ, giao diện Dark/Light mode, ghi nhớ email đăng nhập.
- Tùy chỉnh: Cài đặt bộ lọc công việc mặc định, thiết lập hệ thống phím tắt (keyboard shortcuts).
- *Acceptance criteria:* Cập nhật realtime không cần reload trang toàn bộ, UI responsive, ảnh upload validate chuẩn dung lượng.

### F3: Administrator Control & Auditing [HIGH]
- Quản trị user: CRUD tài khoản, đặt lại mật khẩu, kích hoạt/vô hiệu hóa, tự động vô hiệu hóa account inactive > 90 ngày.
- Phân quyền & Phòng ban: Tạo/sửa phòng ban, hiển thị sơ đồ tổ chức, gán tài khoản với vai trò chính/phụ (Role-based access đa tầng).
- Audit & Policy: Nhật ký thay đổi tài khoản người dùng (> 12 tháng), thiết lập định dạng mật khẩu, whitelist IP, báo cáo bảo mật tự động mỗi thứ Hai.
- Import/Export: Nhập nhân viên mới hàng loạt qua Excel, xuất danh sách ra Excel.
- *Acceptance criteria:* Tính năng import chặn/cảnh báo từng dòng lỗi, admin log lưu được who/when/what chi tiết, policy áp dụng global lập tức.

### F4: Task & KPI Management [HIGH]
- Tính năng KPI (từ Badge thống kê): Điểm KPI TB 3 tháng, tỷ lệ hoàn thành, tổng task đã làm.
- Tự động thống kê % hoàn thành.
- *Acceptance criteria:* Tính toán dữ liệu chuẩn, tải nhanh với luồng dữ liệu lớn.

### F5: System & Onboarding [MEDIUM]
- Hệ thống thông báo bảo trì: Hiển thị banner countdown trước 24h, trang offline chuyên nghiệp.
- Tour hướng dẫn (Onboarding): Tour 5 bước với người dùng mới.
- Thư mục nhân viên: Danh sách email, sđt, tìm kiếm nội bộ.
- *Acceptance criteria:* Tour onboarding có thể Skip và Save state, email setup có logo/nhận diện công ty gửi thông tin đăng nhập tự động.

## 4. Non-Goals (QUAN TRỌNG cho AI)
- KHÔNG build real-time chat.
- KHÔNG tích hợp Jira/Trello trong phase này.
- KHÔNG có mobile app native — chỉ tối ưu web responsive (mobile web).

## 5. Constraints
- **Tech stack:** Node.js (Next.js App Router) + Supabase + Prisma.
- **Timeline:** 20 tuần (~5 tháng) chia thành nhiều sprint.
- **Team:** Tối ưu nguồn lực team nhỏ, yêu cầu code dễ bảo trì.