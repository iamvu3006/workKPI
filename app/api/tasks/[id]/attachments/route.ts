import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import {
  buildTaskAttachmentPath,
  getTaskAttachmentsTotalSize,
  TASK_ATTACHMENT_BUCKET,
  validateAttachmentFile,
  wouldExceedTaskLimit,
} from "@/lib/tasks/attachments";
import { canViewTask } from "@/lib/tasks/permissions";
import { createClient } from "@/utils/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { assignees: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);
    if (!canViewTask(task, auth.actor)) {
      return taskError("Không có quyền.", "ERR_FORBIDDEN", 403);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return taskError("Vui lòng chọn file.", "ERR_FILE", 400);
    }

    const validationError = validateAttachmentFile(file);
    if (validationError) return taskError(validationError, "ERR_FILE_VALIDATION", 400);

    const currentTotal = await getTaskAttachmentsTotalSize(taskId, prisma);
    if (wouldExceedTaskLimit(currentTotal, file.size)) {
      return taskError("Tổng dung lượng task vượt 50MB.", "ERR_TASK_SIZE", 400);
    }

    const storagePath = buildTaskAttachmentPath(taskId, file.name);
    const supabase = createClient(await cookies());
    const upload = await supabase.storage
      .from(TASK_ATTACHMENT_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (upload.error) {
      console.error("Supabase upload error details:", upload.error);
      return taskError("Không thể tải file lên.", "ERR_UPLOAD", 500);
    }

    const { data: urlData } = supabase.storage
      .from(TASK_ATTACHMENT_BUCKET)
      .getPublicUrl(upload.data.path);

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: auth.actor.id,
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        storagePath: upload.data.path,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return taskSuccess(attachment, "Tải file thành công", 201);
  } catch {
    return taskError("Không thể tải file.", "ERR_ATTACHMENT", 500);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: taskId } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const attachId = request.nextUrl.searchParams.get("attachId");
    if (!attachId) return taskError("Thiếu attachId.", "ERR_VALIDATION", 400);

    const attachment = await prisma.taskAttachment.findFirst({
      where: { id: attachId, taskId },
    });
    if (!attachment) return taskError("File không tồn tại.", "ERR_NOT_FOUND", 404);

    const supabase = createClient(await cookies());
    await supabase.storage.from(TASK_ATTACHMENT_BUCKET).remove([attachment.storagePath]);
    await prisma.taskAttachment.delete({ where: { id: attachId } });

    return taskSuccess(null, "Đã xóa file");
  } catch {
    return taskError("Không thể xóa file.", "ERR_DELETE_ATTACHMENT", 500);
  }
}
