import { prisma } from "@/lib/db/prisma";
import { calculateKpiFromTasks } from "@/lib/kpi/calculator";

import type { KpiGrade } from "@prisma/client";

export interface MonthlyReportMember {
  userId: string;
  fullName: string | null;
  email: string;
  kpiScore: number | null;
  grade: KpiGrade | null;
  tasksCompleted: number;
  onTimeRate: number | null;
}

export interface MonthlyReport {
  month: number;
  year: number;
  department: { id: string; name: string } | null;
  kpiCalculated: boolean;
  summary: {
    totalTasks: number;
    doneTasks: number;
    lateTasks: number;
    cancelledTasks: number;
    onTimeRate: number;
  };
  avgKpiScore: number | null;
  comparedToPrevMonth?: number;
  members: MonthlyReportMember[];
  topPerformer?: { userId: string; fullName: string | null; kpiScore: number };
  bottomPerformer?: { userId: string; fullName: string | null; kpiScore: number };
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  department: { id: string; name: string } | null;
  tasksByStatus: { done: number; inProgress: number; pending: number; review: number };
  onTimeRate: number;
  comparedToPrevWeek: { done: number; onTimeRate: number };
}

export interface CompanyKpiReport {
  month: number;
  year: number;
  departments: Array<{ department_id: string; department_name: string; avg_score: number | null; member_count: number; rank: number }>;
  topPerformers: Array<{ userId: string; fullName: string | null; departmentName: string | null; totalScore: number; grade: KpiGrade }>;
  onTimeRate: number;
}

function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function toWeekRange(weekStart: string) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getMonthlyReport({ departmentId, month, year }: {
  departmentId?: string | null;
  month: number;
  year: number;
}): Promise<MonthlyReport> {
  // Fetch department if provided
  const department = departmentId
    ? await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true, name: true } })
    : null;

  const { start, end } = getMonthRange(month, year);

  // Find all profiles in department (or all if none)
  const profiles = await prisma.profile.findMany({
    where: departmentId ? { departmentId } : {},
    select: {
      id: true,
      fullName: true,
      email: true,
      kpiRecords: {
        where: { month, year },
        select: { totalScore: true, grade: true, taskBreakdown: true, onTimeRate: true },
      },
    },
  });

  const members = profiles.map((p) => {
    const rec = p.kpiRecords?.[0];
    return {
      userId: p.id,
      fullName: p.fullName ?? null,
      email: p.email,
      kpiScore: rec?.totalScore ?? null,
      grade: rec?.grade ?? null,
      tasksCompleted: Array.isArray(rec?.taskBreakdown) ? rec!.taskBreakdown.length : 0,
      onTimeRate: rec?.onTimeRate ?? null,
    };
  });

  const kpiRecordCount = await prisma.kpiRecord.count({
    where: {
      month,
      year,
      ...(departmentId ? { user: { departmentId } } : {}),
    },
  });

  const scores = members.map((m) => (m.kpiScore ?? 0));
  const avgKpi = members.length ? Math.round((scores.reduce((a, b) => a + b, 0) / members.length) * 100) / 100 : null;

  const taskWhere: any = {
    deletedAt: null,
    createdAt: { lte: end },
    deadline: { gte: start, lte: end },
  };
  if (departmentId) taskWhere.departmentId = departmentId;

  const monthTasks = await prisma.task.findMany({
    where: taskWhere,
    select: { status: true, completedAt: true, deadline: true },
  });

  let doneTasks = 0;
  let lateTasks = 0;
  let cancelledTasks = 0;
  for (const task of monthTasks) {
    if (task.status === "DONE") doneTasks += 1;
    if (task.status === "CANCELLED") cancelledTasks += 1;
    if (task.completedAt) {
      const deadline = new Date(task.deadline);
      deadline.setHours(23, 59, 59, 999);
      if (task.completedAt > deadline) lateTasks += 1;
    }
  }

  // Basic summary: TODO: refine counts by querying tasks explicitly
  const summary = {
    totalTasks: monthTasks.length,
    doneTasks,
    lateTasks,
    cancelledTasks,
    onTimeRate: members.length ? Math.round((members.reduce((s, m) => s + (m.onTimeRate ?? 0), 0) / members.length) * 100) / 100 : 0,
  };

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthScores = await prisma.kpiRecord.findMany({
    where: {
      month: prevMonth,
      year: prevYear,
      ...(departmentId ? { user: { departmentId } } : {}),
    },
    select: { totalScore: true },
  });
  const prevAvg = prevMonthScores.length
    ? prevMonthScores.reduce((sum, record) => sum + record.totalScore, 0) / prevMonthScores.length
    : null;

  const sortedByScore = members.filter((m) => m.kpiScore !== null).sort((a, b) => (b.kpiScore! - a.kpiScore!));

  return {
    month,
    year,
    department: department ? { id: department.id, name: department.name } : null,
    kpiCalculated: kpiRecordCount > 0,
    summary,
    avgKpiScore: avgKpi,
    members,
    comparedToPrevMonth: prevAvg === null || avgKpi === null ? undefined : Math.round((avgKpi - prevAvg) * 100) / 100,
    topPerformer: sortedByScore[0]
      ? { userId: sortedByScore[0].userId, fullName: sortedByScore[0].fullName, kpiScore: sortedByScore[0].kpiScore ?? 0 }
      : undefined,
    bottomPerformer: sortedByScore[sortedByScore.length - 1]
      ? { userId: sortedByScore[sortedByScore.length - 1].userId, fullName: sortedByScore[sortedByScore.length - 1].fullName, kpiScore: sortedByScore[sortedByScore.length - 1].kpiScore ?? 0 }
      : undefined,
  };
}

export async function getMonthlyReportPaginated({ departmentId, month, year, page = 1, pageSize = 100 }:{
  departmentId?: string | null;
  month: number;
  year: number;
  page?: number;
  pageSize?: number;
}) {
  const where: any = { month, year };
  if (departmentId) where.user = { departmentId };

  const total = await prisma.kpiRecord.count({ where });

  const records = await prisma.kpiRecord.findMany({
    where,
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { totalScore: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const members: MonthlyReportMember[] = records.map((r) => ({
    userId: r.user.id,
    fullName: r.user.fullName ?? null,
    email: r.user.email,
    kpiScore: r.totalScore ?? null,
    grade: r.grade ?? null,
    tasksCompleted: Array.isArray(r.taskBreakdown) ? r.taskBreakdown.length : 0,
    onTimeRate: r.onTimeRate ?? null,
  }));

  const avgKpi = records.length ? Math.round((records.reduce((s, r) => s + (r.totalScore ?? 0), 0) / records.length) * 100) / 100 : null;

  const department = departmentId ? await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true, name: true } }) : null;

  return {
    month,
    year,
    department: department ? { id: department.id, name: department.name } : null,
    kpiCalculated: total > 0,
    summary: {
      totalTasks: 0,
      doneTasks: 0,
      lateTasks: 0,
      cancelledTasks: 0,
      onTimeRate: avgKpi ?? 0,
    },
    avgKpiScore: avgKpi,
    members,
    topPerformer: members[0] ? { userId: members[0].userId, fullName: members[0].fullName, kpiScore: members[0].kpiScore ?? 0 } : undefined,
    bottomPerformer: members[members.length - 1] ? { userId: members[members.length - 1].userId, fullName: members[members.length - 1].fullName, kpiScore: members[members.length - 1].kpiScore ?? 0 } : undefined,
    meta: { total, page, pageSize, pages: Math.ceil(total / pageSize) },
  } as any;
}

export async function getCompanyKpi({ month, year }: { month: number; year: number }): Promise<CompanyKpiReport> {
  const departmentRows = await prisma.$queryRawUnsafe<Array<{ department_id: string; department_name: string; avg_score: number | null; member_count: number }>>(
    `
    SELECT d.id as department_id, d.name as department_name, AVG(k.total_score) as avg_score, COUNT(DISTINCT p.id) as member_count
    FROM departments d
    LEFT JOIN profiles p ON p.department_id = d.id
    LEFT JOIN kpi_records k ON k.user_id = p.id AND k.month = $1 AND k.year = $2
    GROUP BY d.id, d.name
    ORDER BY avg_score DESC NULLS LAST, d.name ASC
  `,
    month,
    year
  );

  const departments = departmentRows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));

  const topRecords = await prisma.kpiRecord.findMany({
    where: { month, year },
    orderBy: { totalScore: "desc" },
    take: 5,
    include: { user: { select: { id: true, fullName: true, departmentId: true, department: { select: { name: true } } } } },
  });

  const onTimeRows = await prisma.kpiRecord.findMany({
    where: { month, year },
    select: { onTimeRate: true },
  });

  const onTimeRate = onTimeRows.length
    ? Math.round((onTimeRows.reduce((sum, record) => sum + record.onTimeRate, 0) / onTimeRows.length) * 100) / 100
    : 0;

  return {
    month,
    year,
    departments,
    topPerformers: topRecords.map((record) => ({
      userId: record.user.id,
      fullName: record.user.fullName ?? null,
      departmentName: record.user.department?.name ?? null,
      totalScore: record.totalScore,
      grade: record.grade,
    })),
    onTimeRate,
  };
}

export async function getWeeklyReport({ departmentId, weekStart }: { departmentId?: string | null; weekStart: string }): Promise<WeeklyReport> {
  const { start, end } = toWeekRange(weekStart);

  const department = departmentId
    ? await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true, name: true } })
    : null;

  const where: any = {
    deletedAt: null,
    createdAt: { lte: end },
    OR: [{ updatedAt: { gte: start, lte: end } }, { completedAt: { gte: start, lte: end } }],
  };
  if (departmentId) where.departmentId = departmentId;

  const tasks = await prisma.task.findMany({
    where,
    select: {
      status: true,
      completedAt: true,
      deadline: true,
      statusHistory: {
        where: { createdAt: { lte: end } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { toStatus: true },
      },
    },
  });

  const statusAtWeekEnd = (task: (typeof tasks)[number]) => task.statusHistory[0]?.toStatus ?? task.status;

  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      const snapshotStatus = statusAtWeekEnd(task);
      if (snapshotStatus === "DONE") acc.done += 1;
      else if (snapshotStatus === "IN_PROGRESS") acc.inProgress += 1;
      else if (snapshotStatus === "PENDING") acc.pending += 1;
      else if (snapshotStatus === "REVIEW") acc.review += 1;
      return acc;
    },
    { done: 0, inProgress: 0, pending: 0, review: 0 }
  );

  const completed = tasks.filter((task) => statusAtWeekEnd(task) === "DONE" && task.completedAt);
  const onTime = completed.filter((task) => {
    const deadline = new Date(task.deadline);
    deadline.setHours(23, 59, 59, 999);
    return task.completedAt! <= deadline;
  }).length;
  const onTimeRate = completed.length ? Math.round((onTime / completed.length) * 10000) / 100 : 0;

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - 7);
  const prevEnd = new Date(end);
  prevEnd.setDate(prevEnd.getDate() - 7);

  const prevWhere: any = {
    deletedAt: null,
    createdAt: { lte: prevEnd },
    OR: [{ updatedAt: { gte: prevStart, lte: prevEnd } }, { completedAt: { gte: prevStart, lte: prevEnd } }],
  };
  if (departmentId) prevWhere.departmentId = departmentId;

  const prevTasks = await prisma.task.findMany({
    where: prevWhere,
    select: {
      status: true,
      completedAt: true,
      deadline: true,
      statusHistory: {
        where: { createdAt: { lte: prevEnd } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { toStatus: true },
      },
    },
  });

  const prevStatusAtWeekEnd = (task: (typeof prevTasks)[number]) => task.statusHistory[0]?.toStatus ?? task.status;
  const prevDone = prevTasks.filter((task) => prevStatusAtWeekEnd(task) === "DONE").length;
  const prevCompleted = prevTasks.filter((task) => prevStatusAtWeekEnd(task) === "DONE" && task.completedAt);
  const prevOnTime = prevCompleted.filter((task) => {
    const deadline = new Date(task.deadline);
    deadline.setHours(23, 59, 59, 999);
    return task.completedAt! <= deadline;
  }).length;
  const prevOnTimeRate = prevCompleted.length ? Math.round((prevOnTime / prevCompleted.length) * 10000) / 100 : 0;

  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    department: department ? { id: department.id, name: department.name } : null,
    tasksByStatus,
    onTimeRate,
    comparedToPrevWeek: {
      done: tasksByStatus.done - prevDone,
      onTimeRate: Math.round((onTimeRate - prevOnTimeRate) * 100) / 100,
    },
  };
}
