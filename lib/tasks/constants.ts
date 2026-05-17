import type { TaskPriority, TaskStatus } from "@prisma/client";

export const VALID_WEIGHTS = [5, 10, 20, 30, 35] as const;
export type TaskWeight = (typeof VALID_WEIGHTS)[number];

export const MAX_TAGS_PER_TASK = 5;
export const WEIGHT_WARN_PERCENT = 80;
export const WEIGHT_MAX_PERCENT = 100;
export const MIN_REJECT_REASON_LENGTH = 20;
export const MIN_EXTEND_REASON_LENGTH = 20;

export const TASK_ATTACHMENT_BUCKET = "task-attachments";
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TASK_TOTAL_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const TASK_STATUSES: TaskStatus[] = [
  "TO_DO",
  "IN_PROGRESS",
  "PENDING",
  "REVIEW",
  "DONE",
  "CANCELLED",
];

export const KANBAN_COLUMNS: TaskStatus[] = [
  "TO_DO",
  "IN_PROGRESS",
  "PENDING",
  "REVIEW",
  "DONE",
];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Thấp",
  NORMAL: "Bình thường",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TO_DO: "To-Do",
  IN_PROGRESS: "In Progress",
  PENDING: "Pending",
  REVIEW: "Review",
  DONE: "Done",
  CANCELLED: "Đã hủy",
};
