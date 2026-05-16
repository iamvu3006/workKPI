# SPEC: Authentication & Security (F1)

> **MVP Scope:** Đăng nhập Email/Password, Lockout, Auto-expire Session, Lịch sử đăng nhập,
> Đăng xuất remote, Quên/Đặt lại mật khẩu.
>
> **Ngoài MVP (triển khai sau):** Google SSO, Nhớ thiết bị 30 ngày, Email cảnh báo
> bảo mật (New Device / Change Password), IP Whitelist, Báo cáo bảo mật hàng tuần.

---

## User Flow

1. **Login (Email/Password):** Người dùng nhập Email/Mật khẩu. Hệ thống kiểm tra thông tin.
2. **Xử lý đăng nhập sai:** Nếu sai, báo lỗi chung chung (không tiết lộ email có tồn tại không).
   Quá 5 lần liên tiếp → hiển thị đếm ngược khóa 15 phút, không cho submit thêm.
3. **Session Management:** Đăng nhập thành công → redirect vào Dashboard. Hệ thống bắt đầu đếm
   thời gian idle (8 tiếng tính từ tương tác cuối). Còn 5 phút → hiện popup cảnh báo cho phép
   gia hạn. Hết 8 tiếng → auto logout.
4. **Lịch sử & Quản lý phiên:** User xem 10 lần đăng nhập gần nhất (IP, thiết bị, thời gian).
   Có thể đăng xuất bất kỳ phiên cụ thể nào từ xa.
5. **Reset Mật khẩu:** Quên MK → nhập email → nhận link (hiệu lực 30 phút) → nhập MK mới
   → redirect về màn hình đăng nhập.

---

## Business Rules

- **Lockout:** Sai 5 lần liên tiếp → khóa đúng 15 phút. Bộ đếm reset về 0 sau đăng nhập thành
  công. Không có cơ chế admin bypass lock này trong MVP.
- **Auto-expire Session:** Timeout 8h tính từ tương tác cuối cùng (bất kỳ API call hoặc click).
  Popup cảnh báo xuất hiện lúc còn 5 phút (7h55m). User có thể bấm "Gia hạn" để reset timer.
- **Bảo mật phản hồi:** Lỗi đăng nhập luôn hiện chung chung: *"Tài khoản hoặc mật khẩu không
  chính xác"* — không tiết lộ email có tồn tại hay không. Riêng tài khoản bị khóa tạm (lockout)
  hoặc bị vô hiệu hóa bởi admin → thông báo lý do cụ thể.
- **Soft Delete chỉ:** Tài khoản bị vô hiệu hóa chỉ đổi status `DISABLED`, không xóa khỏi DB.
  Mọi liên kết Task/KPI vẫn nguyên vẹn.

---

## Edge Cases

- **Form dở dang khi session hết hạn:** Nếu user đang nhập liệu mà session expire → hiện popup
  yêu cầu gia hạn ngay tại chỗ (không redirect thẳng, tránh mất dữ liệu form).
- **Đăng nhập đồng thời nhiều trình duyệt:** User A đang login ở tab 1 và tab 2. Bấm "Đăng xuất
  thiết bị này" ở tab 1 → tab 2 sẽ bị redirect về Login ở request API tiếp theo (không realtime
  instant, chấp nhận delay 1 request).
- **Tài khoản bị DISABLED cố đăng nhập:** Hiện thông báo rõ "Tài khoản đã bị vô hiệu hóa. Vui
  lòng liên hệ quản trị viên." Ghi log lần thử này.
- **Link reset mật khẩu dùng lại:** Link chỉ có hiệu lực 1 lần và hết hạn sau 30 phút, dù chưa
  dùng. Truy cập lại link đã dùng → hiện thông báo hết hạn và hướng dẫn gửi lại.

---

## API Contract

Sử dụng Supabase SSR Auth làm provider chính — không tự implement JWT.

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| POST | Supabase `signInWithPassword` | `{ email, password }` | `Session` hoặc `AuthError` |
| POST | Supabase `resetPasswordForEmail` | `{ email }` | `{}` hoặc `AuthError` |
| POST | Supabase `updateUser` | `{ password }` | `User` hoặc `AuthError` |
| POST | Supabase `signOut` | — | `{}` |
| GET | `/api/auth/sessions` | — | `[{ sessionId, ip, userAgent, lastActive, isCurrent }]` |
| DELETE | `/api/auth/sessions/:id` | — | `{ success: true }` |

**Custom middleware** (không dùng Supabase):
- `POST /api/auth/login-attempt` — Ghi nhận failed attempt, kiểm tra lockout, trả về
  `{ locked: boolean, remainingSeconds: number, attemptsLeft: number }`.

---

## DO NOT

- **KHÔNG** tự implement JWT crypto. Dùng hoàn toàn Auth Provider của Supabase.
- **KHÔNG** lưu plaintext password hoặc bất kỳ biến thể nào ở frontend hay DB custom.
- **KHÔNG** bỏ qua middleware check session cho TẤT CẢ route có prefix `/dashboard`, `/admin`,
  `/profile`.
- **KHÔNG** redirect thẳng về Login khi session hết hạn nếu user đang có form chưa submit
  (phải hiện popup gia hạn trước).
- **KHÔNG** implement Google SSO trong MVP — để dành slot này cho sau.