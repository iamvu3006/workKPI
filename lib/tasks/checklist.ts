import { prisma } from "@/lib/db/prisma";

export async function syncTaskProgressFromChecklist(taskId: string): Promise<number> {
  const items = await prisma.taskChecklistItem.findMany({
    where: { taskId },
    select: { isDone: true },
  });

  if (items.length === 0) return -1;

  const doneCount = items.filter((i) => i.isDone).length;
  const percent = Math.round((doneCount / items.length) * 100);

  await prisma.task.update({
    where: { id: taskId },
    data: { progressPercent: percent },
  });

  return percent;
}

export async function hasIncompleteChecklist(taskId: string): Promise<boolean> {
  const incomplete = await prisma.taskChecklistItem.count({
    where: { taskId, isDone: false },
  });
  const total = await prisma.taskChecklistItem.count({ where: { taskId } });
  return total > 0 && incomplete > 0;
}
