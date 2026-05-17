import type { SelfAssessmentPayload } from "./types";

const MIN_COMMENT_LENGTH = 20;

export function validateSelfAssessment(value: unknown): { ok: true; data: SelfAssessmentPayload } | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Cần tự đánh giá trước khi nộp." };
  }

  const o = value as Record<string, unknown>;
  const fields = ["quality", "timeliness", "collaboration"] as const;

  for (const key of fields) {
    const n = o[key];
    if (typeof n !== "number" || n < 1 || n > 5 || !Number.isInteger(n)) {
      return { ok: false, error: `Tiêu chí "${key}" phải là số nguyên từ 1 đến 5.` };
    }
  }

  const comment = typeof o.comment === "string" ? o.comment.trim() : "";
  if (comment.length < MIN_COMMENT_LENGTH) {
    return { ok: false, error: `Nhận xét tự đánh giá cần ít nhất ${MIN_COMMENT_LENGTH} ký tự.` };
  }

  return {
    ok: true,
    data: {
      quality: o.quality as number,
      timeliness: o.timeliness as number,
      collaboration: o.collaboration as number,
      comment,
    },
  };
}

export const SELF_ASSESSMENT_CRITERIA = [
  { key: "quality" as const, label: "Chất lượng công việc" },
  { key: "timeliness" as const, label: "Tiến độ / đúng hạn" },
  { key: "collaboration" as const, label: "Phối hợp" },
];
