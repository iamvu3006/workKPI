import { prisma } from "@/lib/db/prisma";
import { calculateKpiFromTasks } from "@/lib/kpi/calculator";

import type { KpiGrade } from "@prisma/client";

export type ReportPeriod = "month" | "quarter" | "year";
export type ProgressPeriod = "week" | "month" | "quarter" | "year";

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
  period?: ReportPeriod;
  periodLabel?: string;
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

export interface ProgressReport extends WeeklyReport {
  period: ProgressPeriod;
  periodLabel: string;
}

export interface CompanyKpiReport {
  month: number;
  year: number;
  period?: ReportPeriod;
  periodLabel?: string;
  departments: Array<{ department_id: string; department_name: string; avg_score: number | null; member_count: number; rank: number }>;
  topPerformers: Array<{ userId: string; fullName: string | null; departmentName: string | null; totalScore: number; grade: KpiGrade }>;
  onTimeRate: number;
}

interface PeriodContext {
  period: ReportPeriod;
  month: number;
  year: number;
  start: Date;
  end: Date;
  months: Array<{ month: number; year: number }>;
  previousMonths: Array<{ month: number; year: number }>;
  label: string;
}

function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function toReportPeriod(value: string | null | undefined): ReportPeriod {
  if (value === "quarter" || value === "year") return value;
  return "month";
}

function getQuarterFromMonth(month: number) {
  return Math.ceil(month / 3);
}

function getPeriodContext({ month, year, period }: { month: number; year: number; period?: ReportPeriod }): PeriodContext {
  const resolvedPeriod = period ?? "month";

  if (resolvedPeriod === "year") {
    return {
      period: resolvedPeriod,
      month,
      year,
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
      months: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, year })),
      previousMonths: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, year: year - 1 })),
      label: `Năm ${year}`,
    };
  }

  if (resolvedPeriod === "quarter") {
    const quarter = getQuarterFromMonth(month);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const prevQuarter = quarter === 1 ? 4 : quarter - 1;
    const prevYear = quarter === 1 ? year - 1 : year;
    const prevStartMonth = (prevQuarter - 1) * 3 + 1;

    return {
      period: resolvedPeriod,
      month,
      year,
      start: new Date(Date.UTC(year, startMonth - 1, 1)),
      end: new Date(Date.UTC(year, endMonth, 0, 23, 59, 59, 999)),
      months: [
        { month: startMonth, year },
        { month: startMonth + 1, year },
        { month: startMonth + 2, year },
      ],
      previousMonths: [
        { month: prevStartMonth, year: prevYear },
        { month: prevStartMonth + 1, year: prevYear },
        { month: prevStartMonth + 2, year: prevYear },
      ],
      label: `Quý ${quarter}/${year}`,
    };
  }

  const { start, end } = getMonthRange(month, year);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return {
    period: "month",
    month,
    year,
    start,
    end,
    months: [{ month, year }],
    previousMonths: [{ month: prevMonth, year: prevYear }],
    label: `Tháng ${month}/${year}`,
  };
}

function toMonthYearOr(whereItems: Array<{ month: number; year: number }>) {
  return whereItems.map((item) => ({ month: item.month, year: item.year }));
}

function getMonday(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

function toWeekRange(weekStart: string) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getProgressRange({
  period,
  weekStart,
  month,
  year,
}: {
  period: ProgressPeriod;
  weekStart?: string;
  month?: number;
  year?: number;
}) {
  const current = new Date();
  const referenceMonth = month ?? current.getMonth() + 1;
  const referenceYear = year ?? current.getFullYear();

  if (period === "week") {
    const start = weekStart ? toWeekRange(weekStart).start : getMonday();
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(end);
    previousEnd.setDate(previousEnd.getDate() - 7);

    return {
      start,
      end,
      previousStart,
      previousEnd,
      label: `Tuần ${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`,
    };
  }

  if (period === "quarter") {
    const quarter = Math.ceil(referenceMonth / 3);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const start = new Date(Date.UTC(referenceYear, startMonth - 1, 1));
    const end = new Date(Date.UTC(referenceYear, endMonth, 0, 23, 59, 59, 999));

    const prevQuarter = quarter === 1 ? 4 : quarter - 1;
    const prevYear = quarter === 1 ? referenceYear - 1 : referenceYear;
    const prevStartMonth = (prevQuarter - 1) * 3 + 1;
    const previousStart = new Date(Date.UTC(prevYear, prevStartMonth - 1, 1));
    const previousEnd = new Date(Date.UTC(prevYear, prevStartMonth + 2, 0, 23, 59, 59, 999));

    return {
      start,
      end,
      previousStart,
      previousEnd,
      label: `Quý ${quarter}/${referenceYear}`,
    };
  }

  if (period === "year") {
    const start = new Date(Date.UTC(referenceYear, 0, 1));
    const end = new Date(Date.UTC(referenceYear, 11, 31, 23, 59, 59, 999));
    const previousStart = new Date(Date.UTC(referenceYear - 1, 0, 1));
    const previousEnd = new Date(Date.UTC(referenceYear - 1, 11, 31, 23, 59, 59, 999));

    return {
      start,
      end,
      previousStart,
      previousEnd,
      label: `Năm ${referenceYear}`,
    };
  }

  const { start, end } = getMonthRange(referenceMonth, referenceYear);
  const prevMonth = referenceMonth === 1 ? 12 : referenceMonth - 1;
  const prevYear = referenceMonth === 1 ? referenceYear - 1 : referenceYear;
  const { start: previousStart, end: previousEnd } = getMonthRange(prevMonth, prevYear);

  return {
    start,
    end,
    previousStart,
    previousEnd,
    label: `Tháng ${referenceMonth}/${referenceYear}`,
  };
}

export async function getMonthlyReport({ departmentId, month, year, period }: {
  departmentId?: string | null;
  month: number;
  year: number;
  period?: ReportPeriod;
}): Promise<MonthlyReport> {
  // Fetch department if provided
  const department = departmentId
    ? await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true, name: true } })
    : null;

  const periodContext = getPeriodContext({ month, year, period });
  const { start, end, months, previousMonths } = periodContext;

  // Find all profiles in department (or all if none)
  const profiles = await prisma.profile.findMany({
    where: departmentId ? { departmentId } : {},
    select: {
      id: true,
      fullName: true,
      email: true,
      kpiRecords: {
        where: { OR: toMonthYearOr(months) },
        orderBy: [{ year: "asc" }, { month: "asc" }],
        select: { totalScore: true, grade: true, taskBreakdown: true, onTimeRate: true },
      },
    },
  });

  const members = profiles.map((p) => {
    const records = Array.isArray(p.kpiRecords) ? p.kpiRecords : [];
    const latestRecord = records[records.length - 1];
    const scoreCount = records.length;
    const totalScore = records.reduce((sum, rec) => sum + rec.totalScore, 0);
    const totalOnTimeRate = records.reduce((sum, rec) => sum + rec.onTimeRate, 0);
    const tasksCompleted = records.reduce((sum, rec) => sum + (Array.isArray(rec.taskBreakdown) ? rec.taskBreakdown.length : 0), 0);

    return {
      userId: p.id,
      fullName: p.fullName ?? null,
      email: p.email,
      kpiScore: scoreCount ? Math.round((totalScore / scoreCount) * 100) / 100 : null,
      grade: latestRecord?.grade ?? null,
      tasksCompleted,
      onTimeRate: scoreCount ? Math.round((totalOnTimeRate / scoreCount) * 100) / 100 : null,
    };
  });

  const kpiRecordCount = await prisma.kpiRecord.count({
    where: {
      OR: toMonthYearOr(months),
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

  const prevMonthScores = await prisma.kpiRecord.findMany({
    where: {
      OR: toMonthYearOr(previousMonths),
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
    period: periodContext.period,
    periodLabel: periodContext.label,
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

export async function getCompanyKpi({ month, year, period }: { month: number; year: number; period?: ReportPeriod }): Promise<CompanyKpiReport> {
  const periodContext = getPeriodContext({ month, year, period });

  const [departmentList, records] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, name: true, _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.kpiRecord.findMany({
      where: { OR: toMonthYearOr(periodContext.months) },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            departmentId: true,
            department: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const deptAgg = new Map<string, { total: number; count: number }>();
  const userAgg = new Map<string, { userId: string; fullName: string | null; departmentName: string | null; total: number; count: number; grade: KpiGrade }>();

  for (const record of records) {
    const deptId = record.user.departmentId;
    if (deptId) {
      const existingDept = deptAgg.get(deptId) ?? { total: 0, count: 0 };
      existingDept.total += record.totalScore;
      existingDept.count += 1;
      deptAgg.set(deptId, existingDept);
    }

    const existingUser = userAgg.get(record.user.id) ?? {
      userId: record.user.id,
      fullName: record.user.fullName ?? null,
      departmentName: record.user.department?.name ?? null,
      total: 0,
      count: 0,
      grade: record.grade,
    };
    existingUser.total += record.totalScore;
    existingUser.count += 1;
    existingUser.grade = record.grade;
    userAgg.set(record.user.id, existingUser);
  }

  const departments = departmentList
    .map((dept) => {
      const agg = deptAgg.get(dept.id);
      const avgScore = agg && agg.count ? Math.round((agg.total / agg.count) * 100) / 100 : null;
      return {
        department_id: dept.id,
        department_name: dept.name,
        avg_score: avgScore,
        member_count: dept._count.members,
        rank: 0,
      };
    })
    .sort((a, b) => {
      if (a.avg_score === null && b.avg_score === null) return a.department_name.localeCompare(b.department_name);
      if (a.avg_score === null) return 1;
      if (b.avg_score === null) return -1;
      return b.avg_score - a.avg_score;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const topPerformers = Array.from(userAgg.values())
    .map((item) => ({
      userId: item.userId,
      fullName: item.fullName,
      departmentName: item.departmentName,
      totalScore: Math.round((item.total / item.count) * 100) / 100,
      grade: item.grade,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 20);

  const onTimeRate = records.length
    ? Math.round((records.reduce((sum, record) => sum + record.onTimeRate, 0) / records.length) * 100) / 100
    : 0;

  return {
    month,
    year,
    period: periodContext.period,
    periodLabel: periodContext.label,
    departments,
    topPerformers,
    onTimeRate,
  };
}

export async function getWeeklyReport({
  departmentId,
  weekStart,
  assigneeId,
  teamId,
}: {
  departmentId?: string | null;
  weekStart: string;
  assigneeId?: string;
  teamId?: string;
}): Promise<WeeklyReport> {
  const { start, end } = toWeekRange(weekStart);

  const scopedAssigneeIds = teamId
    ? (
      await prisma.profile.findMany({
        where: { teamId, status: "ACTIVE" },
        select: { id: true },
      })
    ).map((profile) => profile.id)
    : null;

  const department = departmentId
    ? await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true, name: true } })
    : null;

  const where: any = {
    deletedAt: null,
    createdAt: { lte: end },
    OR: [{ updatedAt: { gte: start, lte: end } }, { completedAt: { gte: start, lte: end } }],
  };
  if (departmentId) where.departmentId = departmentId;
  if (assigneeId) where.assignees = { some: { assigneeId } };
  if (scopedAssigneeIds) {
    where.assignees = { some: { assigneeId: { in: scopedAssigneeIds } } };
  }

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
  if (assigneeId) prevWhere.assignees = { some: { assigneeId } };
  if (scopedAssigneeIds) {
    prevWhere.assignees = { some: { assigneeId: { in: scopedAssigneeIds } } };
  }

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

export async function getProgressReport({
  period,
  weekStart,
  month,
  year,
  departmentId,
  assigneeId,
  teamId,
}: {
  period: ProgressPeriod;
  weekStart?: string;
  month?: number;
  year?: number;
  departmentId?: string | null;
  assigneeId?: string;
  teamId?: string;
}): Promise<ProgressReport> {
  const range = getProgressRange({ period, weekStart, month, year });

  const scopedAssigneeIds = teamId
    ? (
      await prisma.profile.findMany({
        where: { teamId, status: "ACTIVE" },
        select: { id: true },
      })
    ).map((profile) => profile.id)
    : null;

  const department = departmentId
    ? await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true, name: true } })
    : null;

  const where: any = {
    deletedAt: null,
    createdAt: { lte: range.end },
    OR: [{ updatedAt: { gte: range.start, lte: range.end } }, { completedAt: { gte: range.start, lte: range.end } }],
  };
  if (departmentId) where.departmentId = departmentId;
  if (assigneeId) where.assignees = { some: { assigneeId } };
  if (scopedAssigneeIds) {
    where.assignees = { some: { assigneeId: { in: scopedAssigneeIds } } };
  }

  const tasks = await prisma.task.findMany({
    where,
    select: {
      status: true,
      completedAt: true,
      deadline: true,
      statusHistory: {
        where: { createdAt: { lte: range.end } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { toStatus: true },
      },
    },
  });

  const statusAtRangeEnd = (task: (typeof tasks)[number]) => task.statusHistory[0]?.toStatus ?? task.status;

  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      const snapshotStatus = statusAtRangeEnd(task);
      if (snapshotStatus === "DONE") acc.done += 1;
      else if (snapshotStatus === "IN_PROGRESS") acc.inProgress += 1;
      else if (snapshotStatus === "PENDING") acc.pending += 1;
      else if (snapshotStatus === "REVIEW") acc.review += 1;
      return acc;
    },
    { done: 0, inProgress: 0, pending: 0, review: 0 }
  );

  const completed = tasks.filter((task) => statusAtRangeEnd(task) === "DONE" && task.completedAt);
  const onTime = completed.filter((task) => {
    const deadline = new Date(task.deadline);
    deadline.setHours(23, 59, 59, 999);
    return task.completedAt! <= deadline;
  }).length;
  const onTimeRate = completed.length ? Math.round((onTime / completed.length) * 10000) / 100 : 0;

  let previousStart = new Date(range.previousStart);
  let previousEnd = new Date(range.previousEnd);
  if (period === "week") {
    // already aligned by getProgressRange
  }

  const prevWhere: any = {
    deletedAt: null,
    createdAt: { lte: previousEnd },
    OR: [{ updatedAt: { gte: previousStart, lte: previousEnd } }, { completedAt: { gte: previousStart, lte: previousEnd } }],
  };
  if (departmentId) prevWhere.departmentId = departmentId;
  if (assigneeId) prevWhere.assignees = { some: { assigneeId } };
  if (scopedAssigneeIds) {
    prevWhere.assignees = { some: { assigneeId: { in: scopedAssigneeIds } } };
  }

  const prevTasks = await prisma.task.findMany({
    where: prevWhere,
    select: {
      status: true,
      completedAt: true,
      deadline: true,
      statusHistory: {
        where: { createdAt: { lte: previousEnd } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { toStatus: true },
      },
    },
  });

  const prevStatusAtRangeEnd = (task: (typeof prevTasks)[number]) => task.statusHistory[0]?.toStatus ?? task.status;
  const prevDone = prevTasks.filter((task) => prevStatusAtRangeEnd(task) === "DONE").length;
  const prevCompleted = prevTasks.filter((task) => prevStatusAtRangeEnd(task) === "DONE" && task.completedAt);
  const prevOnTime = prevCompleted.filter((task) => {
    const deadline = new Date(task.deadline);
    deadline.setHours(23, 59, 59, 999);
    return task.completedAt! <= deadline;
  }).length;
  const prevOnTimeRate = prevCompleted.length ? Math.round((prevOnTime / prevCompleted.length) * 10000) / 100 : 0;

  return {
    period,
    periodLabel: range.label,
    weekStart: range.start.toISOString(),
    weekEnd: range.end.toISOString(),
    department: department ? { id: department.id, name: department.name } : null,
    tasksByStatus,
    onTimeRate,
    comparedToPrevWeek: {
      done: tasksByStatus.done - prevDone,
      onTimeRate: Math.round((onTimeRate - prevOnTimeRate) * 100) / 100,
    },
  };
}
