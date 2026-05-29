import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

import type { Prisma } from "@prisma/client";

function buildTaskScope(profile: { id: string; role: string; departmentId: string | null; teamId: string | null }): Prisma.TaskWhereInput {
  if (profile.role === "DIRECTOR" || profile.role === "ADMIN") {
    return {};
  }

  if (profile.role === "MANAGER") {
    return { departmentId: profile.departmentId ?? "__none__" };
  }

  if (profile.role === "LEADER") {
    if (!profile.teamId) return { id: "__none__" };

    return {
      assignees: {
        some: {
          assignee: {
            teamId: profile.teamId,
          },
        },
      },
    };
  }

  return {
    assignees: {
      some: {
        assigneeId: profile.id,
      },
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập.", code: "ERR_UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, departmentId: true, teamId: true, status: true },
    });

    if (!profile || profile.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Tài khoản không khả dụng.", code: "ERR_FORBIDDEN" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    if (!q || q.length < 3) {
      return NextResponse.json({ success: true, data: { tasks: [], users: [], departments: [] } });
    }

    const take = Math.min(10, Math.max(3, Number(url.searchParams.get("limit") || "5")));

    const [tasks, users, departments] = await Promise.all([
      prisma.task.findMany({
        where: {
          ...buildTaskScope(profile),
          deletedAt: null,
          parentTaskId: null,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, priority: true, deadline: true },
      }),
      prisma.profile.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take,
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, displayName: true, email: true, role: true },
      }),
      prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        take,
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true },
      }),
    ]);

    return NextResponse.json({ success: true, data: { tasks, users, departments } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Lỗi khi tìm kiếm.", code: "ERR_SEARCH" },
      { status: 500 }
    );
  }
}
