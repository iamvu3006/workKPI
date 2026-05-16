# SPEC: Administrator Control (F3)

> **MVP Scope:** CRUD người dùng, Quản lý phòng ban, Quản lý Team, RBAC theo vai trò.
>
> **Ngoài MVP (triển khai sau):** Import/Export Excel hàng loạt, Audit Log toàn hệ thống,
> Cấu hình Security Policy (độ dài MK, yêu cầu ký tự), Auto-disable tài khoản inactive 90 ngày,
> Báo cáo bảo mật hàng tuần.

---

## User Flow

### 1. Quản lý Người dùng
Admin vào `/admin/users` → xem danh sách (phân trang, lọc theo phòng ban / vai trò / trạng thái)
→ tạo user mới (Họ tên, Email, Phòng ban, Vai trò, Mật khẩu tạm) → hệ thống gửi email mời kèm
thông tin đăng nhập → user phải đổi mật khẩu ở lần đầu tiên.

Từ trang chi tiết user: đổi vai trò, vô hiệu hóa (nhập lý do bắt buộc), kích hoạt lại,
reset mật khẩu (gửi link email, không tự đặt mật khẩu thủ công).

### 2. Chuyển Phòng ban
Admin chọn user → "Chuyển phòng ban" → chọn phòng đích → hệ thống cảnh báo nếu user đang có
task chưa hoàn thành ở phòng cũ → admin chọn xử lý task: giữ nguyên assignee hoặc reassign →
xác nhận → user tự động rời team cũ.

Nếu user đang là **Trưởng phòng**: hệ thống chặn, yêu cầu assign Trưởng phòng thay thế trước.

### 3. Quản lý Phòng ban
Admin vào `/admin/departments` → tạo phòng ban (Tên, Mã phòng, Mô tả, Trưởng phòng) → validate
tên không trùng → hiển thị trong sơ đồ tổ chức. Sửa: cập nhật thông tin, thay đổi Trưởng phòng
(Trưởng phòng cũ chuyển về vai trò Nhân viên). Xóa: chỉ được khi phòng không còn nhân viên
và không có task đang hoạt động.

### 4. Quản lý Team
Trưởng phòng vào trang phòng ban → tạo Team (Tên, Mô tả, Leader) → thêm thành viên từ danh
sách nhân viên trong phòng → một nhân viên chỉ thuộc 1 team trong 1 phòng.

Thay đổi Leader: chọn Leader mới từ thành viên team → Leader cũ chuyển về vai trò Nhân viên
→ Leader mới nhận quyền.

---

## Business Rules

- **Soft Delete bắt buộc:** Không bao giờ hard-delete tài khoản. Chỉ đổi status sang `DISABLED`.
  Mọi liên kết Task/KPI/Comment giữ nguyên, tránh orphan data.
- **Phân cấp vai trò:** `DIRECTOR` > `MANAGER` (Trưởng phòng) > `LEADER` > `EMPLOYEE`.
  Mỗi user có 1 vai trò chính. Admin hệ thống là role riêng (`ADMIN`), không tham gia vào
  cấu trúc phòng ban.
- **Tự vô hiệu hóa:** Admin không thể vô hiệu hóa chính tài khoản đang đăng nhập → chặn ở
  API, hiện thông báo lỗi.
- **Xóa phòng ban:** Phòng có nhân viên hoặc task đang hoạt động → không cho xóa, hiện danh
  sách phụ thuộc cụ thể.
- **Đổi Trưởng phòng:** Khi assign Trưởng phòng mới → Trưởng phòng cũ tự động hạ về `EMPLOYEE`
  trong phòng đó. Phải xác nhận trước khi lưu.
- **Mật khẩu tạm:** Chỉ cấp qua email, không hiển thị trong UI dù là Admin. User bắt buộc đổi
  mật khẩu tại lần đăng nhập đầu tiên (`forcePasswordChange: true`).
- **Reset mật khẩu bởi Admin:** Gửi email link reset cho user, không tự set mật khẩu thủ công.

---

## Edge Cases

- **Vô hiệu hóa user đang có task chưa xong:** Task giữ nguyên trạng thái, Manager nhận thông
  báo in-app "Nhân viên [tên] đã bị vô hiệu hóa, có [N] task cần xử lý" kèm link danh sách task.
- **Thay đổi vai trò từ MANAGER xuống EMPLOYEE:** Nếu user là Trưởng phòng đang quản lý phòng
  ban → chặn, yêu cầu gán Trưởng phòng thay thế trước.
- **Tạo user với email trùng:** API trả về lỗi `409 Conflict` với message cụ thể. Form hiện
  thông báo ngay dưới trường email.
- **Xóa team còn thành viên đang có task:** Cảnh báo danh sách thành viên và số task, yêu cầu
  reassign task trước hoặc chuyển thành viên sang team khác.

---

## API Contract

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/api/admin/users` | `?page&limit&role&departmentId&status` | `{ data: [User], total, page }` |
| POST | `/api/admin/users` | `{ email, fullName, departmentId, role, sendInvite: true }` | `User` |
| GET | `/api/admin/users/:id` | — | `User` đầy đủ |
| PATCH | `/api/admin/users/:id` | `{ fullName, role, departmentId }` | `User` |
| PATCH | `/api/admin/users/:id/status` | `{ status: "DISABLED" \| "ACTIVE", reason? }` | `{ status }` |
| POST | `/api/admin/users/:id/reset-password` | — | `{ message: "Email sent" }` |
| GET | `/api/admin/departments` | `?page&limit` | `[Department]` |
| POST | `/api/admin/departments` | `{ name, code, description, managerId }` | `Department` |
| PATCH | `/api/admin/departments/:id` | `{ name, description, managerId }` | `Department` |
| DELETE | `/api/admin/departments/:id` | — | `204` hoặc `409` nếu còn phụ thuộc |
| GET | `/api/admin/departments/:id/teams` | — | `[Team]` |
| POST | `/api/admin/departments/:id/teams` | `{ name, description, leaderId }` | `Team` |
| PATCH | `/api/admin/teams/:id` | `{ name, leaderId }` | `Team` |
| POST | `/api/admin/teams/:id/members` | `{ userIds: [string] }` | `Team` |
| DELETE | `/api/admin/teams/:id/members/:userId` | — | `204` |

**User object shape:**
```ts
{
  id: string
  email: string
  fullName: string
  displayName: string
  departmentId: string
  departmentName: string
  teamId: string | null
  role: "ADMIN" | "DIRECTOR" | "MANAGER" | "LEADER" | "EMPLOYEE"
  status: "ACTIVE" | "DISABLED"
  forcePasswordChange: boolean
  createdAt: string
  lastLoginAt: string | null
}
```

---

## DO NOT

- **KHÔNG** hard-delete tài khoản user trong bất kỳ trường hợp nào.
- **KHÔNG** cho Admin xem mật khẩu tạm — chỉ cấp 1 lần qua email, không lưu plaintext.
- **KHÔNG** cho phép Admin vô hiệu hóa chính account đang đăng nhập.
- **KHÔNG** implement Import Excel trong MVP — endpoint `/api/admin/users/import` chưa build.
- **KHÔNG** implement Audit Log endpoint trong MVP — bỏ qua `GET /api/admin/audit-logs`.
- **KHÔNG** áp dụng thay đổi Security Policy ngược lại cho các session đang active.