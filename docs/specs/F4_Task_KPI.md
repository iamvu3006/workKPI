# SPEC: Task & KPI Management (F4)

## User Flow
1. **Tạo Task (CRUD):** User/Manager truy cập màn quản lý -> "Tạo mới" -> Nhập tên, assignee, deadline, mức độ ưu tiên -> Save (<1 giây xử lý).
2. **Cập nhật Progress:** Assignee đổi trạng thái (To do -> In Progress -> Done) dạng Kanban hoặc List view. Cập nhật `% hoàn thành`.
3. **View Dashboard KPI:** Manager vào màn Report -> Hệ thống tải % hoàn thành theo tuần/tháng, breakdown chi tiết theo individual.

## Business Rules
- **Quyền sửa Task:** Chỉ Assignee cập nhật được Progress & Status. Manager (người tạo task) có quyền Edit Name, Deadline, Assignee hoặc Delete.
- **Deadline Logic:** Nếu task chuyển sang Done trước/vừa deadline -> Đúng hạn. Chuyển Done sau deadline -> Trễ hạn (để tính % KPI chuẩn xác).
- **KPI Metrics:** Tỷ lệ % KPI được tính bằng Trọng số ưu tiên (Weight) x Số task hoàn thành đúng hạn / Tổng số task.

## Edge Cases
- Tạo task giao cho user A, hôm sau user A bị Admin vô hiệu hóa -> Trạng thái task đóng lại hoặc treo, Manager nhận cảnh báo trên giao diện để re-assign.
- Đổi deadline của task về ngày quá khứ -> Form không cho phép hoặc ném lỗi Validation.
- Load Dashboard KPI cho phòng ban lớn (>5000 tasks) -> Server phải tính logic tổng hợp trước, trả về thông qua query cache hoặc materialized views (nếu Prisma support) để dướ <3s (Acceptance Criteria).

## API Contract
- `POST /api/tasks` -> Nhận `{ title, assigneeId, deadline, priority, description }`
- `PATCH /api/tasks/:id/status` -> Nhận `{ status, progress }`
- `GET /api/reports/kpi?departmentId=...&timeRange=week` -> Trả về array JSON đã tổng hợp data thống kê.

## DO NOT
- KHÔNG cắm socket realtime websocket quá nặng cho luồng "Thay đổi trạng thái" (Nên dùng Optimistic Updates frontend kết hợp polling ngắn hạn/Supabase Realtime limit kênh).
- KHÔNG để nhân viên thường xem được chi tiết tính toán KPI của các phòng ban khác (Strict RBAC).