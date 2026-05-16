# SPEC: User & Profile Management (F2)

> **MVP Scope:** Xem/sửa thông tin cá nhân, Upload avatar, Đổi mật khẩu, Cài đặt hiển thị
> (theme, ngôn ngữ, múi giờ).
>
> **Ngoài MVP (triển khai sau):** Thư mục nhân viên toàn công ty, Sơ đồ tổ chức, Badge huy hiệu
> gamification, Lộ trình phát triển cá nhân.

---

## User Flow

1. **Thông tin cá nhân:** User vào `/profile` → xem badge thống kê (tổng task hoàn thành, điểm
   KPI trung bình 3 tháng, tỷ lệ đúng hạn) → vào chỉnh sửa thông tin (SĐT, tên hiển thị).
   Không được tự sửa email/phòng ban/vai trò.
2. **Cập nhật Avatar:** User kéo thả hoặc chọn ảnh → preview → upload (validate < 2MB,
   PNG/JPG/GIF) → avatar cập nhật ngay không cần reload trang. Xóa avatar → trở về ảnh mặc định
   (chữ cái đầu tên + màu ngẫu nhiên cố định theo userId).
3. **Đổi mật khẩu:** Nhập mật khẩu cũ để xác nhận → nhập mật khẩu mới (thanh báo độ mạnh
   realtime) → confirm → lưu. Không gửi email thông báo trong MVP.
4. **Cài đặt hiển thị:** Chọn Ngôn ngữ (VI/EN), Múi giờ, Dark/Light mode → lưu vào DB để đồng
   bộ đa thiết bị. Thay đổi áp dụng ngay lập tức không cần reload.

---

## Business Rules

- **Avatar Validation:** Kích thước < 2MB. Format PNG, JPG/JPEG, GIF. Frontend chặn file không
  hợp lệ trước khi gọi API. Avatar URL phải đính kèm cache-busting token sau mỗi lần cập nhật
  (tránh browser cache ảnh cũ).
- **Trường READ-ONLY với user thường:** `email`, `department`, `role`, `joinDate` — chỉ Admin
  được sửa. Form render các trường này ở trạng thái disabled, không có nút edit.
- **Password Strength:** Kiểm tra realtime khi user gõ bằng regex. Không cho submit nếu chưa đạt
  mức tối thiểu (ít nhất: 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số). Hiện checklist yêu cầu
  ngay dưới input.
- **Badge thống kê KPI:** Tính trong 3 tháng gần nhất. Cache kết quả để load nhanh, invalidate
  khi KPI tháng mới được tính.
- **Màu avatar mặc định:** Sinh từ hash của `userId` để cùng một user luôn ra cùng một màu,
  không random mỗi lần render.

---

## Edge Cases

- **Cập nhật avatar đồng thời trên 2 thiết bị:** Last-write-wins — thiết bị cập nhật sau đè lên.
  Reload trang hiển thị ảnh mới nhất.
- **Đổi theme giữa chừng:** Mọi trang phải subscribe cùng một theme provider (`next-themes`).
  Ngăn flash khi load bằng cách inject class theme vào `<html>` trước khi render (`suppressHydrationWarning`).
- **Xóa avatar trên mạng chập chờn:** Hiện loading state, disable nút xóa trong khi đang xử lý
  để tránh double submit. Nếu request timeout → giữ nguyên avatar cũ, hiện thông báo lỗi.
- **Mật khẩu cũ sai khi đổi mật khẩu:** Trả về lỗi cụ thể "Mật khẩu hiện tại không đúng" (khác
  với lỗi đăng nhập — ở đây đã authenticated nên có thể báo cụ thể).

---

## API Contract

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/users/me/profile` | — | `{ displayName, phone, email, department, role, avatarUrl, joinDate, stats }` |
| PATCH | `/api/users/me/profile` | `{ displayName, phone }` | `{ displayName, phone }` |
| POST | `/api/users/me/avatar` | `FormData { file }` | `{ avatarUrl }` |
| DELETE | `/api/users/me/avatar` | — | `{ avatarUrl: null }` |
| POST | `/api/users/me/password` | `{ currentPassword, newPassword }` | `{ success: true }` |
| PATCH | `/api/users/me/settings` | `{ theme, language, timezone }` | `{ theme, language, timezone }` |

`stats` trong GET profile trả về: `{ tasksCompleted, avgKpiScore, onTimeRate, daysActive }` —
tính trong 3 tháng gần nhất, có thể cache 1 giờ.

---

## DO NOT

- **KHÔNG** render mật khẩu cũ hay mới ở bất kỳ dạng nào dưới client.
- **KHÔNG** dùng avatar URL tĩnh không có cache-busting — luôn append `?v={timestamp}` sau
  khi upload/xóa.
- **KHÔNG** load toàn bộ danh sách nhân viên một lúc nếu vượt 200 records — luôn dùng
  server-side pagination + search (áp dụng cho màn hình chọn assignee khi tạo Task).
- **KHÔNG** lưu theme preference chỉ ở localStorage — phải đồng bộ lên DB để đa thiết bị.