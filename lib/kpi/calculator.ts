import type { Task } from "@prisma/client";

import type { KpiCalculationResult, TaskKpiContribution } from "./types";

type TaskForKpi = Pick<
  Task,
  "id" | "title" | "weight" | "progressPercent" | "qualityScore" | "penaltyDays" | "deadline" | "completedAt" | "submittedAt"
>;

export function taskContribution(
  progress: number,
  qualityScore: number,
  weight: number
): number {
  const p = Math.min(100, Math.max(0, progress)) / 100;
  const q = Math.min(100, Math.max(0, qualityScore)) / 100;
  const w = weight / 100;
  return Math.round(p * q * w * 10000) / 100;
}

export function calculateKpiFromTasks(tasks: TaskForKpi[]): KpiCalculationResult {
  const breakdown: TaskKpiContribution[] = tasks.map((t) => {
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

/** Ước tính: DONE dùng điểm thật; task khác dùng progress hiện tại và quality giả định = progress. */
export function calculateKpiEstimate(
  doneTasks: TaskForKpi[],
  inProgressTasks: Pick<Task, "id" | "title" | "weight" | "progressPercent">[]
): KpiCalculationResult {
  const doneResult = calculateKpiFromTasks(doneTasks);
  const estimatedParts: TaskKpiContribution[] = inProgressTasks.map((t) => {
    const progress = t.progressPercent ?? 0;
    const assumedQuality = progress;
    const contribution = taskContribution(progress, assumedQuality, t.weight);
    return {
      taskId: t.id,
      taskTitle: t.title,
      weight: t.weight,
      progress,
      qualityScore: assumedQuality,
      penaltyDays: 0,
      contribution,
    };
  });

  const allBreakdown = [...doneResult.taskBreakdown, ...estimatedParts];
  const totalScore =
    Math.round(allBreakdown.reduce((sum, b) => sum + b.contribution, 0) * 100) / 100;

  return {
    totalScore,
    taskBreakdown: allBreakdown,
    onTimeRate: doneResult.onTimeRate,
  };
}
