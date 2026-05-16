# SPEC: Dashboard, Thông báo & Tìm kiếm (F5)

> **MVP Scope:** Dashboard theo 4 vai trò, Thông báo in-app (bell icon + dropdown), Trigger thông
> báo cho sự kiện chính, Tìm kiếm task + toàn cục, Bộ lọc nâng cao.
>
> **Ngoài MVP (triển khai sau):** Email notification, Push notification trình duyệt,
> Cảnh báo tự động KPI thấp, Cảnh báo quá nhiều task Pending, Cảnh báo workload quá tải,
> Heatmap workload, Dashboard kiosk TV mode, Digest email hàng ngày.

---

## User Flow

### 1. Dashboard theo vai trò
Sau khi đăng nhập → hệ thống detect vai trò → render đúng layout dashboard:

- **EMPLOYEE:** Widget task đang làm / đến hạn hôm nay / overdue, KPI ước tính tháng, top 5
  task cần xử lý theo deadline, biểu đồ tròn trạng thái task, countdown deadline gần nhất.
- **MANAGER (Trưởng phòng):** Tổng quan task toàn phòng theo trạng thái, KPI trung bình phòng,
  bảng nhân viên kèm task overdue + KPI tháng, widget dự báo KPI.
- **LEADER:** Giới hạn trong team, task team theo trạng thái, KPI trung bình team, bảng thành
  viên cần chú ý.
- **DIRECTOR / ADMIN:** KPI trung bình toàn công ty, biểu đồ cột KPI từng phòng, top nhân viên
  xuất sắc và cần cải thiện, tỷ lệ task hoàn thành đúng hạn.

### 2. Thông báo in-app
Bell icon trên header → badge số thông báo chưa đọc → click → dropdown 10 thông báo gần nhất
→ click từng thông báo → redirect đến task/trang tương ứng → đánh dấu đã đọc. "Đánh dấu tất cả
đã đọc" → clear badge. Trang lịch sử đầy đủ tại `/dashboard/notifications`.

### 3. Tìm kiếm & Lọc
Thanh tìm kiếm trên trang task → real-time khi gõ ≥ 3 ký tự → tìm trong tiêu đề + mô tả →
highlight từ khóa. Bộ lọc nâng cao: kết hợp nhiều điều kiện, lưu bộ lọc yêu thích.

Tìm kiếm toàn cục (`Ctrl+K`): tìm đồng thời task + nhân viên + phòng ban, phân nhóm kết quả.

---

## Business Rules

### Dashboard
- **Phân quyền dữ liệu:**
  - EMPLOYEE: chỉ thấy task của bản thân.
  - LEADER: chỉ thấy task trong team mình quản lý.
  - MANAGER: thấy toàn bộ task trong phòng.
  - DIRECTOR: thấy tổng hợp toàn công ty (không xem chi tiết task cá nhân).
- **Widget KPI ước tính:** Tính real-time, cache 1 giờ, invalidate khi có task thay đổi trạng
  thái hoặc tiến độ.
- **Countdown deadline:** Chỉ hiển thị task chưa DONE/CANCELLED. Màu: xanh (> 3 ngày) → vàng
  (≤ 3 ngày) → đỏ (≤ 1 ngày hoặc overdue).

### Thông báo
- **Các sự kiện trigger thông báo in-app:**

  | Sự kiện | Người nhận |
  |---------|------------|
  | Được giao task mới | Assignee |
  | Task sắp hạn (còn 3 ngày) | Assignee |
  | Task sắp hạn (còn 1 ngày) | Assignee |
  | Task bị trả lại từ Review | Assignee |
  | Nhân viên báo Pending (vướng mắc) | Manager + Leader |
  | Task mới chờ nghiệm thu | Manager |
  | Yêu cầu gia hạn deadline mới | Manager |
  | Kết quả KPI tháng được công bố | Nhân viên |
  | Assignee bị DISABLED, có task cần xử lý | Manager |

- **Thông báo không trùng lặp:** Nếu task đã được thông báo "sắp hạn 3 ngày", không gửi lại
  cùng loại cho task đó. Chỉ gửi "sắp hạn 1 ngày" tiếp theo.
- **Lịch sử:** Lưu 90 ngày. Sau đó tự xóa (soft delete, không purge).
- **Badge:** Chỉ đếm thông báo chưa đọc. Tối đa hiển thị "99+" nếu vượt 99.

### Tìm kiếm
- **Real-time search:** Debounce 300ms, bắt đầu từ ký tự thứ 3.
- **Phạm vi tìm kiếm theo role:** EMPLOYEE chỉ tìm được task của mình. MANAGER tìm được task
  toàn phòng. Tìm kiếm toàn cục nhân viên: ai cũng tìm được (thông tin cơ bản: tên, phòng ban).
- **Bộ lọc yêu thích:** Lưu theo user, tối đa 10 bộ lọc.

---

## Edge Cases

- **Dashboard load chậm khi phòng lớn:** Dùng skeleton loading, ưu tiên render widget KPI ước
  tính trước (từ cache), các biểu đồ nặng load sau.
- **Bell icon khi chưa có thông báo nào:** Không hiện badge, dropdown hiện "Không có thông báo
  mới".
- **Click thông báo đến task đã bị xóa (soft delete):** Redirect → hiện thông báo "Task không
  còn tồn tại" thay vì 404 crash.
- **Tìm kiếm không có kết quả:** Hiện "Không tìm thấy kết quả cho '[từ khóa]'", gợi ý kiểm tra
  chính tả.
- **Nhiều tab mở cùng lúc, thông báo đến ở tab khác:** Badge cập nhật khi tab được focus lại
  (refetch on window focus).

---

## API Contract

### Dashboard

| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/api/dashboard/summary` | — | `{ tasksToday, overdueTasks, inProgressTasks, kpiEstimate, upcomingDeadlines }` |
| GET | `/api/dashboard/department-summary` | `?departmentId` | `{ avgKpi, tasksByStatus, members: [MemberSummary] }` |
| GET | `/api/dashboard/company-summary` | — | `{ avgKpi, departments: [DeptSummary], topPerformers, bottomPerformers }` |

### Thông báo

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/api/notifications` | `?page&limit&isRead` | `{ data: [Notification], unreadCount }` |
| PATCH | `/api/notifications/:id/read` | — | `{ isRead: true }` |
| PATCH | `/api/notifications/read-all` | — | `{ updated: N }` |
| GET | `/api/users/me/notification-settings` | — | `NotificationSettings` |
| PATCH | `/api/users/me/notification-settings` | `{ taskAssigned, taskDueSoon, taskRejected, taskPending, dndStart?, dndEnd? }` | `NotificationSettings` |

**Notification shape:**
```ts
{
  id: string
  type: "TASK_ASSIGNED" | "TASK_DUE_SOON" | "TASK_REJECTED" | "TASK_PENDING"
       | "REVIEW_NEEDED" | "EXTEND_REQUESTED" | "KPI_PUBLISHED" | "USER_DISABLED"
  title: string
  message: string
  link: string          // e.g. "/dashboard/tasks/abc123"
  isRead: boolean
  createdAt: string
}
```

### Tìm kiếm

| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/api/tasks/search` | `?q=keyword&status&assigneeId&priority&tag&from&to` | `{ data: [Task], total }` |
| GET | `/api/search/global` | `?q=keyword` | `{ tasks: [Task], users: [User], departments: [Dept] }` |
| GET | `/api/users/me/saved-filters` | — | `[SavedFilter]` |
| POST | `/api/users/me/saved-filters` | `{ name, filters }` | `SavedFilter` |
| DELETE | `/api/users/me/saved-filters/:id` | — | `204` |

---

## DO NOT

- **KHÔNG** implement email notification hoặc push notification trình duyệt trong MVP.
- **KHÔNG** implement cảnh báo tự động (KPI thấp, quá nhiều Pending) trong MVP — thông báo
  chỉ do trigger từ action của user.
- **KHÔNG** để EMPLOYEE xem dashboard dữ liệu của nhân viên khác.
- **KHÔNG** polling thông báo interval ngắn hơn 30 giây (dùng Supabase Realtime hoặc polling
  30s, không dưới mức này để tránh quá tải server).
- **KHÔNG** lưu search history nếu user đã tắt tính năng này trong cài đặt.