require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function taskContribution(progress, qualityScore, weight) {
  const p = Math.min(100, Math.max(0, progress)) / 100;
  const q = Math.min(100, Math.max(0, qualityScore)) / 100;
  const w = weight / 100;
  return Math.round(p * q * w * 10000) / 100;
}

function calculateKpiFromTasks(tasks) {
  const breakdown = tasks.map((t) => {
    const progress = t.progressPercent ?? 100;
    const qualityScore = t.qualityScore ?? 0;
    const contribution = taskContribution(progress, qualityScore, t.weight);
    return {
      taskId: t.id,
      taskTitle: t.title,
      weight: t.weight,
      progress,
      qualityScore,
      penaltyDays: t.penaltyDays ?? 0,
      contribution,
    };
  });

  const totalScore = Math.round(breakdown.reduce((sum, b) => sum + b.contribution, 0) * 100) / 100;

  let onTimeCount = 0;
  for (const t of tasks) {
    if (!t.completedAt) continue;
    const deadline = new Date(t.deadline);
    deadline.setHours(23, 59, 59, 999);
    const completed = new Date(t.completedAt);
    if (completed <= deadline) onTimeCount += 1;
  }
  const onTimeRate = tasks.length > 0 ? Math.round((onTimeCount / tasks.length) * 10000) / 100 : 0;

  return { totalScore, taskBreakdown: breakdown, onTimeRate };
}

function scoreToGrade(score) {
  if (score >= 90) return "EXCELLENT";
  if (score >= 80) return "GOOD";
  if (score >= 65) return "PASS";
  return "NEEDS_IMPROVEMENT";
}

async function main() {
  console.log("=== BẮT ĐẦU TÍNH TOÁN & CHỐT KPI THÁNG 6/2026 ===");

  // 1. Tìm người tính KPI (Admin)
  const admin = await prisma.profile.findFirst({
    where: { role: "ADMIN" }
  });
  if (!admin) {
    throw new Error("Không tìm thấy tài khoản ADMIN trong hệ thống.");
  }
  console.log(`Người thực hiện chốt KPI: ${admin.fullName} (${admin.email})`);

  // 2. Lấy tất cả active profiles cần tính KPI (Trừ ADMIN)
  const activeProfiles = await prisma.profile.findMany({
    where: {
      status: "ACTIVE",
      role: { not: "ADMIN" }
    },
    select: { id: true, email: true, fullName: true }
  });
  
  const userIds = activeProfiles.map(p => p.id);
  console.log(`Số lượng nhân sự cần chốt KPI: ${userIds.length}`);

  // 3. Cấu hình mốc thời gian tháng 6/2026
  const month = 6;
  const year = 2026;
  const start = new Date("2026-06-01T00:00:00.000Z");
  const end = new Date("2026-06-30T23:59:59.999Z");

  const results = [];

  for (const userId of userIds) {
    const profile = activeProfiles.find(p => p.id === userId);
    
    // Lấy tất cả task DONE được duyệt hoàn thành trong tháng 6/2026 của user này
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        status: "DONE",
        completedAt: { gte: start, lte: end },
        assignees: { some: { assigneeId: userId } },
        qualityScore: { not: null },
      },
      select: {
        id: true,
        title: true,
        weight: true,
        progressPercent: true,
        qualityScore: true,
        penaltyDays: true,
        deadline: true,
        completedAt: true,
        submittedAt: true,
      },
    });

    const calc = calculateKpiFromTasks(tasks);
    const grade = scoreToGrade(calc.totalScore);

    // Upsert bản ghi KpiRecord cho tháng 6/2026
    await prisma.kpiRecord.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      create: {
        userId,
        month,
        year,
        totalScore: calc.totalScore,
        grade,
        taskBreakdown: calc.taskBreakdown,
        onTimeRate: calc.onTimeRate,
        calculatedById: admin.id,
      },
      update: {
        totalScore: calc.totalScore,
        grade,
        taskBreakdown: calc.taskBreakdown,
        onTimeRate: calc.onTimeRate,
        calculatedAt: new Date(),
        calculatedById: admin.id,
      },
    });

    results.push({
      fullName: profile.fullName,
      email: profile.email,
      totalScore: calc.totalScore,
      grade: grade,
      doneTaskCount: tasks.length
    });
  }

  console.log(`\n=== KẾT QUẢ CHỐT KPI THÁNG ${month}/${year} ===`);
  console.log(`Tổng số bản ghi KPI đã lưu: ${results.length}`);
  
  for (const res of results) {
    console.log(`- ${res.fullName} (${res.email}): ${res.totalScore.toFixed(2)} điểm (Từ ${res.doneTaskCount} Tasks) -> Xếp loại: [${res.grade}]`);
  }

  console.log("\n=== HOÀN THÀNH ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
