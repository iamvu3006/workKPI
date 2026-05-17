import type { TaskPriority } from "@prisma/client";

import { MAX_TAGS_PER_TASK, VALID_WEIGHTS } from "./constants";

export function parseDeadline(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return null;
  return d;
}

export function isValidPriority(p: unknown): p is TaskPriority {
  return ["LOW", "NORMAL", "HIGH", "URGENT"].includes(p as string);
}

export function parseTags(tags: unknown): string[] | null {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean);
  if (cleaned.length > MAX_TAGS_PER_TASK) return null;
  return cleaned;
}

export function parseWeight(weight: unknown): number | null {
  const n = typeof weight === "number" ? weight : parseInt(String(weight), 10);
  if (!(VALID_WEIGHTS as readonly number[]).includes(n)) return null;
  return n;
}

export function parseAssigneeIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  if (!ids.every((id) => typeof id === "string" && id.length > 0)) return null;
  return ids;
}
