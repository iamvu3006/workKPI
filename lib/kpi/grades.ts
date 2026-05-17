import type { KpiGrade } from "@prisma/client";

export const GRADE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  PASS: 65,
} as const;

export const GRADE_LABELS: Record<KpiGrade, string> = {
  EXCELLENT: "Xuất sắc",
  GOOD: "Tốt",
  PASS: "Đạt",
  NEEDS_IMPROVEMENT: "Cần cải thiện",
};

export function scoreToGrade(totalScore: number): KpiGrade {
  if (totalScore >= GRADE_THRESHOLDS.EXCELLENT) return "EXCELLENT";
  if (totalScore >= GRADE_THRESHOLDS.GOOD) return "GOOD";
  if (totalScore >= GRADE_THRESHOLDS.PASS) return "PASS";
  return "NEEDS_IMPROVEMENT";
}
