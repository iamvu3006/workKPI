# SPEC: User & Profile Management (F2)

## User Flow
1. **Thông tin cá nhân:** User vào `/profile` -> Xem badge KPI (tổng task, điểm số) -> Vào chỉnh sửa thông tin (SĐT, tên hiển thị). Không được tự sửa email/phòng ban.
2. **Cập nhật Avatar:** User kéo thả ảnh -> Kéo crop ảnh -> Upload (validate <2MB, png/jpg/gif) -> Tự động cập nhật không cần load lại trang. Xóa Avatar trở về ảnh mặc định (Chữ cái đầu + màu ngẫu nhiên).
3. **Đổi mật khẩu:** Yêu cầu mật khẩu cũ hợp lệ -> Nhập mật khẩu mới -> Thanh báo độ mạnh Password Weak/Strong -> Confirm -> Gửi thông báo Email bảo mật.
4. **Cài đặt hiển thị:** Chọn Ngôn ngữ (VI/EN), Múi giờ, Dark / Light mode -> State lưu vào database user profile để đồng bộ đa thiết bị. Tùy chỉnh Phím tắt & Default Filter cho trang Task.

## Business Rules
- **Avatar Validation:** Kích thước file < 2MB. Format PNG, JPG/JPEG, GIF. File không hợp chuẩn sẽ bị frontend chặn từ trước khi gọi API.
- **Ràng buộc trường cập nhật:** Các trường như `Email`, `Department`, `Role`, `Join Date` ở trạng thái READ-ONLY với người dùng thông thường, phải do HR/Admin cập nhật.
- **Thanh báo sức mạnh mật khẩu:** Yêu cầu check realtime khi user gõ, dựa trên regex policy của app bảo mật. Không cho phép submit nếu mức độ chưa đạt yêu cầu tối thiểu.
- **Badge thống kê KPI:** Bộ đếm chỉ tính số liệu trong 3 tháng gần nhất hoặc thời gian thực tuỳ logic, dữ liệu cache nếu cần để load nhanh.

## Edge Cases
- Cập nhật avatar cùng lúc trên 2 thiết bị khác nhau -> Thiết bị cập nhật sau đè lên trước, nếu load lại trang thì cập nhật ảnh mới nhất.
- Đổi Dark/Light mode giữa chừng -> Mọi trang đều phải subscribe chung một theme provider, giật chớp flash trong quá trình theme load phải được khắc phục bằng next-themes nội tại.
- Thao tác xóa ảnh đại diện khi đang sử dụng mạng chập chờn -> Trạng thái loading, tránh click đúp.

## API Contract
- `PATCH /api/users/me/profile` -> Nhận `{ displayName, phone }`
- `POST /api/users/me/avatar` -> Nhận file, trả về `{ avatarUrl }`
- `DELETE /api/users/me/avatar` -> Xoá URL trong DB, trả về default config.
- `PATCH /api/users/me/settings` -> `{ theme: 'dark', language: 'vi', timezone: 'Asia/Ho_Chi_Minh', defaultTaskFilter: 'none' }`

## DO NOT
- KHÔNG render mật khẩu cũ dưới client vì bất kỳ lý do gì.
- KHÔNG load toàn bộ danh sách nhân viên 1 lúc cho màn hình "Thư mục nhân viên" nếu số lượng vượt quá 200, luôn có cơ chế Server-side Pagination/Search.
- KHÔNG sử dụng cache vĩnh viễn với Avatar (đính kém token random vào Avatar URL để auto-refresh sau khi thay đổi).