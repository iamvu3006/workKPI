# SPEC: Task & KPI Management (F4)

> **MVP Scope:** Tạo/giao task, Vòng đời trạng thái (5 bước), Kanban Board, Sub-task, Comment +
> @mention, Checklist, Nộp nghiệm thu, Chấm điểm chất lượng, Tính KPI tháng, KPI cá nhân &
> phòng ban, KPI ước tính real-time.
>
> **Ngoài MVP (triển khai sau):** Snapshot KPI bất biến, Khiếu nại KPI, Export PDF KPI,
> KPI năm, Task định kỳ (recurring), Template task, Task dependency (phụ thuộc), Gantt Chart,
> SLA task, Theo dõi thời gian (time tracking), Báo cáo phân tích nguyên nhân trễ.

---

## User Flow

### 1. Tạo & Giao Task (Trưởng phòng / Leader)
Vào màn quản lý task → "Tạo mới" → nhập:
- Tiêu đề (bắt buộc), Mô tả (rich text, tùy chọn)
- Assignee(s): chọn từ danh sách nhân viên phòng (có hiển thị workload hiện tại)
- Deadline (date picker, không cho chọn ngày quá khứ)
- Trọng số (Weight): chọn từ dropdown `[5%, 10%, 20%, 30%, 35%]`
- Mức độ ưu tiên: `Thấp | Bình thường | Cao | Khẩn cấp`
- Tag: chọn có sẵn hoặc tạo mới, tối đa 5 tag/task
- File đính kèm: PDF, Word, Excel, ảnh — tối đa 10MB/file, 50MB/task

Hệ thống kiểm tra tổng weight của assignee trong tháng không vượt 100%. Nếu vượt → cảnh báo
(vẫn cho tạo nếu là task khẩn cấp, nhưng phải ghi lý do). Task được tạo ở trạng thái `TO_DO`.
Assignee nhận thông báo in-app ngay lập tức.

### 2. Vòng đời Trạng thái Task
```
TO_DO → IN_PROGRESS → REVIEW → DONE
                ↓
            PENDING (bị chặn)
            PENDING → IN_PROGRESS (khi vướng mắc được giải quyết)
```
- **TO_DO → IN_PROGRESS:** Assignee bấm "Bắt đầu làm". Ghi timestamp bắt đầu. Không thể
  quay lại TO_DO.
- **IN_PROGRESS → PENDING:** Assignee bấm "Báo vướng mắc", nhập lý do bắt buộc và loại
  (nguồn lực / kỹ năng / yếu tố khác). Trưởng phòng nhận thông báo in-app.
- **IN_PROGRESS / PENDING → REVIEW:** Assignee bấm "Nộp nghiệm thu", bắt buộc đính kèm bằng
  chứng (file hoặc mô tả) + tóm tắt kết quả. Ghi timestamp nộp.
- **REVIEW → DONE:** Trưởng phòng chấm điểm và bấm "Duyệt". KPI được tính.
- **REVIEW → IN_PROGRESS:** Trưởng phòng bấm "Trả lại", nhập lý do + hướng dẫn sửa bắt buộc.
  Assignee nhận thông báo kèm lý do.
- Assignee có thể hủy nộp (REVIEW → IN_PROGRESS) nếu Trưởng phòng chưa chấm.

### 3. Nghiệm thu & Chấm điểm (Trưởng phòng)
Vào danh sách task trạng thái REVIEW → chọn task → xem bằng chứng, lịch sử tiến độ, tự đánh
giá của nhân viên → nhập điểm chất lượng 0–100 → hệ thống tự tính phạt overdue nếu có →
hiện điểm sau phạt → nhập nhận xét (tùy chọn) → Duyệt hoặc Trả lại.

### 4. Tính KPI Tháng (Admin / Trưởng phòng)
Admin vào `/admin/kpi/calculate` → chọn tháng/năm → trigger tính KPI cho toàn phòng hoặc
toàn công ty → kết quả lưu vào DB → nhân viên và Trưởng phòng xem kết quả.

### 5. Xem KPI Cá nhân (Nhân viên)
Vào `/dashboard/kpi` → xem điểm tổng + xếp loại + bảng chi tiết từng task đóng góp bao nhiêu
điểm + biểu đồ xu hướng 6 tháng. Widget KPI ước tính trên dashboard cập nhật real-time.

---

## Business Rules

### Task
- **Trọng số hợp lệ:** Chỉ được chọn trong `[5, 10, 20, 30, 35]` (%). Tổng weight tất cả task
  trong tháng của 1 assignee không vượt 100%. Cảnh báo ở 80%, lỗi ở 100%+ (trừ task khẩn cấp
  có ghi lý do).
- **RBAC cập nhật task:**
  - Assignee: cập nhật `status`, `progress %`, thêm comment, nộp nghiệm thu.
  - Trưởng phòng / Leader (người tạo): sửa `title`, `description`, `deadline`, `assignee`,
    `weight`, `priority`; chấm điểm nghiệm thu; trả lại task; reassign.
  - DIRECTOR: xem tất cả, không can thiệp trực tiếp.
- **Deadline không được là ngày quá khứ** khi tạo mới. Khi gia hạn: Trưởng phòng được phép
  set deadline mới (kể cả trong tương lai gần), nhưng không được set về quá khứ.
- **Overdue:** Tính từ 00:00 ngày sau deadline. Task ở REVIEW nhưng đã quá deadline vẫn bị tính
  phạt tính từ deadline đến ngày Trưởng phòng bấm Duyệt.
- **Assignee bị DISABLED:** Task giữ nguyên trạng thái. Trưởng phòng nhận thông báo in-app,
  có thể reassign.
- **Checklist:** Nếu task có checklist, không cho phép chuyển sang REVIEW khi còn item chưa tick.

### KPI
- **Công thức KPI tháng:**
  ```
  KPI = Σ (progress% × quality_score × weight%) cho mỗi task DONE trong tháng
  ```
  Trong đó:
  - `progress%`: Phần trăm hoàn thành (0–100), do Trưởng phòng xác nhận khi duyệt
  - `quality_score`: Điểm chất lượng (0–100) do Trưởng phòng nhập, **sau khi đã trừ phạt**
  - `weight%`: Trọng số task (5/10/20/30/35%)

- **Phạt overdue:**
  ```
  Số ngày trễ = ngày Trưởng phòng duyệt - deadline (tính ngày làm việc)
  Điểm sau phạt = max(0, quality_score_gốc - 10 × số_ngày_trễ)
  ```
  Ví dụ: điểm gốc 80, trễ 3 ngày → 80 - 30 = 50 điểm.

- **Task CANCELLED:** Không tính vào KPI (coi như không tồn tại trong tháng đó).
- **Xếp loại KPI:**
  - ≥ 90: Xuất sắc
  - 75–89: Tốt
  - 65–74: Đạt
  - < 65: Cần cải thiện

- **KPI ước tính (real-time):** Tính dựa trên task DONE + task đang IN_PROGRESS/REVIEW với
  `progress%` hiện tại. Label rõ "Ước tính — chưa chính thức". Cập nhật khi có thay đổi
  (invalidate cache).

---

## Edge Cases

- **Assignee bị DISABLED khi đang có task IN_PROGRESS:** Task đổi sang trạng thái `PENDING`
  tự động với lý do "Assignee không còn hoạt động". Trưởng phòng nhận thông báo và cần reassign.
- **Deadline task thay đổi sau khi đã overdue:** Nếu Trưởng phòng gia hạn deadline sang ngày
  tương lai → counter phạt reset về 0 tính từ deadline mới.
- **Tổng weight vượt 100% do nhiều task cùng lúc:** Cho phép tạo nếu đánh dấu khẩn cấp và có
  lý do. Hệ thống ghi nhận tháng có task vượt ngưỡng trong báo cáo.
- **Chấm điểm 0:** Hợp lệ — có thể task không đạt yêu cầu. Hệ thống không tự động trả lại,
  Trưởng phòng phải chủ động bấm "Trả lại" nếu muốn nhân viên làm lại.
- **Sub-task có assignee khác task cha:** Hợp lệ. `progress%` task cha = trung bình cộng
  `progress%` các sub-task. Nếu không có sub-task, Trưởng phòng tự nhập khi nghiệm thu.
- **Load KPI phòng lớn (> 5000 tasks):** Dùng aggregation query tối ưu ở server, không tính
  từng task một ở client. Acceptance Criteria: response < 3s.
- **Hủy nộp nghiệm thu:** Chỉ được hủy khi Trưởng phòng chưa bắt đầu chấm (chưa mở form
  review). Nếu đã mở → không cho hủy, phải đợi kết quả.

---

## API Contract

### Tasks

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/api/tasks` | `?page&status&assigneeId&month&priority&tag` | `{ data: [Task], total }` |
| POST | `/api/tasks` | `{ title, description, assigneeIds, deadline, weight, priority, tags }` | `Task` |
| GET | `/api/tasks/:id` | — | `Task` đầy đủ (kèm comments, checklist, attachments, history) |
| PATCH | `/api/tasks/:id` | `{ title?, description?, deadline?, weight?, priority?, tags? }` | `Task` |
| DELETE | `/api/tasks/:id` | — | `204` (soft delete, chỉ Manager) |
| PATCH | `/api/tasks/:id/status` | `{ status, reason?, evidence? }` | `Task` |
| POST | `/api/tasks/:id/submit-review` | `{ summary, evidence: [{ fileUrl, note }] }` | `Task` |
| POST | `/api/tasks/:id/review` | `{ action: "APPROVE"\|"REJECT", qualityScore?, comment?, reason? }` | `Task` |
| POST | `/api/tasks/:id/reject` | `{ reason }` | `Task` (status → TO_DO chờ reassign) |
| POST | `/api/tasks/:id/extend` | `{ proposedDeadline, reason }` | `ExtendRequest` |
| PATCH | `/api/tasks/:id/deadline` | `{ deadline }` | `Task` (chỉ Manager) |
| POST | `/api/tasks/:id/attachments` | `FormData { file }` | `Attachment` |
| DELETE | `/api/tasks/:id/attachments/:attachId` | — | `204` |

### Comments & Checklist

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/tasks/:id/comments` | — | `[Comment]` (kèm replies) |
| POST | `/api/tasks/:id/comments` | `{ content, parentId? }` | `Comment` |
| PATCH | `/api/tasks/:id/comments/:cId` | `{ content }` | `Comment` |
| DELETE | `/api/tasks/:id/comments/:cId` | — | `204` |
| GET | `/api/tasks/:id/checklist` | — | `[ChecklistItem]` |
| POST | `/api/tasks/:id/checklist` | `{ items: [string] }` | `[ChecklistItem]` |
| PATCH | `/api/tasks/:id/checklist/:itemId` | `{ isDone }` | `ChecklistItem` |
| DELETE | `/api/tasks/:id/checklist/:itemId` | — | `204` |

### Sub-tasks

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/tasks/:id/subtasks` | — | `[Task]` |
| POST | `/api/tasks/:id/subtasks` | `{ title, assigneeId, deadline }` | `Task` |

### KPI

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| GET | `/api/kpi/me` | `?month&year` | `KpiResult` |
| GET | `/api/kpi/me/estimate` | — | `{ estimatedScore, tasks: [TaskContribution] }` |
| GET | `/api/kpi/department/:id` | `?month&year` | `[{ user, kpiScore, rank, breakdown }]` |
| GET | `/api/kpi/company` | `?month&year` | `[{ department, avgScore, rank }]` |
| POST | `/api/admin/kpi/calculate` | `{ month, year, departmentId? }` | `{ processed: N, results: [KpiResult] }` |

**KpiResult shape:**
```ts
{
  userId: string
  month: number
  year: number
  totalScore: number        // 0–100
  grade: "EXCELLENT" | "GOOD" | "PASS" | "NEEDS_IMPROVEMENT"
  taskBreakdown: [{
    taskId: string
    taskTitle: string
    weight: number          // 5 | 10 | 20 | 30 | 35
    progress: number        // 0–100
    qualityScore: number    // 0–100 (sau phạt)
    penaltyDays: number
    contribution: number    // điểm đóng góp vào KPI tổng
  }]
  onTimeRate: number        // % task đúng hạn
  calculatedAt: string
}
```

---

## DO NOT

- **KHÔNG** dùng WebSocket/Socket.IO cho luồng thay đổi trạng thái — dùng Optimistic Updates
  ở frontend kết hợp Supabase Realtime (giới hạn kênh) hoặc polling ngắn.
- **KHÔNG** để nhân viên xem điểm KPI chi tiết của người khác hoặc phòng ban khác (Strict RBAC).
- **KHÔNG** tính KPI từng task riêng lẻ ở client — toàn bộ aggregation phải ở server.
- **KHÔNG** cho phép set deadline về ngày quá khứ khi tạo task mới.
- **KHÔNG** cho phép chuyển sang REVIEW nếu checklist còn item chưa tick.
- **KHÔNG** implement Snapshot KPI bất biến, Khiếu nại KPI, Export PDF, KPI năm trong MVP.
- **KHÔNG** implement Task định kỳ, Task dependency, Gantt Chart trong MVP.