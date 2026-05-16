# SPEC: Báo cáo (F6)

> **MVP Scope:** Báo cáo tháng (Trưởng phòng), Báo cáo KPI toàn công ty (BGĐ), Báo cáo tiến độ
> task theo tuần, Export Excel.
>
> **Ngoài MVP (triển khai sau):** Báo cáo so sánh cùng kỳ năm ngoái, Báo cáo phân tích nguyên
> nhân task trễ, Workload balancing report, Báo cáo tự động gửi email, Báo cáo tùy chỉnh
> (custom report builder), Biểu đồ scatter KPI vs workload, Cohort analysis, Dự báo KPI
> tháng tới, Báo cáo trình bày cho hội đồng quản trị (PPTX).

---

## User Flow

### 1. Báo cáo Tháng — Trưởng phòng
Vào `/dashboard/reports/monthly` → chọn tháng/năm → hệ thống hiển thị:
- Tóm tắt: tổng task / đã hoàn thành / trễ hạn / bị hủy
- KPI trung bình phòng + từng nhân viên (bảng + biểu đồ cột)
- So sánh với tháng trước (tăng/giảm %)
- Nhân viên xuất sắc nhất và cần cải thiện nhất
→ Nút Export Excel → tải file.

### 2. Báo cáo KPI Toàn công ty — BGĐ
Vào `/dashboard/reports/company` → chọn tháng hoặc quý → biểu đồ cột KPI từng phòng →
bảng xếp hạng phòng → Top 5 nhân viên toàn công ty → tỷ lệ task đúng hạn toàn công ty.

### 3. Báo cáo Tiến độ Task theo Tuần
Widget trên dashboard Trưởng phòng hoặc trang `/dashboard/reports/weekly` → biểu đồ số task
DONE / IN_PROGRESS / PENDING theo tuần → tỷ lệ hoàn thành đúng hạn → so sánh với tuần trước.

---

## Business Rules

- **Phân quyền xem báo cáo:**
  - MANAGER: xem báo cáo của phòng mình.
  - DIRECTOR / ADMIN: xem tất cả phòng và toàn công ty.
  - EMPLOYEE / LEADER: không có quyền truy cập trang báo cáo.
- **Dữ liệu báo cáo tháng** lấy từ kết quả KPI đã được tính (cần chạy tính KPI trước). Nếu
  KPI tháng chưa được tính → hiện banner cảnh báo "KPI tháng này chưa được tính. Liên hệ admin."
- **Export Excel:** Xuất theo bộ lọc hiện tại (tháng, phòng ban). Tối đa 10.000 dòng/lần export.
  Tên file tự động: `KPI_[TenPhong]_[Thang]_[Nam].xlsx`. Cột xuất: STT, Họ tên, Email, Phòng ban,
  Điểm KPI, Xếp loại, Số task hoàn thành, Tỷ lệ đúng hạn.
- **Báo cáo tuần** tính dựa trên trạng thái task tại thời điểm cuối ngày Chủ nhật (snapshot
  cuối tuần). Không cần KPI đã tính.

---

## Edge Cases

- **Chọn tháng chưa có dữ liệu:** Hiện empty state rõ ràng "Chưa có dữ liệu cho tháng này"
  thay vì biểu đồ trống gây nhầm lẫn.
- **KPI chưa được tính cho tháng được chọn:** Banner cảnh báo + disable nút Export.
- **Export file lớn (nhiều nhân viên, nhiều tháng):** Nếu quá 10.000 dòng → thông báo giới hạn
  và gợi ý thu hẹp bộ lọc. Không tự cắt ngầm mà không báo.
- **Phòng chưa có nhân viên nào:** Hiện trong danh sách phòng ban với KPI = N/A, không crash.

---

## API Contract

| Method | Endpoint | Params | Response |
|--------|----------|--------|----------|
| GET | `/api/reports/monthly` | `?departmentId&month&year` | `MonthlyReport` |
| GET | `/api/reports/weekly` | `?departmentId&weekStart` | `WeeklyReport` |
| GET | `/api/reports/company-kpi` | `?month&year` | `CompanyKpiReport` |
| GET | `/api/reports/export` | `?type=monthly&departmentId&month&year` | `File (xlsx)` |

**MonthlyReport shape:**
```ts
{
  month: number
  year: number
  department: { id, name }
  summary: {
    totalTasks: number
    doneTasks: number
    lateTasks: number
    cancelledTasks: number
    onTimeRate: number
  }
  avgKpiScore: number
  comparedToPrevMonth: number   // điểm tăng/giảm so tháng trước
  members: [{
    userId: string
    fullName: string
    kpiScore: number
    grade: string
    tasksCompleted: number
    onTimeRate: number
  }]
  topPerformer: { userId, fullName, kpiScore }
  bottomPerformer: { userId, fullName, kpiScore }
}
```

**WeeklyReport shape:**
```ts
{
  weekStart: string   // ISO date, Monday
  weekEnd: string     // ISO date, Sunday
  department: { id, name }
  tasksByStatus: { done: N, inProgress: N, pending: N, review: N }
  onTimeRate: number
  comparedToPrevWeek: { done: delta, onTimeRate: delta }
}
```

---

## DO NOT

- **KHÔNG** cho EMPLOYEE hoặc LEADER xem trang báo cáo.
- **KHÔNG** export quá 10.000 dòng một lần mà không có cảnh báo.
- **KHÔNG** hiển thị KPI của nhân viên phòng khác trong báo cáo của Trưởng phòng.
- **KHÔNG** implement báo cáo tự động gửi email, custom report builder, hoặc PPTX export
  trong MVP.