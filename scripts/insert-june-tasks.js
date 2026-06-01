require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=== BẮT ĐẦU THÊM DỮ LIỆU TASK THÁNG 6/2026 ===");

  // 1. Lấy danh sách các tài khoản người dùng thực tế từ Database
  const profiles = await prisma.profile.findMany();
  const profileMap = new Map(profiles.map(p => [p.email.toLowerCase(), p]));

  // Helper để lấy Profile
  const getProfile = (email) => {
    const p = profileMap.get(email.toLowerCase());
    if (!p) throw new Error(`Không tìm thấy profile cho email: ${email}`);
    return p;
  };

  // Các vai trò chính tham gia
  const director = getProfile("director@workkpi.com");
  const managerProduct = getProfile("manager.product@workkpi.com");
  const managerOps = getProfile("manager.ops@workkpi.com");
  const leaderBackend = getProfile("leader.backend@workkpi.com");
  const leaderCare = getProfile("leader.care@workkpi.com");

  const empFrontend = getProfile("employee.frontend@workkpi.com");
  const empQa = getProfile("employee.qa@workkpi.com");
  const empSupport = getProfile("employee.support@workkpi.com");

  console.log("Đã xác định các nhân sự cốt lõi.");

  // 2. Xóa các Task cũ của tháng 6/2026 nếu có để tránh trùng lặp dữ liệu khi chạy lại
  const startDate = new Date("2026-06-01T00:00:00Z");
  const endDate = new Date("2026-06-30T23:59:59Z");

  const deleteCount = await prisma.task.deleteMany({
    where: {
      deadline: {
        gte: startDate,
        lte: endDate
      },
      tags: {
        has: "june-2026-demo"
      }
    }
  });
  console.log(`Đã dọn dẹp ${deleteCount.count} task demo cũ của tháng 6/2026.`);

  // 3. Chuẩn bị tập dữ liệu Task phong phú cho tháng 6/2026
  const tasksToCreate = [
    // ==========================================
    // NHÂN VIÊN 1: Minh Frontend (employee.frontend@workkpi.com)
    // ==========================================
    {
      title: "[Frontend] Phát triển Giao diện Dashboard KPI trực quan",
      description: "Xây dựng các widget, biểu đồ xu hướng 6 tháng và bộ lọc KPI theo cấu trúc PRD.",
      status: "DONE",
      priority: "HIGH",
      weight: 30,
      deadline: new Date("2026-06-10T17:00:00Z"),
      progressPercent: 100,
      tags: ["frontend", "dashboard", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empFrontend.departmentId,
      assigneeId: empFrontend.id,
      startedAt: new Date("2026-06-01T09:00:00Z"),
      submittedAt: new Date("2026-06-09T16:30:00Z"),
      completedAt: new Date("2026-06-10T09:00:00Z"),
      reviewedAt: new Date("2026-06-10T09:00:00Z"),
      reviewedById: leaderBackend.id,
      qualityScoreRaw: 95,
      qualityScore: 95, // Đúng hạn -> Điểm giữ nguyên
      penaltyDays: 0,
      reviewSummary: "Giao diện đẹp mắt, hiệu ứng mượt mà đúng mô tả thiết kế.",
      reviewComment: "Rất xuất sắc, code tối ưu và responsive tốt."
    },
    {
      title: "[Frontend] Tích hợp API Lịch sử đăng nhập & Quản lý phiên",
      description: "Kết nối giao diện cài đặt bảo mật với các API quản lý session và audit logs từ backend.",
      status: "DONE",
      priority: "NORMAL",
      weight: 20,
      deadline: new Date("2026-06-12T17:00:00Z"), // Deadline ngày 12/6 (Thứ sáu)
      progressPercent: 100,
      tags: ["frontend", "security", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empFrontend.departmentId,
      assigneeId: empFrontend.id,
      startedAt: new Date("2026-06-05T08:30:00Z"),
      submittedAt: new Date("2026-06-16T15:00:00Z"), // Nộp trễ ngày 16/6 (Thứ ba tuần sau)
      completedAt: new Date("2026-06-16T16:00:00Z"),
      reviewedAt: new Date("2026-06-16T16:00:00Z"),
      reviewedById: leaderBackend.id,
      qualityScoreRaw: 85,
      penaltyDays: 2, // 15/6 (thứ Hai) và 16/6 (thứ Ba) -> trễ 2 ngày làm việc (không tính T7, CN)
      qualityScore: 65, // Phạt trễ hạn: 85 - 2*10 = 65 điểm
      reviewSummary: "Nộp trễ hạn do vướng CSS layout ở thiết bị di động.",
      reviewComment: "Tính năng chạy tốt nhưng cần rút kinh nghiệm về mặt thời gian."
    },
    {
      title: "[Frontend] Thiết lập cấu hình phím tắt (Keyboard Shortcuts) toàn hệ thống",
      description: "Xây dựng tính năng cho phép người dùng tùy biến và sử dụng phím tắt trên ứng dụng.",
      status: "REVIEW",
      priority: "NORMAL",
      weight: 20,
      deadline: new Date("2026-06-20T17:00:00Z"),
      progressPercent: 100, // Đã hoàn thành 100% và đang nộp nghiệm thu
      tags: ["frontend", "ux", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empFrontend.departmentId,
      assigneeId: empFrontend.id,
      startedAt: new Date("2026-06-15T09:00:00Z"),
      submittedAt: new Date("2026-06-19T14:00:00Z"),
      reviewSummary: "Đã hoàn thành cơ chế phím tắt và test thử nghiệm hoạt động tốt."
    },
    {
      title: "[Frontend] Sửa lỗi CSS và tối ưu hóa tốc độ tải trang Homepage",
      description: "Tối ưu hóa các file ảnh đại diện và lazy load các component nặng trên Dashboard.",
      status: "IN_PROGRESS",
      priority: "LOW",
      weight: 15,
      deadline: new Date("2026-06-25T17:00:00Z"),
      progressPercent: 60, // Đang làm, hoàn thành 60% (đóng góp vào KPI ước lượng)
      tags: ["frontend", "performance", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empFrontend.departmentId,
      assigneeId: empFrontend.id,
      startedAt: new Date("2026-06-22T08:00:00Z")
    },
    {
      title: "[Frontend] Nghiên cứu và thiết kế màn hình Offline / Bảo trì hệ thống",
      description: "Thiết kế màn hình Countdown bảo trì và thông báo offline chuyên nghiệp.",
      status: "TO_DO",
      priority: "LOW",
      weight: 15,
      deadline: new Date("2026-06-30T17:00:00Z"),
      progressPercent: 0,
      tags: ["frontend", "maintenance", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empFrontend.departmentId,
      assigneeId: empFrontend.id
    },

    // ==========================================
    // NHÂN VIÊN 2: Thu QA (employee.qa@workkpi.com)
    // ==========================================
    {
      title: "[QA] Xây dựng bộ testcase tự động cho luồng xác thực Authentication",
      description: "Viết kịch bản test tự động bao gồm đăng nhập sai khóa tài khoản, nhớ thiết bị và hết hạn session.",
      status: "DONE",
      priority: "HIGH",
      weight: 35,
      deadline: new Date("2026-06-08T17:00:00Z"),
      progressPercent: 100,
      tags: ["qa", "testing", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empQa.departmentId,
      assigneeId: empQa.id,
      startedAt: new Date("2026-06-01T09:30:00Z"),
      submittedAt: new Date("2026-06-08T16:00:00Z"),
      completedAt: new Date("2026-06-08T17:30:00Z"),
      reviewedAt: new Date("2026-06-08T17:30:00Z"),
      reviewedById: leaderBackend.id,
      qualityScoreRaw: 90,
      qualityScore: 90,
      penaltyDays: 0,
      reviewSummary: "Bộ kiểm thử bao quát tốt các edge cases về bảo mật."
    },
    {
      title: "[QA] Kiểm thử hiệu năng (Load test) cho module báo cáo KPI",
      description: "Thực hiện mô phỏng tải lớn từ 5000 tasks đồng thời và đo lường thời gian phản hồi API.",
      status: "DONE",
      priority: "HIGH",
      weight: 30,
      deadline: new Date("2026-06-15T17:00:00Z"),
      progressPercent: 100,
      tags: ["qa", "performance", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empQa.departmentId,
      assigneeId: empQa.id,
      startedAt: new Date("2026-06-08T09:00:00Z"),
      submittedAt: new Date("2026-06-15T10:00:00Z"),
      completedAt: new Date("2026-06-15T14:30:00Z"),
      reviewedAt: new Date("2026-06-15T14:30:00Z"),
      reviewedById: leaderBackend.id,
      qualityScoreRaw: 92,
      qualityScore: 92,
      penaltyDays: 0,
      reviewSummary: "Báo cáo tải rất chi tiết, phát hiện được điểm nghẽn truy vấn DB."
    },
    {
      title: "[QA] Viết kịch bản kiểm thử bảo mật (Security testing) phân quyền đa tầng",
      description: "Viết testcase giả lập tài khoản Employee cố gắng gọi API của Admin và Manager.",
      status: "IN_PROGRESS",
      priority: "NORMAL",
      weight: 20,
      deadline: new Date("2026-06-22T17:00:00Z"),
      progressPercent: 80,
      tags: ["qa", "security", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empQa.departmentId,
      assigneeId: empQa.id,
      startedAt: new Date("2026-06-16T09:00:00Z")
    },
    {
      title: "[QA] Soạn thảo tài liệu hướng dẫn kiểm thử nội bộ",
      description: "Chuẩn hóa tài liệu viết bug report và bàn giao sản phẩm kiểm thử.",
      status: "TO_DO",
      priority: "LOW",
      weight: 15,
      deadline: new Date("2026-06-28T17:00:00Z"),
      progressPercent: 0,
      tags: ["qa", "docs", "june-2026-demo"],
      createdById: leaderBackend.id,
      departmentId: empQa.departmentId,
      assigneeId: empQa.id
    },

    // ==========================================
    // NHÂN VIÊN 3: Đạt Support (employee.support@workkpi.com)
    // ==========================================
    {
      title: "[Ops] Cài đặt hệ thống Email phản hồi ticket tự động",
      description: "Thiết lập template email chuyên nghiệp gửi tự động khi khách hàng gửi ticket hỗ trợ.",
      status: "DONE",
      priority: "NORMAL",
      weight: 35,
      deadline: new Date("2026-06-08T17:00:00Z"),
      progressPercent: 100,
      tags: ["ops", "ticket", "june-2026-demo"],
      createdById: leaderCare.id,
      departmentId: empSupport.departmentId,
      assigneeId: empSupport.id,
      startedAt: new Date("2026-06-01T08:30:00Z"),
      submittedAt: new Date("2026-06-05T15:00:00Z"),
      completedAt: new Date("2026-06-05T16:00:00Z"),
      reviewedAt: new Date("2026-06-05T16:00:00Z"),
      reviewedById: leaderCare.id,
      qualityScoreRaw: 88,
      qualityScore: 88,
      penaltyDays: 0,
      reviewSummary: "Hoàn thành sớm, thiết kế template đẹp mắt chuyên nghiệp."
    },
    {
      title: "[Ops] Cập nhật và số hóa tài liệu Thư mục nhân viên",
      description: "Nhập thông tin nhân sự toàn công ty vào danh bạ và phân loại sơ đồ tổ chức.",
      status: "DONE",
      priority: "NORMAL",
      weight: 30,
      deadline: new Date("2026-06-12T17:00:00Z"),
      progressPercent: 100,
      tags: ["ops", "directory", "june-2026-demo"],
      createdById: leaderCare.id,
      departmentId: empSupport.departmentId,
      assigneeId: empSupport.id,
      startedAt: new Date("2026-06-08T09:00:00Z"),
      submittedAt: new Date("2026-06-15T11:00:00Z"), // Trễ 1 ngày làm việc (Deadline thứ Sáu 12/6, nộp thứ Hai 15/6)
      completedAt: new Date("2026-06-15T14:00:00Z"),
      reviewedAt: new Date("2026-06-15T14:00:00Z"),
      reviewedById: leaderCare.id,
      qualityScoreRaw: 85,
      penaltyDays: 1,
      qualityScore: 75, // Bị trừ 10 điểm trễ hạn -> 85 - 10 = 75
      reviewSummary: "Báo cáo nộp trễ do mất thời gian đối chiếu danh bạ từ phòng nhân sự.",
      reviewComment: "Tạm chấp nhận vì lí do khách quan."
    },
    {
      title: "[Ops] Tổ chức chương trình khảo sát chất lượng dịch vụ khách hàng kì I",
      description: "Gửi form khảo sát và tổng hợp báo cáo chỉ số hài lòng của khách hàng (CSAT).",
      status: "PENDING", // Trạng thái PENDING để demo báo cáo vướng mắc
      priority: "HIGH",
      weight: 20,
      deadline: new Date("2026-06-23T17:00:00Z"),
      progressPercent: 30,
      tags: ["ops", "survey", "june-2026-demo"],
      createdById: leaderCare.id,
      departmentId: empSupport.departmentId,
      assigneeId: empSupport.id,
      startedAt: new Date("2026-06-16T10:00:00Z"),
      pendingReason: "Đang chờ bộ phận truyền thông duyệt nội dung email khảo sát.",
      pendingBlockType: "RESOURCE"
    },
    {
      title: "[Ops] Soạn tài liệu quy trình tiếp nhận và xử lý khiếu nại (SOP)",
      description: "Viết quy trình phối hợp 3 bên giữa CS, Product và Tech để giải quyết sự cố.",
      status: "TO_DO",
      priority: "LOW",
      weight: 15,
      deadline: new Date("2026-06-30T17:00:00Z"),
      progressPercent: 0,
      tags: ["ops", "sop", "june-2026-demo"],
      createdById: leaderCare.id,
      departmentId: empSupport.departmentId,
      assigneeId: empSupport.id
    }
  ];

  // 4. Thực thi insert từng task vào database
  console.log(`Bắt đầu tạo ${tasksToCreate.length} task cho tháng 6/2026...`);
  let createdCount = 0;

  for (const t of tasksToCreate) {
    try {
      const task = await prisma.task.create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          weight: t.weight,
          deadline: t.deadline,
          progressPercent: t.progressPercent,
          tags: t.tags,
          createdById: t.createdById,
          departmentId: t.departmentId,
          startedAt: t.startedAt ?? null,
          submittedAt: t.submittedAt ?? null,
          completedAt: t.completedAt ?? null,
          reviewedAt: t.reviewedAt ?? null,
          reviewedById: t.reviewedById ?? null,
          qualityScoreRaw: t.qualityScoreRaw ?? null,
          qualityScore: t.qualityScore ?? null,
          penaltyDays: t.penaltyDays ?? 0,
          reviewSummary: t.reviewSummary ?? null,
          reviewComment: t.reviewComment ?? null,
          pendingReason: t.pendingReason ?? null,
          pendingBlockType: t.pendingBlockType ?? null,
          assignees: {
            create: {
              assigneeId: t.assigneeId
            }
          }
        }
      });
      createdCount++;
      console.log(`- Đã tạo: "${task.title}" cho nhân viên ID: ${t.assigneeId}`);
    } catch (err) {
      console.error(`Lỗi khi tạo task "${t.title}":`, err);
    }
  }

  // 5. Thêm một số Checklist Items cho Task đang REVIEW để tăng độ chân thực
  const reviewTasks = await prisma.task.findMany({
    where: {
      status: "REVIEW",
      tags: { has: "june-2026-demo" }
    }
  });

  console.log(`Đang tạo checklist cho ${reviewTasks.length} task đang chờ nghiệm thu...`);
  for (const rt of reviewTasks) {
    await prisma.taskChecklistItem.createMany({
      data: [
        { taskId: rt.id, title: "Kiểm tra tính năng cốt lõi hoạt động đúng", isDone: true, sortOrder: 1 },
        { taskId: rt.id, title: "Kiểm tra responsive trên Mobile và Tablet", isDone: true, sortOrder: 2 },
        { taskId: rt.id, title: "Review lại code và tối ưu hóa hiệu năng", isDone: true, sortOrder: 3 }
      ]
    });
  }

  // 6. Thêm lịch sử trạng thái (Status History) cho các Task DONE
  const doneTasks = await prisma.task.findMany({
    where: {
      status: "DONE",
      tags: { has: "june-2026-demo" }
    }
  });

  console.log(`Đang tạo lịch sử trạng thái cho ${doneTasks.length} task hoàn thành...`);
  for (const dt of doneTasks) {
    await prisma.taskStatusHistory.createMany({
      data: [
        { taskId: dt.id, fromStatus: "TO_DO", toStatus: "IN_PROGRESS", reason: "Bắt đầu làm việc", actorId: dt.createdById },
        { taskId: dt.id, fromStatus: "IN_PROGRESS", toStatus: "REVIEW", reason: "Nộp nghiệm thu kèm minh chứng", actorId: dt.createdById },
        { taskId: dt.id, fromStatus: "REVIEW", toStatus: "DONE", reason: "Duyệt nghiệm thu và đánh giá chất lượng", actorId: dt.reviewedById || dt.createdById }
      ]
    });
  }

  console.log(`\n=== HOÀN THÀNH ===`);
  console.log(`Tổng số task tạo mới thành công: ${createdCount}/${tasksToCreate.length}`);
  console.log(`Đã gán thành công các kịch bản demo:`);
  console.log(`- employee.frontend@workkpi.com: 5 tasks (Tổng weight 100% - Đủ loại DONE đúng hạn, DONE trễ hạn, REVIEW, IN_PROGRESS, TO_DO)`);
  console.log(`- employee.qa@workkpi.com: 4 tasks (Tổng weight 100% - DONE đúng hạn, DONE xuất sắc, IN_PROGRESS, TO_DO)`);
  console.log(`- employee.support@workkpi.com: 4 tasks (Tổng weight 100% - DONE đúng hạn, DONE trễ 1 ngày bị phạt, PENDING vướng mắc, TO_DO)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
