# Workflow thực tế: một session hoàn chỉnh
Đây là ví dụ cụ thể về cách một session Vibe Coding chuyên nghiệp diễn ra khi bạn implement tính năng KPI Dashboard cho WorkKPI. Mình sẽ viết ra từng bước theo đúng thứ tự thực hiện.
## Bước 1 — Mở session, đọc TASKS.md trước
Không mở Copilot Chat và hỏi ngay. Thay vào đó, mở TASKS.md và xem hôm nay cần làm gì. Chọn một task cụ thể: "Viết hàm calculateKPI(tasks, period)".
## Bước 2 — Xác định doc cần feed cho task này
Task này liên quan đến business logic, vậy cần SPEC của KPI Dashboard. Mở specs/kpi-dashboard.md và đọc qua phần Business Rules và Edge Cases — đọc bằng mắt người trước, không phải để AI đọc thay.
## Bước 3 — Mở Copilot Chat, feed đúng context
Tôi đang implement hàm calculateKPI() cho WorkKPI project.

Đây là business rules và edge cases từ SPEC:
[paste phần Business Rules + Edge Cases từ specs/kpi-dashboard.md]

Tech stack: Node.js 20, không dùng thư viện date ngoài,
chỉ dùng Date object built-in.

Viết hàm calculateKPI(tasks, period) trong
src/services/kpi_service.js với:
- tasks: array object từ DB query
- period: 'week' | 'month'
- Return: { rate: number, done: number, total: number }

Sau khi viết xong, tự review: edge case nào trong SPEC
chưa được cover?
Câu hỏi cuối cùng — "tự review edge case" — là kỹ thuật quan trọng. Một reference file tốt còn giá trị hơn hàng trăm từ mô tả kiểu chữ, vì nó cho AI thấy chính xác functionality mong muốn trong context thực tế. Roadmap
## Bước 4 — Review output theo SPEC, không theo cảm giác
Nhận code từ AI xong, không đọc để xem "có vẻ đúng không". Mở specs/kpi-dashboard.md và đọc từng edge case, đối chiếu với code. Câu hỏi cần trả lời là: task "overdue" có bị tính nhầm không? Timezone có đúng UTC+7 không? Rate có làm tròn 2 chữ số không?

## Bước 5 - Đọc ngược: từ code về SPEC
Sau khi AI tạo ra code, thay vì chỉ chạy để xem kết quả, hãy paste code đó vào Chat và hỏi:

Đây là code cho hàm calculateKPI(). Đọc SPEC này:
[paste SPEC]

Hỏi 3 câu:
1. Code này implement đúng mọi business rule chưa?
2. Edge case nào trong SPEC chưa được cover?
3. Có business rule nào bị implement theo cách
   AI tự suy luận thay vì theo SPEC không?
Quá trình đối chiếu code với SPEC là nơi bạn học được nhiều nhất — không phải khi nhận code, mà khi verify code.
## Bước 6 — Ghi PROMPT_LOG ngay khi xong
markdown## 2025-05-06 | calculateKPI()
Prompt: [tóm tắt prompt đã dùng]
Kết quả: Tốt, pass tất cả edge cases
Ghi chú: AI ban đầu không xử lý đúng case
"task overdue" — đã sửa bằng iteration lần 2.
Lesson: Luôn paste business rules về overdue rõ ràng.

# PROMPT_LOG - NHẬT KÍ HỌC TẬP

