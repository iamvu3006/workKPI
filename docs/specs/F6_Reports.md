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

### 0. Điều hướng theo vai trò
Vào /dashboard/reports:
- EMPLOYEE → chuyển tới /dashboard/reports/weekly (tiến độ cá nhân theo tuần)
- LEADER → chuyển tới /dashboard/reports/weekly (tiến độ team theo tuần)
- MANAGER → chuyển tới /dashboard/reports/monthly (báo cáo phòng ban)
- DIRECTOR / ADMIN → chuyển tới /dashboard/reports/company (báo cáo toàn công ty)

### 1. Báo cáo Tháng — Trưởng phòng
Vào `/dashboard/reports/monthly` → chọn tháng/năm → hệ thống hiển thị:
- Tóm tắt: tổng task / đã hoàn thành / trễ hạn / bị hủy
- KPI trung bình phòng + từng nhân viên (bảng + biểu đồ cột)
- So sánh với tháng trước (tăng/giảm %)
- Nhân viên xuất sắc nhất và cần cải thiện nhất
→ Nút Export Excel → tải file.

### 2. Báo cáo KPI Toàn công ty — BGĐ
Vào /dashboard/reports/company → chọn tháng / quý / năm → biểu đồ cột KPI từng phòng →
bảng xếp hạng phòng → Top 20 nhân viên toàn công ty → tỷ lệ task đúng hạn toàn công ty.
→ Nút Export Excel → tải file theo kỳ hiện tại.

### 3. Báo cáo Tiến độ Task theo Tuần
EMPLOYEE vào /dashboard/reports/weekly → xem tiến độ task cá nhân theo tuần.
LEADER vào /dashboard/reports/weekly → xem tiến độ task của team theo tuần.
Hiển thị biểu đồ số task DONE / IN_PROGRESS / PENDING / REVIEW theo tuần → tỷ lệ hoàn thành đúng hạn → so sánh với tuần trước.

---

## Business Rules

- **Phân quyền xem báo cáo:**
  - EMPLOYEE: xem báo cáo tiến độ cá nhân theo tuần.
  - LEADER: xem báo cáo tiến độ theo team (tuần).
  - MANAGER: xem báo cáo phòng ban của phòng mình (tháng / quý / năm).
  - DIRECTOR / ADMIN: xem báo cáo toàn công ty (tháng / quý / năm).
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
| GET | /api/reports/monthly | ?departmentId&month&year&period | MonthlyReport |
| GET | /api/reports/weekly | ?weekStart | WeeklyReport |
| GET | /api/reports/company-kpi | ?month&year&period | CompanyKpiReport |
| GET | /api/reports/export | ?type=monthly&departmentId&month&year | File (xlsx) |

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

- **KHÔNG** cho EMPLOYEE xem dữ liệu team/phòng/công ty.
- **KHÔNG** cho LEADER xem dữ liệu ngoài team.
- **KHÔNG** cho MANAGER xem dữ liệu phòng ban khác.
- **KHÔNG** export quá 10.000 dòng một lần mà không có cảnh báo.
- **KHÔNG** hiển thị KPI của nhân viên phòng khác trong báo cáo của Trưởng phòng.
- **KHÔNG** implement báo cáo tự động gửi email, custom report builder, hoặc PPTX export
  trong MVP.