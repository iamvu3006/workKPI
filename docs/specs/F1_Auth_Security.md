# SPEC: Authentication & Security (F1)

## User Flow
1. **Login (Local & SSO):** Người dùng nhập Email/Mật khẩu hoặc chọn "Đăng nhập bằng Google". Hệ thống kiểm tra.
2. **Xử lý đăng nhập sai:** Nếu sai, báo lỗi chung. Quá 5 lần, tài khoản hiển thị đếm ngược bị khóa 15 phút.
3. **Session Management:** Đăng nhập thành công, chuyển hướng vào Dashboard. Hệ thống bắt đầu đếm giờ idle (8 tiếng). Quá 8 tiếng không tương tác -> Auto logout (có cảnh báo lúc 7h55m).
4. **Quản lý thiết bị:** Nếu chọn "Nhớ thiết bị này", cấp token lưu 30 ngày. Nếu phát hiện IP/Thiết bị lạ, gửi email cảnh báo trong vòng 1 phút.
5. **Reset Mật khẩu:** Quên MK -> Nhập email -> Nhận link (30 phút hiệu lực) -> Nhập MK mới -> Chuyển về màn hình đăng nhập.

## Business Rules
- **Khóa tài khoản (Lockout):** Sai 5 lần liên tiếp khóa đúng 15 phút. Không admin nào bypass được lock này.
- **Auto-expire Session:** Timeout 8h tính từ tương tác cuối cùng (API call, click). Cảnh báo xuất hiện 5 phút trước khi hết hạn.
- **Trusted Device:** Token nhớ thiết bị tồn tại tối đa 30 ngày. Chức năng logout remotely phải force invalidation tất cả token.
- **Bảo mật phản hồi:** Lỗi đăng nhập hiện chung chung: "Tài khoản hoặc mật khẩu không chính xác", không tiết lộ email có tồn tại hay không. Đối với tài khoản bị khóa/vô hiệu hóa, thông báo lý do cụ thể theo admin.

## Edge Cases
- Người dùng đang nhập liệu dở (form) thì session hết hạn -> Trigger lưu nháp (nếu có) trước khi đá ra màn hình login, hoặc hiện popup yêu cầu gia hạn ngay tại chỗ.
- Đăng nhập cùng lúc trên 2 trình duyệt, sau đó ấn "Đăng xuất thiết bị khác" ở trình duyệt A -> Trình duyệt B ngay lập tức chuyển hướng về Login ở request API tiếp theo.
- Import user bằng Google SSO bằng email không thuộc domain công ty (nếu SSO có chặn domain).

## API Contract
Do sử dụng Supabase SSR Auth, API chủ yếu là Supabase Client Helper:
- `supabase.auth.signInWithPassword({ email, password })` -> Trả về `Session` hoặc `AuthError`.
- `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `supabase.auth.resetPasswordForEmail(email)`
- Endpoint custom quản lý Session/Log:
  - `GET /api/auth/sessions` -> List `[{ sessionId, ip, userAgent, lastActive, isCurrent }]`
  - `DELETE /api/auth/sessions/:id` -> Thu hồi session cụ thể

## DO NOT
- KHÔNG tự implement JWT crypto, dùng hoàn toàn Auth Provider của Supabase.
- KHÔNG lưu plaintext/bất kỳ biến thể format mật khẩu nào dưới Frontend.
- KHÔNG bỏ qua middleware check session cho TẤT CẢ các route có prefix `/dashboard`, `/admin` và `/profile`.