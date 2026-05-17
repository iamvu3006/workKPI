import { prisma } from "@/lib/db/prisma";

export async function loadDepartmentAssignees(departmentId: string | null) {
  if (!departmentId) return [];

  const profiles = await prisma.profile.findMany({
    where: { departmentId, status: "ACTIVE" },
    select: { id: true, email: true, fullName: true, displayName: true },
    orderBy: { fullName: "asc" },
  });

  return profiles.map((p) => ({
    id: p.id,
    name: p.displayName || p.fullName || p.email,
  }));
}
