import type {
  Task,
  TaskAssignee,
  TaskAttachment,
  TaskChecklistItem,
  TaskComment,
  TaskStatusHistory,
  Profile,
} from "@prisma/client";

type AssigneeWithProfile = TaskAssignee & {
  assignee: Pick<Profile, "id" | "email" | "fullName" | "displayName" | "avatarUrl">;
};

export type TaskWithRelations = Task & {
  assignees?: AssigneeWithProfile[];
  creator?: Pick<Profile, "id" | "email" | "fullName" | "displayName">;
  checklistItems?: TaskChecklistItem[];
  attachments?: TaskAttachment[];
  comments?: (TaskComment & { author: Pick<Profile, "id" | "displayName" | "fullName" | "avatarUrl"> })[];
  statusHistory?: (TaskStatusHistory & {
    actor: Pick<Profile, "id" | "displayName" | "fullName">;
  })[];
  subtasks?: TaskWithRelations[];
  _count?: { subtasks?: number };
};

export function serializeTask(task: TaskWithRelations) {
  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  const isOverdue =
    task.status !== "DONE" &&
    task.status !== "CANCELLED" &&
    deadlineDate < new Date(now.toISOString().slice(0, 10));

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    weight: task.weight,
    deadline: task.deadline,
    progressPercent: task.progressPercent,
    tags: task.tags,
    pendingReason: task.pendingReason,
    pendingBlockType: task.pendingBlockType,
    rejectReason: task.rejectReason,
    startedAt: task.startedAt,
    submittedAt: task.submittedAt,
    completedAt: task.completedAt,
    parentTaskId: task.parentTaskId,
    departmentId: task.departmentId,
    createdById: task.createdById,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    isOverdue,
    creator: task.creator
      ? {
          id: task.creator.id,
          name: task.creator.displayName || task.creator.fullName || task.creator.email,
        }
      : undefined,
    assignees: task.assignees?.map((a) => ({
      id: a.assignee.id,
      name: a.assignee.displayName || a.assignee.fullName || a.assignee.email,
      avatarUrl: a.assignee.avatarUrl,
    })),
    checklistItems: task.checklistItems,
    attachments: task.attachments,
    comments: task.comments,
    statusHistory: task.statusHistory,
    subtasks: task.subtasks?.map(serializeTask),
    subtaskCount: task._count?.subtasks,
  };
}

export const taskListInclude = {
  assignees: {
    include: {
      assignee: {
        select: {
          id: true,
          email: true,
          fullName: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
  creator: {
    select: { id: true, email: true, fullName: true, displayName: true },
  },
  _count: { select: { subtasks: true } },
} as const;

export const taskDetailInclude = {
  ...taskListInclude,
  checklistItems: { orderBy: { sortOrder: "asc" as const } },
  attachments: { orderBy: { createdAt: "desc" as const } },
  statusHistory: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    include: {
      actor: { select: { id: true, displayName: true, fullName: true } },
    },
  },
} as const;
