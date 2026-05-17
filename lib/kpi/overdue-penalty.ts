/** Count business days (Mon–Fri) from start (exclusive of end) to end (inclusive of penalty days after deadline). */
export function countBusinessDaysBetween(start: Date, end: Date): number {
  const from = new Date(start);
  from.setHours(0, 0, 0, 0);
  const to = new Date(end);
  to.setHours(0, 0, 0, 0);

  if (to <= from) return 0;

  let days = 0;
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= to) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export interface OverduePenaltyResult {
  penaltyDays: number;
  qualityScoreRaw: number;
  qualityScoreAfterPenalty: number;
  penaltyPoints: number;
}

/**
 * Điểm sau phạt = max(0, điểm_gốc - 10 × số_ngày_trễ) — số ngày trễ tính theo ngày làm việc.
 */
export function applyOverduePenalty(
  qualityScoreRaw: number,
  deadline: Date,
  approvedAt: Date
): OverduePenaltyResult {
  const raw = Math.min(100, Math.max(0, Math.round(qualityScoreRaw)));
  const penaltyDays = countBusinessDaysBetween(deadline, approvedAt);
  const penaltyPoints = penaltyDays * 10;
  const qualityScoreAfterPenalty = Math.max(0, raw - penaltyPoints);

  return {
    penaltyDays,
    qualityScoreRaw: raw,
    qualityScoreAfterPenalty,
    penaltyPoints,
  };
}
