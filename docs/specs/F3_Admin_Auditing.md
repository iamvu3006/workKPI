# SPEC: Administrator Control & Auditing (F3)

## User Flow
1. **Quản lý Danh sách (User Management):** Admin truy cập `/admin/users` -> Xem danh sách (phân trang/lọc) -> Xem chi tiết tài khoản -> Thực hiện cập nhật (đổi role, khóa, reset mật khẩu).
2. **Import hàng loạt:** Admin tải template Excel -> Điền data -> Upload file -> Hệ thống báo lỗi từng dòng nếu có -> Xác nhận Import -> Gửi email cấp MK tạm tới từng user.
3. **Quản lý Roles & Phòng ban:** Admin tạo phòng ban -> Assign Trưởng phòng. Cấu hình Vai trò chính/phụ cho tài khoản.
4. **Audit Log & Policy:** Xem log hoạt động cấu hình. Chỉnh sửa Security Policy (Độ dài MK, yêu cầu ký tự). Xem báo cáo bảo mật hàng tuần.

## Business Rules
- **Disable Accounts:** Không bao giờ xóa cứng (hard delete) một tài khoản. Chỉ chuyển status sang `Disabled`. Điều này đảm bảo liên kết dữ liệu Task/KPI không bị mồ côi (orphan).
- **Auto-Disable:** Các tài khoản không có tương tác login/hoạt động > 90 ngày sẽ được hệ thống chạy cron/job tự động đánh dấu disable.
- **Import Validation:** Email phải chưa tồn tại. Phải thuộc các phòng ban có sẵn trong hệ thống.
- **Chính sách mật khẩu:** Cấu hình chuẩn mặc định: Min 8, đủ chữ Hoa/Thường/Số/Ký tự đặc biệt. Áp dụng ngay khi user change password lần sau.

## Edge Cases
- Admin tìm cách khóa (deactivate) chính account của mình -> Chặn, hiển thị lỗi.
- File import Excel có 500 dòng, trong đó dòng 252 bị trùng email -> Hệ thống lưu 499 dòng thành công và trả về file lỗi dòng 252 (hoặc rollback toàn bộ tùy quyết định - Recommend: Partial success with error report).
- Thay đổi phòng ban của một user đang là Trưởng phòng sang bộ phận khác -> Cảnh báo cần assign trưởng phòng thay thế trước khi lưu.

## API Contract
- `GET /api/admin/users?page=1&limit=50&role=...` -> `[ { id, email, fullName, department, status, roles } ]`
- `POST /api/admin/users/import` -> `Content-Type: multipart/form-data` -> Response `[{ status: 'success', row: 1 }, { status: 'error', row: 2, message: 'Email existed' }]`
- `PATCH /api/admin/users/:uid/status` -> `{ status: "DISABLED", reason: "Nghỉ việc" }`
- `GET /api/admin/audit-logs` -> trả về danh sách lịch sử thao tác.

## DO NOT
- KHÔNG Hard-delete thông tin user bằng bất cứ giá nào.
- KHÔNG cho phép Admin xem mật khẩu của người dùng, kể cả mật khẩu tạm (chỉ cấp 1 lần qua email).
- KHÔNG áp dụng Security Policy retroactive với các session đang online (chỉ áp dụng lúc authentication hoặc đổi mật khẩu).