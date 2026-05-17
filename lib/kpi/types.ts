export interface TaskKpiContribution {
  taskId: string;
  taskTitle: string;
  weight: number;
  progress: number;
  qualityScore: number;
  penaltyDays: number;
  contribution: number;
}

export interface KpiCalculationResult {
  totalScore: number;
  taskBreakdown: TaskKpiContribution[];
  onTimeRate: number;
}

export interface SelfAssessmentPayload {
  quality: number;
  timeliness: number;
  collaboration: number;
  comment: string;
}
