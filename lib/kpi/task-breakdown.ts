import type { TaskKpiContribution } from "./types";

type LegacyTaskBreakdownSummary = {
  done?: number;
  inProgress?: number;
  overdue?: number;
  pending?: number;
};

export function normalizeTaskBreakdown(value: unknown): TaskKpiContribution[] {
  return Array.isArray(value) ? value : [];
}

export function countTaskBreakdownItems(value: unknown): number {
  if (Array.isArray(value)) return value.length;

  if (value && typeof value === "object") {
    const summary = value as LegacyTaskBreakdownSummary;
    return typeof summary.done === "number" ? summary.done : 0;
  }

  return 0;
}