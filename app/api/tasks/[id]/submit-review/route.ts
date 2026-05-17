import { NextRequest } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { validateSelfAssessment } from "@/lib/kpi/self-assessment";
import { createNotification } from "@/lib/notifications";
import { getTaskActor } from "@/lib/tasks/auth";
import { taskError, taskSuccess } from "@/lib/tasks/api-response";
import { hasIncompleteChecklist } from "@/lib/tasks/checklist";
import { MIN_REVIEW_SUMMARY_LENGTH } from "@/lib/tasks/constants";
import { isAssignee } from "@/lib/tasks/permissions";
import { taskListInclude, serializeTask } from "@/lib/tasks/serialize";
import { recordStatusChange } from "@/lib/tasks/status-history";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await getTaskActor();
    if ("error" in auth) return taskError(auth.error, "ERR_UNAUTHORIZED", auth.status);

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignees: true, attachments: true },
    });
    if (!task) return taskError("Task không tồn tại.", "ERR_NOT_FOUND", 404);

    if (!isAssignee(task, auth.actor.id)) {
      return taskError("Chỉ người được giao mới nộp nghiệm thu.", "ERR_FORBIDDEN", 403);
    }

    if (!["IN_PROGRESS", "PENDING"].includes(task.status)) {
      return taskError("Chỉ nộp nghiệm thu khi task đang làm hoặc Pending.", "ERR_STATUS", 400);
    }

    if (await hasIncompleteChecklist(id)) {
      return taskError("Hoàn thành checklist trước khi nộp Review.", "ERR_CHECKLIST", 400);
    }

    const body = await request.json();
    const summary = typeof body.summary === "string" ? body.summary.trim() : "";
    if (summary.length < MIN_REVIEW_SUMMARY_LENGTH) {
      return taskError(
        `Tóm tắt kết quả cần ít nhất ${MIN_REVIEW_SUMMARY_LENGTH} ký tự.`,
        "ERR_SUMMARY",
        400
      );
    }

    const selfResult = validateSelfAssessment(body.selfAssessment);
    if (!selfResult.ok) {
      return taskError(selfResult.error, "ERR_SELF_ASSESSMENT", 400);
    }

    const evidenceNote =
      typeof body.evidenceNote === "string" ? body.evidenceNote.trim() : "";
    const hasEvidence = task.attachments.length > 0 || evidenceNote.length >= 10;
    if (!hasEvidence) {
      return taskError(
        "Cần đính kèm file hoặc mô tả bằng chứng (ít nhất 10 ký tự).",
        "ERR_EVIDENCE",
        400
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "REVIEW",
        reviewSummary: summary,
        selfAssessment: selfResult.data,
        submittedAt: new Date(),
        reviewRejectReason: null,
      },
      include: taskListInclude,
    });

    await recordStatusChange({
      taskId: id,
      fromStatus: task.status,
      toStatus: "REVIEW",
      actorId: auth.actor.id,
      reason: summary.slice(0, 200),
      metadata: { evidenceNote: evidenceNote || null },
    });

    if (task.createdById !== auth.actor.id) {
      await createNotification({
        userId: task.createdById,
        type: "REVIEW_NEEDED",
        title: "Task chờ nghiệm thu",
        body: `Task "${task.title}" đã được nộp nghiệm thu.`,
        payload: { taskId: id, link: `/dashboard/tasks/${id}` },
      });
    }

    const deptManager = await prisma.department.findUnique({
      where: { id: task.departmentId },
      select: { managerId: true },
    });
    if (deptManager && deptManager.managerId !== task.createdById) {
      await createNotification({
        userId: deptManager.managerId,
        type: "REVIEW_NEEDED",
        title: "Task chờ nghiệm thu",
        body: `Task "${task.title}" đã được nộp nghiệm thu.`,
        payload: { taskId: id, link: `/dashboard/tasks/${id}` },
      });
    }

    return taskSuccess(serializeTask(updated), "Nộp nghiệm thu thành công");
  } catch {
    return taskError("Không thể nộp nghiệm thu.", "ERR_SUBMIT_REVIEW", 500);
  }
}
