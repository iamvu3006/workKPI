import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_TASK_TOTAL_BYTES,
  TASK_ATTACHMENT_BUCKET,
} from "./constants";

export { TASK_ATTACHMENT_BUCKET };

export function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File không được vượt quá 10MB.";
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Định dạng file không được hỗ trợ.";
  }
  return null;
}

export function buildTaskAttachmentPath(taskId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${taskId}/${Date.now()}-${safeName}`;
}

export async function getTaskAttachmentsTotalSize(taskId: string, prisma: {
  taskAttachment: { aggregate: (args: object) => Promise<{ _sum: { fileSize: number | null } }> };
}): Promise<number> {
  const result = await prisma.taskAttachment.aggregate({
    where: { taskId },
    _sum: { fileSize: true },
  });
  return result._sum.fileSize ?? 0;
}

export function wouldExceedTaskLimit(currentTotal: number, newFileSize: number): boolean {
  return currentTotal + newFileSize > MAX_TASK_TOTAL_BYTES;
}
